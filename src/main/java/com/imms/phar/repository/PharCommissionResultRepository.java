package com.imms.phar.repository;

import com.imms.phar.model.PharCommissionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PharCommissionResultRepository extends JpaRepository<PharCommissionResult, Long> {
    List<PharCommissionResult> findByPeriod(String period);
    Optional<PharCommissionResult> findByShopIdAndTierIdAndPeriod(Long shopId, Long tierId, String period);
    List<PharCommissionResult> findByShopId(Long shopId);
}
