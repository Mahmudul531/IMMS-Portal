package com.imms.phar.service;

import com.imms.phar.model.*;
import com.imms.phar.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
public class PharExcelParserService {

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

    /**
     * Expected Excel columns (row 1 = header, row 2+ = data):
     * A: Date (YYYY-MM-DD or DD/MM/YYYY)
     * B: Zone
     * C: Territory
     * D: Sales Manager
     * E: Sales Representative
     * F: Shop Name
     * G: Product Name
     * H: Product SKU
     * I: Tier (1, 2, or 3)
     * J: Quantity
     * K: Unit Price
     */
    public PharUploadLog parseAndImport(MultipartFile file) {
        PharUploadLog log = new PharUploadLog();
        log.setFilename(file.getOriginalFilename());
        log.setStatus("PROCESSING");
        uploadLogRepo.save(log);

        int imported = 0;
        List<String> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            int lastRow = sheet.getLastRowNum();

            for (int i = 1; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;

                try {
                    PharSalesRecord record = parseRow(row, i + 1, log);
                    if (record != null) {
                        salesRepo.save(record);
                        imported++;
                    }
                } catch (Exception e) {
                    errors.add("Row " + (i + 1) + ": " + e.getMessage());
                }
            }

            // Recalculate commissions for affected periods
            commissionService.recalculateAll();

            log.setStatus(errors.isEmpty() ? "SUCCESS" : "PARTIAL");
            log.setRecordsImported(imported);
            if (!errors.isEmpty()) {
                log.setErrorMessage(String.join("; ", errors.subList(0, Math.min(errors.size(), 10))));
            }

        } catch (Exception e) {
            log.setStatus("FAILED");
            log.setErrorMessage(e.getMessage());
        }

        return uploadLogRepo.save(log);
    }

    private PharSalesRecord parseRow(Row row, int rowNum, PharUploadLog uploadLog) {
        String dateStr   = getCellString(row, 0);
        String zoneName  = getCellString(row, 1);
        String terrName  = getCellString(row, 2);
        String smName    = getCellString(row, 3);
        String srName    = getCellString(row, 4);
        String shopName  = getCellString(row, 5);
        String prodName  = getCellString(row, 6);
        String sku       = getCellString(row, 7);
        String tierStr   = getCellString(row, 8);
        String qtyStr    = getCellString(row, 9);
        String priceStr  = getCellString(row, 10);

        if (dateStr.isBlank() || shopName.isBlank() || prodName.isBlank()) return null;

        LocalDate saleDate = parseDate(dateStr);
        int tierNum = (int) Math.round(Double.parseDouble(tierStr.trim()));
        int qty = (int) Math.round(Double.parseDouble(qtyStr.trim()));
        BigDecimal price = new BigDecimal(priceStr.trim().replace(",", ""));

        // Upsert hierarchy
        PharZone zone = upsertZone(zoneName);
        PharSalesManager sm = upsertSM(smName, zone);
        PharTerritory territory = upsertTerritory(terrName, zone);
        PharSalesRepresentative sr = upsertSR(srName, territory, sm);
        PharShop shop = upsertShop(shopName, sr);
        PharTier tier = upsertTier(tierNum);
        PharProduct product = upsertProduct(prodName, sku.isBlank() ? prodName.toUpperCase().replace(" ", "-") : sku, tier);

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

    private LocalDate parseDate(String s) {
        s = s.trim();
        String[] formats = {"yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "dd-MM-yyyy"};
        for (String fmt : formats) {
            try { return LocalDate.parse(s, DateTimeFormatter.ofPattern(fmt)); } catch (DateTimeParseException ignored) {}
        }
        throw new IllegalArgumentException("Cannot parse date: " + s);
    }

    private PharZone upsertZone(String name) {
        return zoneRepo.findByNameIgnoreCase(name.trim())
                .orElseGet(() -> { PharZone z = new PharZone(); z.setName(name.trim()); return zoneRepo.save(z); });
    }

    private PharSalesManager upsertSM(String name, PharZone zone) {
        return smRepo.findByNameIgnoreCaseAndZoneId(name.trim(), zone.getId())
                .orElseGet(() -> { PharSalesManager sm = new PharSalesManager(); sm.setName(name.trim()); sm.setZone(zone); return smRepo.save(sm); });
    }

    private PharTerritory upsertTerritory(String name, PharZone zone) {
        return territoryRepo.findByNameIgnoreCaseAndZoneId(name.trim(), zone.getId())
                .orElseGet(() -> { PharTerritory t = new PharTerritory(); t.setName(name.trim()); t.setZone(zone); return territoryRepo.save(t); });
    }

    private PharSalesRepresentative upsertSR(String name, PharTerritory territory, PharSalesManager sm) {
        return srRepo.findByNameIgnoreCaseAndTerritoryId(name.trim(), territory.getId())
                .orElseGet(() -> { PharSalesRepresentative sr = new PharSalesRepresentative(); sr.setName(name.trim()); sr.setTerritory(territory); sr.setSalesManager(sm); return srRepo.save(sr); });
    }

    private PharShop upsertShop(String name, PharSalesRepresentative sr) {
        return shopRepo.findByNameIgnoreCaseAndSalesRepresentativeId(name.trim(), sr.getId())
                .orElseGet(() -> { PharShop s = new PharShop(); s.setName(name.trim()); s.setSalesRepresentative(sr); return shopRepo.save(s); });
    }

    private PharTier upsertTier(int num) {
        return tierRepo.findByTierNumber(num)
                .orElseGet(() -> { PharTier t = new PharTier(); t.setTierNumber(num); t.setLabel("Tier " + num); return tierRepo.save(t); });
    }

    private PharProduct upsertProduct(String name, String sku, PharTier tier) {
        return productRepo.findBySkuIgnoreCase(sku)
                .orElseGet(() -> { PharProduct p = new PharProduct(); p.setName(name.trim()); p.setSku(sku.trim()); p.setTier(tier); return productRepo.save(p); });
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
