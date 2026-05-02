package com.imms.phar.service;

import com.imms.phar.model.*;
import com.imms.phar.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.util.IOUtils;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PharExcelParserService {

    // Remove POI's 100 MB hard limit at JVM class-load time — must be static so it
    // runs before ANY XSSFWorkbook construction, even from other threads.
    static {
        IOUtils.setByteArrayMaxOverride(-1);
    }

    @Autowired private PharZoneRepository zoneRepo;
    @Autowired private PharTerritoryRepository territoryRepo;
    @Autowired private PharSalesManagerRepository smRepo;
    @Autowired private PharSalesRepresentativeRepository srRepo;
    @Autowired private PharShopRepository shopRepo;
    @Autowired private PharTierRepository tierRepo;
    @Autowired private PharProductRepository productRepo;
    @Autowired private PharSalesRecordRepository salesRepo;
    @Autowired private PharUploadLogRepository uploadLogRepo;
    @Autowired private PharCommissionService commissionService;

    private static final int BATCH_SIZE = 500;


    // ── In-memory job progress store ──────────────────────────────────────────
    public static class JobProgress {
        public String jobId;
        public String status;      // QUEUED, PROCESSING, SUCCESS, PARTIAL, FAILED
        public int totalRows;
        public int processedRows;
        public int importedRows;
        public int errorRows;
        public String currentStep; // "Reading file", "Saving records", "Calculating commissions"
        public String errorSummary;
        public Long logId;

        public int getPercent() {
            if (totalRows <= 0) return 0;
            return Math.min(100, (int) ((processedRows * 100L) / totalRows));
        }
    }

    private final ConcurrentHashMap<String, JobProgress> jobs = new ConcurrentHashMap<>();

    public JobProgress getProgress(String jobId) {
        return jobs.get(jobId);
    }

    // ── Synchronous start: save log, return jobId immediately ─────────────────
    public String startImport(MultipartFile file) throws Exception {
        String jobId = UUID.randomUUID().toString();

        PharUploadLog log = new PharUploadLog();
        log.setFilename(file.getOriginalFilename());
        log.setStatus("PROCESSING");
        uploadLogRepo.save(log);

        JobProgress prog = new JobProgress();
        prog.jobId = jobId;
        prog.status = "QUEUED";
        prog.currentStep = "Saving file to disk...";
        prog.logId = log.getId();
        jobs.put(jobId, prog);

        // Stream directly to temp file — avoids loading entire file into JVM heap.
        // transferTo() is the most efficient way to save a MultipartFile to disk.
        File tempFile = File.createTempFile("phar_upload_" + jobId + "_", ".xlsx");
        file.transferTo(tempFile);

        processAsync(jobId, tempFile, log);
        return jobId;
    }

    // ── Async batch processor ─────────────────────────────────────────────────
    @Async("pharUploadExecutor")
    public void processAsync(String jobId, File tempFile, PharUploadLog log) {
        JobProgress prog = jobs.get(jobId);
        prog.status = "PROCESSING";
        prog.currentStep = "Reading Excel file...";

        List<String> errors = new ArrayList<>();
        int imported = 0;

        try {
            // Open workbook directly from file — avoids POI's byte-array length check entirely.
            // File-based XSSFWorkbook uses memory-mapped I/O with no size restriction.
            try (XSSFWorkbook workbook = new XSSFWorkbook(tempFile)) {

                Sheet sheet = workbook.getSheetAt(0);
                int lastRow = sheet.getLastRowNum();
                prog.totalRows = lastRow;
                prog.currentStep = "Parsing " + lastRow + " rows...";

                Map<String, PharZone>               zoneCache    = new HashMap<>();
                Map<String, PharTerritory>           terrCache    = new HashMap<>();
                Map<String, PharSalesManager>        smCache      = new HashMap<>();
                Map<String, PharSalesRepresentative> srCache      = new HashMap<>();
                Map<String, PharShop>                shopCache    = new HashMap<>();
                Map<Integer, PharTier>               tierCache    = new HashMap<>();
                Map<String, PharProduct>             productCache = new HashMap<>();

                List<PharSalesRecord> batch = new ArrayList<>(BATCH_SIZE);

                for (int i = 1; i <= lastRow; i++) {
                    Row row = sheet.getRow(i);
                    if (row == null || isRowEmpty(row)) { prog.processedRows++; continue; }

                    try {
                        PharSalesRecord record = parseRow(
                            row, i + 1, log,
                            zoneCache, terrCache, smCache, srCache, shopCache, tierCache, productCache
                        );
                        if (record != null) {
                            batch.add(record);
                            imported++;
                        }
                    } catch (Exception e) {
                        errors.add("Row " + (i + 1) + ": " + e.getMessage());
                        prog.errorRows++;
                    }

                    prog.processedRows++;
                    prog.importedRows = imported;

                    if (batch.size() >= BATCH_SIZE) {
                        prog.currentStep = "Saving batch... (" + imported + " saved so far)";
                        flushBatch(batch);
                    }
                }

                if (!batch.isEmpty()) {
                    prog.currentStep = "Saving final batch...";
                    flushBatch(batch);
                }

                prog.currentStep = "Calculating commissions...";
                commissionService.recalculateAll();

                log.setStatus(errors.isEmpty() ? "SUCCESS" : "PARTIAL");
                log.setRecordsImported(imported);
                if (!errors.isEmpty()) {
                    log.setErrorMessage(String.join("; ", errors.subList(0, Math.min(errors.size(), 10))));
                }

            } // end workbook

        } catch (Exception e) {
            log.setStatus("FAILED");
            String msg = e.getMessage() != null ? e.getMessage() : "Unknown error";
            log.setErrorMessage(msg.length() > 2000 ? msg.substring(0, 2000) : msg);
            prog.status = "FAILED";
            prog.errorSummary = log.getErrorMessage();
        } finally {
            // Always delete temp file
            if (tempFile != null && tempFile.exists()) tempFile.delete();
        }

        uploadLogRepo.save(log);

        prog.status = log.getStatus();
        prog.importedRows = imported;
        prog.processedRows = prog.totalRows;
        prog.currentStep = "Done";
        prog.errorSummary = log.getErrorMessage();
    }

    @Transactional
    public void flushBatch(List<PharSalesRecord> batch) {
        salesRepo.saveAll(batch);
        batch.clear();
    }

    // ── Row parser (cache-aware) ───────────────────────────────────────────────
    private PharSalesRecord parseRow(
            Row row, int rowNum, PharUploadLog uploadLog,
            Map<String, PharZone> zoneCache,
            Map<String, PharTerritory> terrCache,
            Map<String, PharSalesManager> smCache,
            Map<String, PharSalesRepresentative> srCache,
            Map<String, PharShop> shopCache,
            Map<Integer, PharTier> tierCache,
            Map<String, PharProduct> productCache) {

        String dateStr  = getCellString(row, 0);
        String zoneName = getCellString(row, 1);
        String terrName = getCellString(row, 2);
        String smName   = getCellString(row, 3);
        String srName   = getCellString(row, 4);
        String shopName = getCellString(row, 5);
        String prodName = getCellString(row, 6);
        String sku      = getCellString(row, 7);
        String tierStr  = getCellString(row, 8);
        String qtyStr   = getCellString(row, 9);
        String priceStr = getCellString(row, 10);

        if (dateStr.isBlank() || shopName.isBlank() || prodName.isBlank()) return null;

        LocalDate saleDate = parseDate(dateStr);
        int tierNum = (int) Math.round(Double.parseDouble(tierStr.trim()));
        int qty     = (int) Math.round(Double.parseDouble(qtyStr.trim()));
        BigDecimal price = new BigDecimal(priceStr.trim().replace(",", ""));

        PharZone zone            = zoneCache.computeIfAbsent(zoneName.trim(), k -> upsertZone(k));
        PharSalesManager sm      = smCache.computeIfAbsent(smName.trim() + "|" + zone.getId(), k -> upsertSM(smName.trim(), zone));
        PharTerritory territory  = terrCache.computeIfAbsent(terrName.trim() + "|" + zone.getId(), k -> upsertTerritory(terrName.trim(), zone));
        PharSalesRepresentative sr = srCache.computeIfAbsent(srName.trim() + "|" + territory.getId(), k -> upsertSR(srName.trim(), territory, sm));
        PharShop shop            = shopCache.computeIfAbsent(shopName.trim() + "|" + sr.getId(), k -> upsertShop(shopName.trim(), sr));
        PharTier tier            = tierCache.computeIfAbsent(tierNum, k -> upsertTier(k));
        String skuKey            = sku.isBlank() ? prodName.toUpperCase().replace(" ", "-") : sku;
        PharProduct product      = productCache.computeIfAbsent(skuKey.toUpperCase(), k -> upsertProduct(prodName.trim(), skuKey, tier));

        PharSalesRecord record = new PharSalesRecord();
        record.setShop(shop);
        record.setProduct(product);
        record.setQuantity(qty);
        record.setUnitPrice(price);
        record.setTotalAmount(price.multiply(BigDecimal.valueOf(qty)));
        record.setSaleDate(saleDate);
        record.setUploadLog(uploadLog);
        return record;
    }

    // ── Upserts ───────────────────────────────────────────────────────────────
    private PharZone upsertZone(String name) {
        return zoneRepo.findByNameIgnoreCase(name)
                .orElseGet(() -> { PharZone z = new PharZone(); z.setName(name); return zoneRepo.save(z); });
    }
    private PharSalesManager upsertSM(String name, PharZone zone) {
        return smRepo.findByNameIgnoreCaseAndZoneId(name, zone.getId())
                .orElseGet(() -> { PharSalesManager s = new PharSalesManager(); s.setName(name); s.setZone(zone); return smRepo.save(s); });
    }
    private PharTerritory upsertTerritory(String name, PharZone zone) {
        return territoryRepo.findByNameIgnoreCaseAndZoneId(name, zone.getId())
                .orElseGet(() -> { PharTerritory t = new PharTerritory(); t.setName(name); t.setZone(zone); return territoryRepo.save(t); });
    }
    private PharSalesRepresentative upsertSR(String name, PharTerritory territory, PharSalesManager sm) {
        return srRepo.findByNameIgnoreCaseAndTerritoryId(name, territory.getId())
                .orElseGet(() -> { PharSalesRepresentative r = new PharSalesRepresentative(); r.setName(name); r.setTerritory(territory); r.setSalesManager(sm); return srRepo.save(r); });
    }
    private PharShop upsertShop(String name, PharSalesRepresentative sr) {
        return shopRepo.findByNameIgnoreCaseAndSalesRepresentativeId(name, sr.getId())
                .orElseGet(() -> { PharShop s = new PharShop(); s.setName(name); s.setSalesRepresentative(sr); return shopRepo.save(s); });
    }
    private PharTier upsertTier(int num) {
        return tierRepo.findByTierNumber(num)
                .orElseGet(() -> { PharTier t = new PharTier(); t.setTierNumber(num); t.setLabel("Tier " + num); return tierRepo.save(t); });
    }
    private PharProduct upsertProduct(String name, String sku, PharTier tier) {
        return productRepo.findBySkuIgnoreCase(sku)
                .orElseGet(() -> { PharProduct p = new PharProduct(); p.setName(name); p.setSku(sku.trim()); p.setTier(tier); return productRepo.save(p); });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private LocalDate parseDate(String s) {
        s = s.trim();
        for (String fmt : new String[]{"yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "dd-MM-yyyy"}) {
            try { return LocalDate.parse(s, DateTimeFormatter.ofPattern(fmt)); } catch (DateTimeParseException ignored) {}
        }
        throw new IllegalArgumentException("Cannot parse date: " + s);
    }

    private String getCellString(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> DateUtil.isCellDateFormatted(cell)
                    ? cell.getLocalDateTimeCellValue().toLocalDate().toString()
                    : String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCachedFormulaResultType() == CellType.NUMERIC
                    ? String.valueOf((long) cell.getNumericCellValue())
                    : cell.getStringCellValue();
            default -> "";
        };
    }

    private boolean isRowEmpty(Row row) {
        for (int c = 0; c < 11; c++) {
            if (!getCellString(row, c).isBlank()) return false;
        }
        return true;
    }
}
