package com.imms.phar.controller;

import com.imms.phar.model.*;
import com.imms.phar.repository.*;
import com.imms.phar.service.PharCommissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/phar/api/setup")
@CrossOrigin(origins = "*")
public class PharSetupController {

    @Autowired private PharTierRepository tierRepo;
    @Autowired private PharTierCommissionConfigRepository configRepo;
    @Autowired private PharCommissionService commissionService;
    @Autowired private PharZoneRepository zoneRepo;
    @Autowired private PharTerritoryRepository territoryRepo;
    @Autowired private PharSalesManagerRepository smRepo;
    @Autowired private PharSalesRepresentativeRepository srRepo;
    @Autowired private PharShopRepository shopRepo;
    @Autowired private PharProductRepository productRepo;

    // --- Commission Config ---
    @GetMapping("/commission-config")
    public ResponseEntity<List<PharTierCommissionConfig>> getConfigs() {
        return ResponseEntity.ok(configRepo.findAll());
    }

    @PutMapping("/commission-config/{tierId}")
    public ResponseEntity<?> updateConfig(@PathVariable Long tierId, @RequestBody Map<String, Object> body) {
        PharTier tier = tierRepo.findById(tierId).orElseThrow(() -> new RuntimeException("Tier not found"));
        PharTierCommissionConfig cfg = configRepo.findByTierIdAndPeriod(tierId, "DEFAULT").orElse(new PharTierCommissionConfig());
        cfg.setTier(tier);
        cfg.setPeriod("DEFAULT");
        cfg.setBaseCommissionPct(new BigDecimal(body.get("baseCommissionPct").toString()));
        cfg.setBonusThresholdAmount(new BigDecimal(body.get("bonusThresholdAmount").toString()));
        cfg.setBonusCommissionPct(new BigDecimal(body.get("bonusCommissionPct").toString()));
        configRepo.save(cfg);
        commissionService.recalculateAll();
        return ResponseEntity.ok(cfg);
    }

    // --- Tiers ---
    @GetMapping("/tiers") public ResponseEntity<List<PharTier>> getTiers() { return ResponseEntity.ok(tierRepo.findAll()); }
    @GetMapping("/zones") public ResponseEntity<List<PharZone>> getZones() { return ResponseEntity.ok(zoneRepo.findAll()); }
    @GetMapping("/territories") public ResponseEntity<List<PharTerritory>> getTerritories() { return ResponseEntity.ok(territoryRepo.findAll()); }
    @GetMapping("/sales-managers") public ResponseEntity<List<PharSalesManager>> getSMs() { return ResponseEntity.ok(smRepo.findAll()); }
    @GetMapping("/sales-representatives") public ResponseEntity<List<PharSalesRepresentative>> getSRs() { return ResponseEntity.ok(srRepo.findAll()); }
    @GetMapping("/shops") public ResponseEntity<List<PharShop>> getShops() { return ResponseEntity.ok(shopRepo.findAll()); }
    @GetMapping("/products") public ResponseEntity<List<PharProduct>> getProducts() { return ResponseEntity.ok(productRepo.findAll()); }

    @PostMapping("/recalculate")
    public ResponseEntity<?> recalculate() {
        commissionService.recalculateAll();
        return ResponseEntity.ok("Commissions recalculated");
    }
}
