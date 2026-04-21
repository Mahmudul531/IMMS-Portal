package com.imms.controller;

import com.imms.dto.WorkOrderRequest;
import com.imms.model.entity.*;
import com.imms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/work-orders")
@CrossOrigin(origins = "*")
public class WorkOrderController {

    @Autowired private WorkOrderRepository workOrderRepository;
    @Autowired private AssetRepository assetRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private WorkOrderApplicationRepository applicationRepository;

    @PostMapping
    public ResponseEntity<WorkOrder> createWorkOrder(@RequestBody WorkOrderRequest request) {
        WorkOrder workOrder = new WorkOrder();
        buildFromRequest(workOrder, request);
        workOrder.setStatus("PENDING");
        return ResponseEntity.ok(workOrderRepository.save(workOrder));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkOrder> updateWorkOrder(@PathVariable Long id, @RequestBody WorkOrderRequest request) {
        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Work Order not found"));
        buildFromRequest(workOrder, request);
        return ResponseEntity.ok(workOrderRepository.save(workOrder));
    }

    private void buildFromRequest(WorkOrder wo, WorkOrderRequest request) {
        wo.setDescription(request.getDescription());
        wo.setJobTitle(request.getJobTitle());
        wo.setJobCode(request.getJobCode());
        wo.setMethod(request.getMethod());
        wo.setPublishDate(request.getPublishDate());
        wo.setCloseDate(request.getCloseDate());
        wo.setBudgetStart(request.getBudgetStart());
        wo.setBudgetEnd(request.getBudgetEnd());
        wo.setEligibility(request.getEligibility());

        if (request.getPropertyId() != null) {
            propertyRepository.findById(request.getPropertyId()).ifPresent(wo::setProperty);
        }

        // Legacy single asset
        if (request.getAssetId() != null) {
            assetRepository.findById(request.getAssetId()).ifPresent(wo::setAsset);
        }

        // Multi-asset tagging
        if (request.getAssetIds() != null && !request.getAssetIds().isEmpty()) {
            List<Asset> assets = new ArrayList<>();
            for (Long assetId : request.getAssetIds()) {
                assetRepository.findById(assetId).ifPresent(assets::add);
            }
            wo.setTaggedAssets(assets);
        }

        // Field engineer
        if (request.getFieldEngineerId() != null) {
            userRepository.findById(request.getFieldEngineerId()).ifPresent(wo::setFieldEngineer);
        } else {
            wo.setFieldEngineer(null);
        }
    }

    @GetMapping
    public ResponseEntity<List<WorkOrder>> getAllWorkOrders() {
        return ResponseEntity.ok(workOrderRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrder> getById(@PathVariable Long id) {
        return workOrderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkOrder(@PathVariable Long id) {
        workOrderRepository.deleteById(id);
        return ResponseEntity.noContent().build();
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
}
