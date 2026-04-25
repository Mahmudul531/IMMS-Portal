package com.imms.controller;

import com.imms.model.entity.*;
import com.imms.repository.*;
import com.imms.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tenders")
@CrossOrigin(origins = "*")
public class TenderController {

    @Autowired private TenderRepository tenderRepository;
    @Autowired private TenderApplicationRepository applicationRepository;
    @Autowired private WorkOrderRepository workOrderRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<Tender> createTender(@RequestBody Tender request) {
        if (request.getProperty() != null && request.getProperty().getId() != null) {
            propertyRepository.findById(request.getProperty().getId()).ifPresent(request::setProperty);
        }
        if ("DIRECT_ASSIGN".equals(request.getMethod()) && request.getAssignedVendor() != null && request.getAssignedVendor().getId() != null) {
            userRepository.findById(request.getAssignedVendor().getId()).ifPresent(request::setAssignedVendor);
        }
        request.setStatus("OPEN");
        return ResponseEntity.ok(tenderRepository.save(request));
    }

    @GetMapping
    public ResponseEntity<List<Tender>> getAllTenders() {
        return ResponseEntity.ok(tenderRepository.findAll());
    }

    @PostMapping("/{id}/applications")
    public ResponseEntity<?> apply(
            @PathVariable Long id,
            @RequestParam Long vendorId,
            @RequestParam Double amount,
            @RequestParam(required = false) MultipartFile file) {

        Tender tender = tenderRepository.findById(id).orElseThrow(() -> new RuntimeException("Tender not found"));
        User vendor = userRepository.findById(vendorId).orElseThrow(() -> new RuntimeException("Vendor not found"));

        if (!"OPEN_BID".equals(tender.getMethod())) {
            return ResponseEntity.badRequest().body("This tender is not open for bidding.");
        }

        boolean alreadyApplied = applicationRepository.findByVendorId(vendorId).stream()
                .anyMatch(a -> a.getTender().getId().equals(id));
        if (alreadyApplied) {
            return ResponseEntity.badRequest().body("Already applied to this tender.");
        }

        TenderApplication app = new TenderApplication();
        app.setTender(tender);
        app.setVendor(vendor);
        app.setAmount(amount);

        if (file != null && !file.isEmpty()) {
            try {
                Map<?, ?> result = cloudinaryService.uploadRaw(file.getBytes(), file.getOriginalFilename(), "imms/tenders");
                app.setDocumentUrl((String) result.get("secure_url"));
                app.setDocumentName(file.getOriginalFilename());
            } catch (IOException e) {
                return ResponseEntity.status(500).body("Error uploading document: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(applicationRepository.save(app));
    }

    @GetMapping("/{id}/applications")
    public ResponseEntity<List<TenderApplication>> getApplications(@PathVariable Long id) {
        return ResponseEntity.ok(applicationRepository.findByTenderId(id));
    }

    @GetMapping("/my-applications")
    public ResponseEntity<List<TenderApplication>> getMyApplications(@RequestParam Long vendorId) {
        return ResponseEntity.ok(applicationRepository.findByVendorId(vendorId));
    }

    @PutMapping("/{id}/approve-bid")
    public ResponseEntity<?> approveBid(@PathVariable Long id, @RequestParam Long applicationId) {
        Tender tender = tenderRepository.findById(id).orElseThrow(() -> new RuntimeException("Tender not found"));
        TenderApplication app = applicationRepository.findById(applicationId).orElseThrow(() -> new RuntimeException("Application not found"));

        app.setStatus("APPROVED");
        applicationRepository.save(app);

        tender.setStatus("APPROVED");
        tenderRepository.save(tender);

        WorkOrder wo = createWorkOrderFromTender(tender, app.getVendor(), app.getAmount());
        return ResponseEntity.ok(wo);
    }

    @PutMapping("/{id}/approve-direct")
    public ResponseEntity<?> approveDirect(@PathVariable Long id) {
        Tender tender = tenderRepository.findById(id).orElseThrow(() -> new RuntimeException("Tender not found"));
        
        if (!"DIRECT_ASSIGN".equals(tender.getMethod())) {
            return ResponseEntity.badRequest().body("This tender is not a direct assign tender.");
        }

        tender.setStatus("APPROVED");
        tenderRepository.save(tender);

        WorkOrder wo = createWorkOrderFromTender(tender, tender.getAssignedVendor(), tender.getAssignedAmount());
        return ResponseEntity.ok(wo);
    }

    private WorkOrder createWorkOrderFromTender(Tender tender, User vendor, Double amount) {
        WorkOrder wo = new WorkOrder();
        wo.setJobTitle(tender.getTitle());
        wo.setJobCode("WO-T" + tender.getId() + "-" + System.currentTimeMillis());
        wo.setDescription(tender.getDescription());
        wo.setProperty(tender.getProperty());
        wo.setBudgetStart(tender.getBudgetStart() != null ? java.math.BigDecimal.valueOf(tender.getBudgetStart()) : null);
        wo.setBudgetEnd(tender.getBudgetEnd() != null ? java.math.BigDecimal.valueOf(tender.getBudgetEnd()) : null);
        wo.setMethod(tender.getMethod());
        wo.setVendor(vendor);
        wo.setAmount(amount);
        wo.setStatus("ASSIGNED"); // Directly assigned!
        return workOrderRepository.save(wo);
    }
}
