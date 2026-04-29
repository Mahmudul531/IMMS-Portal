package com.imms.phar;

import com.imms.phar.model.*;
import com.imms.phar.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class PharDataInitializer implements CommandLineRunner {

    @Autowired private PharUserRepository userRepo;
    @Autowired private PharTierRepository tierRepo;
    @Autowired private PharTierCommissionConfigRepository configRepo;

    @Override
    public void run(String... args) {
        // Seed default user p/p
        if (userRepo.findByUsername("p").isEmpty()) {
            PharUser u = new PharUser();
            u.setUsername("p");
            u.setPassword("p");
            u.setFullName("Pharma Admin");
            u.setRole("ADMIN");
            userRepo.save(u);
        }

        // Seed 3 tiers with default commission configs
        seedTierWithConfig(1, "Tier 1", new BigDecimal("10.00"), new BigDecimal("50000"), new BigDecimal("2.00"));
        seedTierWithConfig(2, "Tier 2", new BigDecimal("15.00"), new BigDecimal("75000"), new BigDecimal("3.00"));
        seedTierWithConfig(3, "Tier 3", new BigDecimal("10.00"), new BigDecimal("40000"), new BigDecimal("2.00"));
    }

    private void seedTierWithConfig(int num, String label, BigDecimal basePct, BigDecimal threshold, BigDecimal bonusPct) {
        PharTier tier = tierRepo.findByTierNumber(num).orElseGet(() -> {
            PharTier t = new PharTier();
            t.setTierNumber(num);
            t.setLabel(label);
            return tierRepo.save(t);
        });

        if (configRepo.findByTierId(tier.getId()).isEmpty()) {
            PharTierCommissionConfig cfg = new PharTierCommissionConfig();
            cfg.setTier(tier);
            cfg.setBaseCommissionPct(basePct);
            cfg.setBonusThresholdAmount(threshold);
            cfg.setBonusCommissionPct(bonusPct);
            configRepo.save(cfg);
        }
    }
}
