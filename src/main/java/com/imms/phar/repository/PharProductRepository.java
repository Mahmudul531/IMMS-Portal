package com.imms.phar.repository;

import com.imms.phar.model.PharProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PharProductRepository extends JpaRepository<PharProduct, Long> {
    Optional<PharProduct> findBySkuIgnoreCase(String sku);
    Optional<PharProduct> findByNameIgnoreCase(String name);
}
