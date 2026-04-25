package com.imms.repository;

import com.imms.model.entity.PaymentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, Long> {
    List<PaymentRequest> findByVendorId(Long vendorId);
    List<PaymentRequest> findByWorkOrderId(Long workOrderId);
    List<PaymentRequest> findByStatus(String status);
}
