package com.imms.phar.service;

import com.imms.phar.model.*;
import com.imms.phar.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PharCommissionService {

    @Autowired private PharSalesRecordRepository salesRepo;
    @Autowired private PharTierCommissionConfigRepository configRepo;
    @Autowired private PharCommissionResultRepository resultRepo;
    @Autowired private PharShopRepository shopRepo;
    @Autowired private PharTierRepository tierRepo;

    private static final DateTimeFormatter PERIOD_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    public void recalculateAll() {
        // Group all sales records by period (yyyy-MM)
        List<PharSalesRecord> allSales = salesRepo.findAll();
        Map<String, List<PharSalesRecord>> byPeriod = allSales.stream()
                .collect(Collectors.groupingBy(r -> r.getSaleDate().format(PERIOD_FMT)));

        for (Map.Entry<String, List<PharSalesRecord>> periodEntry : byPeriod.entrySet()) {
            String period = periodEntry.getKey();
            recalculatePeriod(period, periodEntry.getValue());
        }
    }

    private void recalculatePeriod(String period, List<PharSalesRecord> records) {
        // Group by shop + tier
        Map<String, List<PharSalesRecord>> grouped = records.stream()
                .collect(Collectors.groupingBy(r -> r.getShop().getId() + ":" + r.getProduct().getTier().getId()));

        for (Map.Entry<String, List<PharSalesRecord>> entry : grouped.entrySet()) {
            String[] parts = entry.getKey().split(":");
            Long shopId = Long.parseLong(parts[0]);
            Long tierId = Long.parseLong(parts[1]);

            BigDecimal totalSales = entry.getValue().stream()
                    .map(PharSalesRecord::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            PharTierCommissionConfig config = configRepo.findByTierId(tierId).orElse(null);
            BigDecimal basePct = config != null ? config.getBaseCommissionPct() : BigDecimal.ZERO;
            BigDecimal bonusPct = BigDecimal.ZERO;
            if (config != null && config.getBonusThresholdAmount().compareTo(BigDecimal.ZERO) > 0
                    && totalSales.compareTo(config.getBonusThresholdAmount()) >= 0) {
                bonusPct = config.getBonusCommissionPct();
            }

            BigDecimal base = totalSales.multiply(basePct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal bonus = totalSales.multiply(bonusPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            PharCommissionResult result = resultRepo.findByShopIdAndTierIdAndPeriod(shopId, tierId, period)
                    .orElse(new PharCommissionResult());

            PharShop shop = shopRepo.findById(shopId).orElseThrow();
            PharTier tier = tierRepo.findById(tierId).orElseThrow();

            result.setShop(shop);
            result.setTier(tier);
            result.setPeriod(period);
            result.setTotalSales(totalSales);
            result.setBaseCommission(base);
            result.setBonusCommission(bonus);
            result.setTotalCommission(base.add(bonus));
            resultRepo.save(result);
        }
    }
}
