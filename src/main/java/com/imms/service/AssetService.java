package com.imms.service;

import com.imms.dto.AssetTransferRequest;
import com.imms.model.entity.Asset;
import com.imms.model.entity.AssetTransferLog;
import com.imms.model.entity.Property;
import com.imms.repository.AssetRepository;
import com.imms.repository.AssetTransferLogRepository;
import com.imms.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AssetService {

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private AssetTransferLogRepository transferLogRepository;

    @Transactional
    public Asset transferAsset(Long assetId, AssetTransferRequest request, String username) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        Property fromProperty = asset.getProperty();
        Property toProperty = propertyRepository.findById(request.getTargetPropertyId())
                .orElseThrow(() -> new RuntimeException("Target property not found"));

        if (fromProperty.getId().equals(toProperty.getId())) {
            throw new RuntimeException("Asset is already at this property");
        }

        // Create log entry
        AssetTransferLog log = new AssetTransferLog();
        log.setAssetId(asset.getId());
        log.setAssetName(asset.getName());
        log.setFromPropertyId(fromProperty.getId());
        log.setFromPropertyName(fromProperty.getName());
        log.setToPropertyId(toProperty.getId());
        log.setToPropertyName(toProperty.getName());
        log.setTransferredBy(username);
        log.setTransferNote(request.getTransferNote());
        log.setTransferDate(LocalDateTime.now());

        transferLogRepository.save(log);

        // Update asset
        asset.setProperty(toProperty);
        return assetRepository.save(asset);
    }

    public List<AssetTransferLog> getTransferLogs(Long propertyId) {
        if (propertyId != null) {
            return transferLogRepository.findByFromPropertyIdOrToPropertyIdOrderByTransferDateDesc(propertyId, propertyId);
        }
        return transferLogRepository.findAll();
    }
}
