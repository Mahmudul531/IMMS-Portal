package com.imms.phar.repository;

import com.imms.phar.model.PharTerritory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PharTerritoryRepository extends JpaRepository<PharTerritory, Long> {
    Optional<PharTerritory> findByNameIgnoreCaseAndZoneId(String name, Long zoneId);
    List<PharTerritory> findByZoneId(Long zoneId);
}
