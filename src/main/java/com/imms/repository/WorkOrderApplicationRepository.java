package com.imms.repository;

import com.imms.model.entity.WorkOrderApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WorkOrderApplicationRepository extends JpaRepository<WorkOrderApplication, Long> {
    List<WorkOrderApplication> findByWorkOrderId(Long workOrderId);
    List<WorkOrderApplication> findByVendorId(Long vendorId);
}
