package com.imms.phar.repository;

import com.imms.phar.model.PharTierCommissionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PharTierCommissionConfigRepository extends JpaRepository<PharTierCommissionConfig, Long> {
    Optional<PharTierCommissionConfig> findByTierIdAndPeriod(Long tierId, String period);
    List<PharTierCommissionConfig> findByPeriod(String period);
}
