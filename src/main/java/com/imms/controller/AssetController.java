package com.imms.controller;

import com.imms.dto.AssetRequest;
import com.imms.dto.AssetTransferRequest;
import com.imms.model.entity.Asset;
import com.imms.model.entity.AssetImage;
import com.imms.model.entity.AssetTransferLog;
import com.imms.model.entity.Property;
import com.imms.repository.AssetRepository;
import com.imms.repository.AssetImageRepository;
import com.imms.repository.AssetTransferLogRepository;
import com.imms.repository.PropertyRepository;
import com.imms.service.AssetService;
import com.imms.service.CloudinaryService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    @Autowired
    private AssetImageRepository assetImageRepository;

    @Autowired
    private AssetTransferLogRepository assetTransferLogRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    // ─── Core CRUD ────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<Asset> getAssetById(@PathVariable Long id) {
        return assetRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<AssetTransferLog>> getAssetHistory(@PathVariable Long id) {
        return ResponseEntity.ok(assetTransferLogRepository.findByAssetIdOrderByTransferDateDesc(id));
    }

    @PostMapping
    public ResponseEntity<Asset> createAsset(@RequestBody AssetRequest request) {
        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));
        Asset asset = new Asset();
        asset.setName(request.getName());
        asset.setType(request.getType());
        asset.setCategory(request.getCategory());
        asset.setSupplierName(request.getSupplierName());
        asset.setAssetCode(request.getAssetCode());
        asset.setPurchaseDate(request.getPurchaseDate());
        asset.setPurchaseValue(request.getPurchaseValue());
        asset.setDepreciationPercentage(request.getDepreciationPercentage());
        asset.setLongDescription(request.getLongDescription());
        asset.setRemarks(request.getRemarks());
        asset.setInvoiceUrl(request.getInvoiceUrl());
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
        asset.setCategory(request.getCategory());
        asset.setSupplierName(request.getSupplierName());
        asset.setAssetCode(request.getAssetCode());
        asset.setPurchaseDate(request.getPurchaseDate());
        asset.setPurchaseValue(request.getPurchaseValue());
        asset.setDepreciationPercentage(request.getDepreciationPercentage());
        asset.setLongDescription(request.getLongDescription());
        asset.setRemarks(request.getRemarks());
        asset.setInvoiceUrl(request.getInvoiceUrl());
        asset.setProperty(property);
        return ResponseEntity.ok(assetRepository.save(asset));
    }

    @PostMapping("/{id}/transfer")
    public ResponseEntity<Asset> transferAsset(
            @PathVariable Long id,
            @RequestBody AssetTransferRequest request,
            @RequestParam(required = false) String username) {
        String transferredBy = (username != null && !username.isBlank()) ? username : "System";
        return ResponseEntity.ok(assetService.transferAsset(id, request, transferredBy));
    }

    @GetMapping("/transfer-logs")
    public ResponseEntity<List<AssetTransferLog>> getTransferLogs(
            @RequestParam(required = false) Long propertyId) {
        return ResponseEntity.ok(assetService.getTransferLogs(propertyId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long id) {
        assetRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Image endpoints ──────────────────────────────────────────────────

    /**
     * Upload file to Cloudinary → store returned HTTPS URL in DB.
     */
    @PostMapping(value = "/{id}/images", consumes = "multipart/form-data")
    public ResponseEntity<AssetImage> addAssetImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        if (!assetRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        String url = cloudinaryService.upload(file, "imms/assets");

        AssetImage img = new AssetImage();
        img.setAssetId(id);
        img.setImageData(url); // full https://res.cloudinary.com/... URL
        return ResponseEntity.ok(assetImageRepository.save(img));
    }

    @PostMapping(value = "/{id}/invoice", consumes = "multipart/form-data")
    public ResponseEntity<Asset> uploadInvoice(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        // Upload to Cloudinary. Force raw for PDFs so they are not blocked by Cloudinary Image Delivery security policies
        String resourceType = file.getContentType() != null && file.getContentType().toLowerCase().contains("pdf") ? "raw" : "auto";
        String url = cloudinaryService.upload(file, "imms/invoices", resourceType);

        asset.setInvoiceUrl(url);
        return ResponseEntity.ok(assetRepository.save(asset));
    }

    @GetMapping("/{id}/images")
    public ResponseEntity<List<AssetImage>> getAssetImages(@PathVariable Long id) {
        return ResponseEntity.ok(assetImageRepository.findByAssetId(id));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<Void> deleteAssetImage(
            @PathVariable Long id,
            @PathVariable Long imageId) {

        assetImageRepository.findById(imageId).ifPresent(img -> {
            cloudinaryService.delete(img.getImageData());
            assetImageRepository.delete(img);
        });
        return ResponseEntity.noContent().build();
    }
}
