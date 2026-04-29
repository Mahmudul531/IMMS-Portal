package com.imms.phar.service;

import com.imms.phar.model.*;
import com.imms.phar.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PharDashboardService {

    @Autowired private PharSalesRecordRepository salesRepo;
    @Autowired private PharCommissionResultRepository commissionRepo;
    @Autowired private PharZoneRepository zoneRepo;
    @Autowired private PharSalesRepresentativeRepository srRepo;
    @Autowired private PharShopRepository shopRepo;
    @Autowired private PharTierRepository tierRepo;

    public Map<String, Object> getSummary(String period) {
        List<PharSalesRecord> records = period != null && !period.isBlank()
                ? salesRepo.findByPeriod(period)
                : salesRepo.findAll();

        BigDecimal totalSales = records.stream()
                .map(PharSalesRecord::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        List<PharCommissionResult> commissions = period != null && !period.isBlank()
                ? commissionRepo.findByPeriod(period)
                : commissionRepo.findAll();

        BigDecimal totalCommission = commissions.stream()
                .map(PharCommissionResult::getTotalCommission).reduce(BigDecimal.ZERO, BigDecimal::add);

        long activeShops = records.stream().map(r -> r.getShop().getId()).distinct().count();
        long activeSRs = records.stream()
                .map(r -> r.getShop().getSalesRepresentative().getId()).distinct().count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSales", totalSales);
        summary.put("totalCommission", totalCommission);
        summary.put("activeShops", activeShops);
        summary.put("activeSRs", activeSRs);
        summary.put("totalRecords", records.size());
        return summary;
    }

    public List<Map<String, Object>> getByZone(String period) {
        List<PharSalesRecord> records = period != null && !period.isBlank()
                ? salesRepo.findByPeriod(period) : salesRepo.findAll();

        Map<String, BigDecimal> byZone = new LinkedHashMap<>();
        for (PharSalesRecord r : records) {
            String zone = r.getShop().getSalesRepresentative().getTerritory().getZone().getName();
            byZone.merge(zone, r.getTotalAmount(), BigDecimal::add);
        }
        return toList(byZone, "zone");
    }

    public List<Map<String, Object>> getByTerritory(String period) {
        List<PharSalesRecord> records = period != null && !period.isBlank()
                ? salesRepo.findByPeriod(period) : salesRepo.findAll();

        Map<String, BigDecimal> grouped = new LinkedHashMap<>();
        for (PharSalesRecord r : records) {
            String key = r.getShop().getSalesRepresentative().getTerritory().getName();
            grouped.merge(key, r.getTotalAmount(), BigDecimal::add);
        }
        return toList(grouped, "territory");
    }

    public List<Map<String, Object>> getBySM(String period) {
        List<PharSalesRecord> records = period != null && !period.isBlank()
                ? salesRepo.findByPeriod(period) : salesRepo.findAll();

        Map<String, BigDecimal> grouped = new LinkedHashMap<>();
        for (PharSalesRecord r : records) {
            String key = r.getShop().getSalesRepresentative().getSalesManager().getName();
            grouped.merge(key, r.getTotalAmount(), BigDecimal::add);
        }
        return toList(grouped, "salesManager");
    }

    public List<Map<String, Object>> getBySR(String period) {
        List<PharSalesRecord> records = period != null && !period.isBlank()
                ? salesRepo.findByPeriod(period) : salesRepo.findAll();

        Map<String, BigDecimal> grouped = new LinkedHashMap<>();
        for (PharSalesRecord r : records) {
            String key = r.getShop().getSalesRepresentative().getName();
            grouped.merge(key, r.getTotalAmount(), BigDecimal::add);
        }
        return toList(grouped, "sr");
    }

    public List<Map<String, Object>> getByShop(String period) {
        List<PharSalesRecord> records = period != null && !period.isBlank()
                ? salesRepo.findByPeriod(period) : salesRepo.findAll();

        Map<String, BigDecimal> grouped = new LinkedHashMap<>();
        for (PharSalesRecord r : records) {
            grouped.merge(r.getShop().getName(), r.getTotalAmount(), BigDecimal::add);
        }
        // Sort descending, top 20
        return grouped.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(20)
                .map(e -> { Map<String, Object> m = new HashMap<>(); m.put("shop", e.getKey()); m.put("sales", e.getValue()); return m; })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getByTier(String period) {
        List<PharSalesRecord> records = period != null && !period.isBlank()
                ? salesRepo.findByPeriod(period) : salesRepo.findAll();

        Map<String, BigDecimal> grouped = new LinkedHashMap<>();
        for (PharSalesRecord r : records) {
            String key = r.getProduct().getTier().getLabel();
            grouped.merge(key, r.getTotalAmount(), BigDecimal::add);
        }
        return toList(grouped, "tier");
    }

    public List<Map<String, Object>> getMonthlyTrend() {
        List<PharSalesRecord> all = salesRepo.findAll();
        Map<String, BigDecimal> byMonth = new TreeMap<>();
        for (PharSalesRecord r : all) {
            String month = r.getSaleDate().getYear() + "-" + String.format("%02d", r.getSaleDate().getMonthValue());
            byMonth.merge(month, r.getTotalAmount(), BigDecimal::add);
        }
        return toList(byMonth, "month");
    }

    public List<Map<String, Object>> getCommissionSummary(String period) {
        List<PharCommissionResult> results = period != null && !period.isBlank()
                ? commissionRepo.findByPeriod(period) : commissionRepo.findAll();

        // Group by SR
        Map<String, Map<String, BigDecimal>> bySR = new LinkedHashMap<>();
        for (PharCommissionResult r : results) {
            String srName = r.getShop().getSalesRepresentative().getName();
            bySR.computeIfAbsent(srName, k -> new HashMap<>());
            bySR.get(srName).merge("totalSales", r.getTotalSales(), BigDecimal::add);
            bySR.get(srName).merge("totalCommission", r.getTotalCommission(), BigDecimal::add);
        }

        return bySR.entrySet().stream().map(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put("sr", e.getKey());
            m.put("totalSales", e.getValue().get("totalSales"));
            m.put("totalCommission", e.getValue().get("totalCommission"));
            return m;
        }).collect(Collectors.toList());
    }

    public List<String> getAvailablePeriods() {
        return salesRepo.findAll().stream()
                .map(r -> r.getSaleDate().getYear() + "-" + String.format("%02d", r.getSaleDate().getMonthValue()))
                .distinct().sorted(Comparator.reverseOrder()).collect(Collectors.toList());
    }

    private List<Map<String, Object>> toList(Map<String, BigDecimal> map, String keyName) {
        return map.entrySet().stream().map(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put(keyName, e.getKey());
            m.put("sales", e.getValue());
            return m;
        }).collect(Collectors.toList());
    }
}
