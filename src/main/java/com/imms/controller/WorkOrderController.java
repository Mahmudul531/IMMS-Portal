package com.imms.controller;

import com.imms.dto.WorkOrderRequest;
import com.imms.model.entity.Asset;
import com.imms.model.entity.User;
import com.imms.model.entity.WorkOrder;
import com.imms.model.entity.WorkOrderApplication;
import com.imms.repository.AssetRepository;
import com.imms.repository.UserRepository;
import com.imms.repository.WorkOrderRepository;
import com.imms.repository.WorkOrderApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/work-orders")
@CrossOrigin(origins = "*")
public class WorkOrderController {

    @Autowired
    private WorkOrderRepository workOrderRepository;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkOrderApplicationRepository applicationRepository;

    @PostMapping
    public ResponseEntity<WorkOrder> createWorkOrder(@RequestBody WorkOrderRequest request) {
        Asset asset = assetRepository.findById(request.getAssetId())
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        WorkOrder workOrder = new WorkOrder();
        workOrder.setDescription(request.getDescription());
        workOrder.setAsset(asset);
        workOrder.setStatus("PENDING");

        return ResponseEntity.ok(workOrderRepository.save(workOrder));
    }

    @PostMapping("/{id}/applications")
    public ResponseEntity<?> applyWithAmount(@PathVariable Long id, @RequestParam Long vendorId, @RequestParam Double amount) {
        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Work Order not found"));

        User vendor = userRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        List<WorkOrderApplication> existingApps = applicationRepository.findByVendorId(vendorId);
        boolean alreadyApplied = existingApps.stream().anyMatch(a -> a.getWorkOrder().getId().equals(id));
        if (alreadyApplied) {
            return ResponseEntity.badRequest().body("Already applied to this work order.");
        }

        WorkOrderApplication app = new WorkOrderApplication();
        app.setWorkOrder(workOrder);
        app.setVendor(vendor);
        app.setAmount(amount);
        app.setStatus("APPLIED");

        return ResponseEntity.ok(applicationRepository.save(app));
    }

    @GetMapping("/{id}/applications")
    public ResponseEntity<List<WorkOrderApplication>> getApplications(@PathVariable Long id) {
        return ResponseEntity.ok(applicationRepository.findByWorkOrderId(id));
    }

    @GetMapping("/my-applications")
    public ResponseEntity<List<WorkOrderApplication>> getMyApplications(@RequestParam Long vendorId) {
        return ResponseEntity.ok(applicationRepository.findByVendorId(vendorId));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<WorkOrder> assignWorkOrder(@PathVariable Long id, @RequestParam Long applicationId) {
        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Work Order not found"));

        WorkOrderApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        app.setStatus("APPROVED");
        applicationRepository.save(app);

        workOrder.setAmount(app.getAmount());
        workOrder.setVendor(app.getVendor());
        workOrder.setStatus("ASSIGNED");

        return ResponseEntity.ok(workOrderRepository.save(workOrder));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelWorkOrder(@PathVariable Long id) {
        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Work Order not found"));

        if (!"PENDING".equals(workOrder.getStatus())) {
            return ResponseEntity.badRequest().body("Only pending work orders can be cancelled.");
        }

        workOrder.setStatus("CANCELLED");
        return ResponseEntity.ok(workOrderRepository.save(workOrder));
    }

    @GetMapping
    public ResponseEntity<List<WorkOrder>> getAllWorkOrders() {
        return ResponseEntity.ok(workOrderRepository.findAll());
    }
}
