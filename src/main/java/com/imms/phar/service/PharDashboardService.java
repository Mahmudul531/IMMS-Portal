package com.imms.phar.service;

import com.imms.phar.model.*;
import com.imms.phar.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PharDashboardService {

    @Autowired private PharSalesRecordRepository salesRepo;
    @Autowired private PharCommissionResultRepository commissionRepo;
    @Autowired private PharZoneRepository zoneRepo;

    private String safeStr(String val) {
        return (val == null) ? "" : val;
    }

    public Map<String, Object> getSummary(String period, String zone) {
        String p = safeStr(period);
        String z = safeStr(zone);
        
        List<Object[]> metricsList = salesRepo.getSummaryMetrics(p, z);
        Object[] metrics = metricsList != null && !metricsList.isEmpty() ? metricsList.get(0) : null;
        
        BigDecimal totalSales = metrics != null && metrics.length > 0 && metrics[0] != null ? new BigDecimal(metrics[0].toString()) : BigDecimal.ZERO;
        long activeShops = metrics != null && metrics.length > 1 && metrics[1] != null ? Long.parseLong(metrics[1].toString()) : 0;
        long activeSRs = metrics != null && metrics.length > 2 && metrics[2] != null ? Long.parseLong(metrics[2].toString()) : 0;
        long totalRecords = metrics != null && metrics.length > 3 && metrics[3] != null ? Long.parseLong(metrics[3].toString()) : 0;

        List<Object[]> comm = commissionRepo.sumCommissionBySR(p, z);
        BigDecimal totalCommission = comm.stream()
            .map(row -> row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSales",      totalSales);
        summary.put("totalCommission", totalCommission);
        summary.put("activeShops",     activeShops);
        summary.put("activeSRs",       activeSRs);
        summary.put("totalRecords",    totalRecords);
        return summary;
    }

    public List<Map<String, Object>> getByZone(String period, String zone) {
        return toList(salesRepo.sumSalesByZone(safeStr(period), safeStr(zone)), "zone");
    }

    public List<Map<String, Object>> getByTerritory(String period, String zone) {
        return toList(salesRepo.sumSalesByTerritory(safeStr(period), safeStr(zone)), "territory");
    }

    public List<Map<String, Object>> getBySM(String period, String zone) {
        return toList(salesRepo.sumSalesBySM(safeStr(period), safeStr(zone)), "salesManager");
    }

    public List<Map<String, Object>> getBySR(String period, String zone) {
        return toList(salesRepo.sumSalesBySR(safeStr(period), safeStr(zone)), "sr");
    }

    public List<Map<String, Object>> getByShop(String period, String zone) {
        return toList(salesRepo.sumSalesByShop(safeStr(period), safeStr(zone), PageRequest.of(0, 50)), "shop");
    }

    public List<Map<String, Object>> getByTier(String period, String zone) {
        return toList(salesRepo.sumSalesByTier(safeStr(period), safeStr(zone)), "tier");
    }

    public List<Map<String, Object>> getMonthlyTrend(String period, String zone) {
        return toList(salesRepo.sumSalesByMonth(safeStr(period), safeStr(zone)), "month");
    }

    public List<Map<String, Object>> getCommissionSummary(String period, String zone) {
        List<Object[]> results = commissionRepo.sumCommissionBySR(safeStr(period), safeStr(zone));
        return results.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("sr", row[0]);
            m.put("totalSales", row[1]);
            m.put("totalCommission", row[2]);
            return m;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getShopCommissionSummary(String period, String zone) {
        List<PharCommissionResult> detailed = commissionRepo.findDetailed(safeStr(period), safeStr(zone));
        
        // Group by Shop ID
        Map<Long, Map<String, Object>> shopMap = new LinkedHashMap<>();
        
        for (PharCommissionResult r : detailed) {
            PharShop shop = r.getShop();
            shopMap.computeIfAbsent(shop.getId(), id -> {
                Map<String, Object> m = new HashMap<>();
                m.put("zone", shop.getSalesRepresentative().getTerritory().getZone().getName());
                m.put("territory", shop.getSalesRepresentative().getTerritory().getName());
                m.put("shopName", shop.getName());
                m.put("sm", shop.getSalesRepresentative().getSalesManager().getName());
                m.put("t1Sales", BigDecimal.ZERO);
                m.put("t2Sales", BigDecimal.ZERO);
                m.put("t3Sales", BigDecimal.ZERO);
                m.put("t1Commission", BigDecimal.ZERO);
                m.put("t2Commission", BigDecimal.ZERO);
                m.put("t3Commission", BigDecimal.ZERO);
                m.put("totalSales", BigDecimal.ZERO);
                m.put("totalCommission", BigDecimal.ZERO);
                return m;
            });
            
            Map<String, Object> m = shopMap.get(shop.getId());
            Integer tierNum = r.getTier().getTierNumber();
            
            BigDecimal sales = r.getTotalSales() != null ? r.getTotalSales() : BigDecimal.ZERO;
            BigDecimal commission = r.getTotalCommission() != null ? r.getTotalCommission() : BigDecimal.ZERO;
            
            if (tierNum != null) {
                if (tierNum == 1) {
                    m.put("t1Sales", sales);
                    m.put("t1Commission", commission);
                } else if (tierNum == 2) {
                    m.put("t2Sales", sales);
                    m.put("t2Commission", commission);
                } else if (tierNum == 3) {
                    m.put("t3Sales", sales);
                    m.put("t3Commission", commission);
                }
            }
            
            m.put("totalSales", ((BigDecimal)m.get("totalSales")).add(sales));
            m.put("totalCommission", ((BigDecimal)m.get("totalCommission")).add(commission));
        }
        
        return new ArrayList<>(shopMap.values());
    }

    public List<String> getAvailablePeriods() {
        return salesRepo.findAvailablePeriods();
    }

    public List<String> getAvailableZones() {
        return zoneRepo.findAll().stream()
                .map(z -> z.getName())
                .distinct().sorted().collect(Collectors.toList());
    }

    private List<Map<String, Object>> toList(List<Object[]> rows, String keyName) {
        return rows.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put(keyName, row[0]);
            m.put("sales", row[1]);
            return m;
        }).collect(Collectors.toList());
    }
}
