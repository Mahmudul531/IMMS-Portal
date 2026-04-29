package com.imms.phar.repository;

import com.imms.phar.model.PharSalesRepresentative;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PharSalesRepresentativeRepository extends JpaRepository<PharSalesRepresentative, Long> {
    Optional<PharSalesRepresentative> findByNameIgnoreCaseAndTerritoryId(String name, Long territoryId);
    List<PharSalesRepresentative> findByTerritoryId(Long territoryId);
    List<PharSalesRepresentative> findBySalesManagerId(Long salesManagerId);
}
