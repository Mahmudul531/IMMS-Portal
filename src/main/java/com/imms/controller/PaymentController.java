package com.imms.controller;

import com.imms.model.entity.PaymentRequest;
import com.imms.model.entity.Task;
import com.imms.model.entity.WorkOrder;
import com.imms.model.entity.User;
import com.imms.repository.PaymentRequestRepository;
import com.imms.repository.TaskRepository;
import com.imms.repository.WorkOrderRepository;
import com.imms.repository.UserRepository;
import com.imms.service.CloudinaryService;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired private PaymentRequestRepository paymentRepository;
    @Autowired private TaskRepository taskRepository;
    @Autowired private WorkOrderRepository workOrderRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CloudinaryService cloudinaryService;

    @PostMapping
    public ResponseEntity<?> applyForPayment(@RequestParam Long vendorId, @RequestParam Long workOrderId, @RequestParam Long taskId, @RequestParam Double amount) {
        WorkOrder wo = workOrderRepository.findById(workOrderId).orElseThrow(() -> new RuntimeException("Work Order not found"));
        User vendor = userRepository.findById(vendorId).orElseThrow(() -> new RuntimeException("Vendor not found"));
        Task task = taskRepository.findById(taskId).orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getWorkOrderId().equals(workOrderId)) {
            return ResponseEntity.badRequest().body("Task does not belong to the specified Work Order.");
        }

        if (task.getCompletionPct() < 100) {
            return ResponseEntity.badRequest().body("Task must be 100% complete to apply for payment.");
        }

        List<Task> tasks = taskRepository.findByWorkOrderId(workOrderId);
        if (tasks.isEmpty()) {
            return ResponseEntity.badRequest().body("Work Order has no tasks.");
        }

        // Limit amount to strictly (WorkOrder Amount / Total Tasks)
        double woAmount = wo.getAmount() != null ? wo.getAmount() : 0.0;
        double maxTaskAmount = woAmount / tasks.size();
        
        // Round max to 2 decimals to prevent precision issues
        maxTaskAmount = Math.round(maxTaskAmount * 100.0) / 100.0;

        if (amount > maxTaskAmount) {
            return ResponseEntity.badRequest().body("Claim exceeds maximum allowed amount for this task (Max: " + maxTaskAmount + ").");
        }

        // Check if a payment request is already pending or approved for this specific task
        List<PaymentRequest> existing = paymentRepository.findByWorkOrderId(workOrderId);
        if (existing.stream().anyMatch(p -> p.getTask() != null && p.getTask().getId().equals(taskId) && !p.getStatus().equals("REJECTED"))) {
            return ResponseEntity.badRequest().body("A payment request has already been submitted for this task.");
        }

        PaymentRequest pr = new PaymentRequest();
        pr.setWorkOrder(wo);
        pr.setVendor(vendor);
        pr.setTask(task);
        pr.setAmount(amount);
        pr.setStatus("PENDING_ENGINEER");
        return ResponseEntity.ok(paymentRepository.save(pr));
    }

    @GetMapping
    public ResponseEntity<List<PaymentRequest>> getAllPayments() {
        return ResponseEntity.ok(paymentRepository.findAll());
    }

    @GetMapping("/my")
    public ResponseEntity<List<PaymentRequest>> getMyPayments(@RequestParam Long vendorId) {
        return ResponseEntity.ok(paymentRepository.findByVendorId(vendorId));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approvePayment(@PathVariable Long id, @RequestParam String role) {
        PaymentRequest pr = paymentRepository.findById(id).orElseThrow(() -> new RuntimeException("Payment not found"));

        if ("ENGINEER".equals(role) && "PENDING_ENGINEER".equals(pr.getStatus())) {
            pr.setStatus("PENDING_ADMIN");
        } else if ("ADMIN".equals(role) && "PENDING_ADMIN".equals(pr.getStatus())) {
            pr.setStatus("APPROVED");
            
            // We no longer generate and upload to Cloudinary here. 
            // The invoice is generated dynamically when requested.

        } else {
            return ResponseEntity.badRequest().body("Invalid role or status for approval.");
        }

        return ResponseEntity.ok(paymentRepository.save(pr));
    }

    @GetMapping("/{id}/invoice/download")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable Long id) {
        PaymentRequest pr = paymentRepository.findById(id).orElseThrow(() -> new RuntimeException("Payment not found"));
        
        if (!"APPROVED".equals(pr.getStatus())) {
            return ResponseEntity.badRequest().body(null);
        }

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();
            document.add(new Paragraph("INVOICE"));
            document.add(new Paragraph("Payment ID: " + pr.getId()));
            document.add(new Paragraph("Work Order: " + pr.getWorkOrder().getJobTitle() + " (" + pr.getWorkOrder().getJobCode() + ")"));
            if (pr.getTask() != null) {
                document.add(new Paragraph("Task: " + pr.getTask().getTitle()));
            }
            document.add(new Paragraph("Contractor: " + pr.getVendor().getFullName()));
            document.add(new Paragraph("Amount: BDT " + pr.getAmount()));
            document.add(new Paragraph("Status: PAID / APPROVED"));
            document.close();

            String filename = "Invoice-WO" + pr.getWorkOrder().getId() + "-Pay" + pr.getId() + ".pdf";

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .header("Content-Type", "application/pdf")
                    .body(out.toByteArray());

        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectPayment(@PathVariable Long id, @RequestParam String note) {
        PaymentRequest pr = paymentRepository.findById(id).orElseThrow(() -> new RuntimeException("Payment not found"));
        pr.setStatus("REJECTED");
        pr.setNote(note);
        return ResponseEntity.ok(paymentRepository.save(pr));
    }
}
