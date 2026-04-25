package com.imms.repository;

import com.imms.model.entity.TenderApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TenderApplicationRepository extends JpaRepository<TenderApplication, Long> {
    List<TenderApplication> findByTenderId(Long tenderId);
    List<TenderApplication> findByVendorId(Long vendorId);
}
