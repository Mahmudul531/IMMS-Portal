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

    /** Resolve records based on optional period and/or zone filters */
    private List<PharSalesRecord> getRecords(String period, String zone) {
        boolean hasPeriod = period != null && !period.isBlank();
        boolean hasZone   = zone   != null && !zone.isBlank();

        if (hasPeriod && hasZone) return salesRepo.findByPeriodAndZone(period, zone);
        if (hasPeriod)            return salesRepo.findByPeriod(period);
        if (hasZone)              return salesRepo.findByZone(zone);
        return salesRepo.findAll();
    }

    public Map<String, Object> getSummary(String period, String zone) {
        List<PharSalesRecord> records = getRecords(period, zone);

        BigDecimal totalSales = records.stream()
                .map(PharSalesRecord::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Commission: filter by period only (commissions don't have zone directly here)
        List<PharCommissionResult> commissions;
        boolean hasPeriod = period != null && !period.isBlank();
        boolean hasZone   = zone   != null && !zone.isBlank();
        if (hasPeriod) {
            commissions = commissionRepo.findByPeriod(period);
        } else {
            commissions = commissionRepo.findAll();
        }
        // If zone also selected, filter commissions by zone via SR -> territory -> zone
        if (hasZone) {
            commissions = commissions.stream()
                    .filter(c -> c.getShop().getSalesRepresentative().getTerritory().getZone().getName().equals(zone))
                    .collect(Collectors.toList());
        }

        BigDecimal totalCommission = commissions.stream()
                .map(PharCommissionResult::getTotalCommission).reduce(BigDecimal.ZERO, BigDecimal::add);

        long activeShops = records.stream().map(r -> r.getShop().getId()).distinct().count();
        long activeSRs   = records.stream()
                .map(r -> r.getShop().getSalesRepresentative().getId()).distinct().count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSales",      totalSales);
        summary.put("totalCommission", totalCommission);
        summary.put("activeShops",     activeShops);
        summary.put("activeSRs",       activeSRs);
        summary.put("totalRecords",    records.size());
        return summary;
    }

    public List<Map<String, Object>> getByZone(String period, String zone) {
        List<PharSalesRecord> records = getRecords(period, zone);
        Map<String, BigDecimal> byZone = new LinkedHashMap<>();
        for (PharSalesRecord r : records) {
            String z = r.getShop().getSalesRepresentative().getTerritory().getZone().getName();
            byZone.merge(z, r.getTotalAmount(), BigDecimal::add);
        }
        return toList(byZone, "zone");
    }

    public List<Map<String, Object>> getByTerritory(String period, String zone) {
        List<PharSalesRecord> records = getRecords(period, zone);
        Map<String, BigDecimal> grouped = new LinkedHashMap<>();
        for (PharSalesRecord r : records) {
            String key = r.getShop().getSalesRepresentative().getTerritory().getName();
            grouped.merge(key, r.getTotalAmount(), BigDecimal::add);
        }
        return toList(grouped, "territory");
    }

    public List<Map<String, Object>> getBySM(String period, String zone) {
        List<PharSalesRecord> records = getRecords(period, zone);
        Map<String, BigDecimal> grouped = new LinkedHashMap<>();
        for (PharSalesRecord r : records) {
            String key = r.getShop().getSalesRepresentative().getSalesManager().getName();
            grouped.merge(key, r.getTotalAmount(), BigDecimal::add);
        }
        return toList(grouped, "salesManager");
    }

    public List<Map<String, Object>> getBySR(String period, String zone) {
        List<PharSalesRecord> records = getRecords(period, zone);
        Map<String, BigDecimal> grouped = new LinkedHashMap<>();
        for (PharSalesRecord r : records) {
            String key = r.getShop().getSalesRepresentative().getName();
            grouped.merge(key, r.getTotalAmount(), BigDecimal::add);
        }
        return toList(grouped, "sr");
    }

    public List<Map<String, Object>> getByShop(String period, String zone) {
        List<PharSalesRecord> records = getRecords(period, zone);
        Map<String, BigDecimal> grouped = new LinkedHashMap<>();
        for (PharSalesRecord r : records) {
            grouped.merge(r.getShop().getName(), r.getTotalAmount(), BigDecimal::add);
        }
        return grouped.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(50)
                .map(e -> { Map<String, Object> m = new HashMap<>(); m.put("shop", e.getKey()); m.put("sales", e.getValue()); return m; })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getByTier(String period, String zone) {
        List<PharSalesRecord> records = getRecords(period, zone);
        Map<String, BigDecimal> grouped = new LinkedHashMap<>();
        for (PharSalesRecord r : records) {
            String key = r.getProduct().getTier().getLabel();
            grouped.merge(key, r.getTotalAmount(), BigDecimal::add);
        }
        return toList(grouped, "tier");
    }

    public List<Map<String, Object>> getMonthlyTrend(String period, String zone) {
        List<PharSalesRecord> records = getRecords(period, zone);
        Map<String, BigDecimal> byMonth = new TreeMap<>();
        for (PharSalesRecord r : records) {
            String month = r.getSaleDate().getYear() + "-" + String.format("%02d", r.getSaleDate().getMonthValue());
            byMonth.merge(month, r.getTotalAmount(), BigDecimal::add);
        }
        return toList(byMonth, "month");
    }

    public List<Map<String, Object>> getCommissionSummary(String period, String zone) {
        boolean hasPeriod = period != null && !period.isBlank();
        boolean hasZone   = zone   != null && !zone.isBlank();

        List<PharCommissionResult> results = hasPeriod
                ? commissionRepo.findByPeriod(period) : commissionRepo.findAll();

        if (hasZone) {
            results = results.stream()
                    .filter(c -> c.getShop().getSalesRepresentative().getTerritory().getZone().getName().equals(zone))
                    .collect(Collectors.toList());
        }

        Map<String, Map<String, BigDecimal>> bySR = new LinkedHashMap<>();
        for (PharCommissionResult r : results) {
            String srName = r.getShop().getSalesRepresentative().getName();
            bySR.computeIfAbsent(srName, k -> new HashMap<>());
            bySR.get(srName).merge("totalSales",      r.getTotalSales(),      BigDecimal::add);
            bySR.get(srName).merge("totalCommission", r.getTotalCommission(), BigDecimal::add);
        }

        return bySR.entrySet().stream().map(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put("sr",              e.getKey());
            m.put("totalSales",      e.getValue().get("totalSales"));
            m.put("totalCommission", e.getValue().get("totalCommission"));
            return m;
        }).collect(Collectors.toList());
    }

    public List<String> getAvailablePeriods() {
        return salesRepo.findAll().stream()
                .map(r -> r.getSaleDate().getYear() + "-" + String.format("%02d", r.getSaleDate().getMonthValue()))
                .distinct().sorted(Comparator.reverseOrder()).collect(Collectors.toList());
    }

    public List<String> getAvailableZones() {
        return zoneRepo.findAll().stream()
                .map(z -> z.getName())
                .distinct().sorted().collect(Collectors.toList());
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
