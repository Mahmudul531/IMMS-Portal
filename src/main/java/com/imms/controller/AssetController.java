package com.imms.controller;

import com.imms.dto.AssetRequest;
import com.imms.dto.AssetTransferRequest;
import com.imms.model.entity.Asset;
import com.imms.model.entity.AssetImage;
import com.imms.model.entity.AssetTransferLog;
import com.imms.model.entity.Property;
import com.imms.repository.AssetRepository;
import com.imms.repository.AssetImageRepository;
import com.imms.repository.PropertyRepository;
import com.imms.service.AssetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @Autowired
    private AssetImageRepository assetImageRepository;

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

    // ─── Image endpoints ───────────────────────────────────────────────────

    @PostMapping("/{id}/images")
    public ResponseEntity<AssetImage> addAssetImage(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        if (!assetRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        AssetImage img = new AssetImage();
        img.setAssetId(id);
        img.setImageData(body.get("imageData"));
        return ResponseEntity.ok(assetImageRepository.save(img));
    }

    @GetMapping("/{id}/images")
    public ResponseEntity<List<AssetImage>> getAssetImages(@PathVariable Long id) {
        return ResponseEntity.ok(assetImageRepository.findByAssetId(id));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<Void> deleteAssetImage(
            @PathVariable Long id,
            @PathVariable Long imageId) {
        assetImageRepository.deleteById(imageId);
        return ResponseEntity.noContent().build();
    }
}
