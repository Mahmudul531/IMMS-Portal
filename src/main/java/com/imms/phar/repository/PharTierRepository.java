package com.imms.phar.repository;

import com.imms.phar.model.PharTier;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PharTierRepository extends JpaRepository<PharTier, Long> {
    Optional<PharTier> findByTierNumber(Integer tierNumber);
}
