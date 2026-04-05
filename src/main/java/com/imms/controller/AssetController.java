package com.imms.controller;

import com.imms.dto.AssetRequest;
import com.imms.dto.AssetTransferRequest;
import com.imms.model.entity.Asset;
import com.imms.model.entity.AssetTransferLog;
import com.imms.model.entity.Property;
import com.imms.repository.AssetRepository;
import com.imms.repository.PropertyRepository;
import com.imms.service.AssetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class AssetController {

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private AssetService assetService;

    @PostMapping
    public ResponseEntity<Asset> createAsset(@RequestBody AssetRequest request) {
        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        Asset asset = new Asset();
        asset.setName(request.getName());
        asset.setType(request.getType());
        asset.setProperty(property);

        return ResponseEntity.ok(assetRepository.save(asset));
    }

    @GetMapping
    public ResponseEntity<List<Asset>> getAllAssets() {
        return ResponseEntity.ok(assetRepository.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Asset> updateAsset(@PathVariable Long id, @RequestBody AssetRequest request) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        asset.setName(request.getName());
        asset.setType(request.getType());
        asset.setProperty(property);

        return ResponseEntity.ok(assetRepository.save(asset));
    }

    @PostMapping("/{id}/transfer")
    public ResponseEntity<Asset> transferAsset(@PathVariable Long id, @RequestBody AssetTransferRequest request, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "System";
        return ResponseEntity.ok(assetService.transferAsset(id, request, username));
    }

    @GetMapping("/transfer-logs")
    public ResponseEntity<List<AssetTransferLog>> getTransferLogs(@RequestParam(required = false) Long propertyId) {
        return ResponseEntity.ok(assetService.getTransferLogs(propertyId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long id) {
        assetRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
