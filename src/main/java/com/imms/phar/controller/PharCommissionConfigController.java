package com.imms.phar.controller;

import com.imms.phar.model.PharTierCommissionConfig;
import com.imms.phar.repository.PharTierCommissionConfigRepository;
import com.imms.phar.repository.PharTierRepository;
import com.imms.phar.service.PharCommissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/phar/api/commission-config")
@CrossOrigin(origins = "*")
public class PharCommissionConfigController {

    @Autowired private PharTierCommissionConfigRepository configRepo;
    @Autowired private PharTierRepository tierRepo;
    @Autowired private PharCommissionService commissionService;

    @GetMapping
    public ResponseEntity<List<PharTierCommissionConfig>> getConfigsByPeriod(
            @RequestParam(required = false) String period) {
        String queryPeriod = (period != null && !period.isBlank()) ? period : "DEFAULT";
        return ResponseEntity.ok(configRepo.findByPeriod(queryPeriod));
    }

    @PostMapping
    public ResponseEntity<?> saveConfigs(@RequestParam String period, @RequestBody List<PharTierCommissionConfig> configs) {
        if (period == null || period.isBlank()) {
            return ResponseEntity.badRequest().body("Period is required");
        }
        
        for (PharTierCommissionConfig newConfig : configs) {
            if (newConfig.getTier() == null || newConfig.getTier().getId() == null) {
                continue;
            }
            
            // Check if config exists for this tier and period
            PharTierCommissionConfig existing = configRepo.findByTierIdAndPeriod(newConfig.getTier().getId(), period)
                    .orElse(new PharTierCommissionConfig());
            
            existing.setTier(tierRepo.findById(newConfig.getTier().getId()).orElse(null));
            existing.setPeriod(period);
            existing.setBaseCommissionPct(newConfig.getBaseCommissionPct());
            existing.setBonusCommissionPct(newConfig.getBonusCommissionPct());
            existing.setBonusThresholdAmount(newConfig.getBonusThresholdAmount());
            
            configRepo.save(existing);
        }
        
        // Trigger recalculation for this period so the dashboard updates instantly
        commissionService.recalculateSinglePeriod(period);
        
        return ResponseEntity.ok("Commission configurations saved and recalculated for period " + period);
    }
}
