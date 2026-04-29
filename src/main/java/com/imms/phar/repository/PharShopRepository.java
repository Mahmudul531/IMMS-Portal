package com.imms.phar.repository;

import com.imms.phar.model.PharShop;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PharShopRepository extends JpaRepository<PharShop, Long> {
    Optional<PharShop> findByNameIgnoreCaseAndSalesRepresentativeId(String name, Long srId);
    List<PharShop> findBySalesRepresentativeId(Long srId);
}
