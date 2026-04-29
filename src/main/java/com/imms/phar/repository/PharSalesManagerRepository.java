package com.imms.phar.repository;

import com.imms.phar.model.PharSalesManager;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PharSalesManagerRepository extends JpaRepository<PharSalesManager, Long> {
    Optional<PharSalesManager> findByNameIgnoreCaseAndZoneId(String name, Long zoneId);
    List<PharSalesManager> findByZoneId(Long zoneId);
}
