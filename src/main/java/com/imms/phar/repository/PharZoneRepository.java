package com.imms.phar.repository;

import com.imms.phar.model.PharZone;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PharZoneRepository extends JpaRepository<PharZone, Long> {
    Optional<PharZone> findByNameIgnoreCase(String name);
}
