package com.imms.repository;

import com.imms.model.entity.AssetTransferLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssetTransferLogRepository extends JpaRepository<AssetTransferLog, Long> {
    List<AssetTransferLog> findByFromPropertyIdOrToPropertyIdOrderByTransferDateDesc(Long fromPropertyId, Long toPropertyId);
    List<AssetTransferLog> findByAssetIdOrderByTransferDateDesc(Long assetId);
}
