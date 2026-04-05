package com.imms.repository;

import com.imms.model.entity.AssetImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssetImageRepository extends JpaRepository<AssetImage, Long> {
    List<AssetImage> findByAssetId(Long assetId);
    void deleteByAssetId(Long assetId);
}
