package com.imms.controller;

import com.imms.dto.WorkOrderRequest;
import com.imms.model.entity.*;
import com.imms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.dao.DataIntegrityViolationException;

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

    @PostMapping
    public ResponseEntity<?> createWorkOrder(@RequestBody WorkOrderRequest request) {
        try {
            WorkOrder workOrder = new WorkOrder();
            buildFromRequest(workOrder, request);
            workOrder.setStatus("PENDING");
            return ResponseEntity.ok(workOrderRepository.save(workOrder));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body("Job Code already exists or another database constraint was violated.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create project: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateWorkOrder(@PathVariable Long id, @RequestBody WorkOrderRequest request) {
        try {
            WorkOrder workOrder = workOrderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Work Order not found"));
            buildFromRequest(workOrder, request);
            return ResponseEntity.ok(workOrderRepository.save(workOrder));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body("Job Code already exists or another database constraint was violated.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update project: " + e.getMessage());
        }
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

    @Autowired private WorkOrderApplicationRepository applicationRepository;

    @PostMapping("/{id}/applications")
    public ResponseEntity<?> apply(@PathVariable Long id, @RequestParam Long vendorId, @RequestParam Double amount) {
        WorkOrder wo = workOrderRepository.findById(id).orElseThrow(() -> new RuntimeException("Work Order not found"));
        User vendor = userRepository.findById(vendorId).orElseThrow(() -> new RuntimeException("Vendor not found"));

        if (!"PENDING".equals(wo.getStatus()) && !"APPLIED".equals(wo.getStatus())) {
            return ResponseEntity.badRequest().body("Project is not open for bidding.");
        }

        boolean alreadyApplied = applicationRepository.findByVendorId(vendorId).stream()
                .anyMatch(a -> a.getWorkOrder().getId().equals(id));
        if (alreadyApplied) {
            return ResponseEntity.badRequest().body("Already applied.");
        }

        WorkOrderApplication app = new WorkOrderApplication();
        app.setWorkOrder(wo);
        app.setVendor(vendor);
        app.setAmount(amount);
        
        wo.setStatus("APPLIED");
        workOrderRepository.save(wo);

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
    public ResponseEntity<?> assignVendor(@PathVariable Long id, @RequestParam Long applicationId) {
        WorkOrder wo = workOrderRepository.findById(id).orElseThrow(() -> new RuntimeException("Work Order not found"));
        WorkOrderApplication app = applicationRepository.findById(applicationId).orElseThrow(() -> new RuntimeException("Application not found"));

        wo.setVendor(app.getVendor());
        wo.setAmount(app.getAmount());
        wo.setStatus("ASSIGNED");
        workOrderRepository.save(wo);

        app.setStatus("APPROVED");
        applicationRepository.save(app);

        return ResponseEntity.ok(wo);
    }
}
