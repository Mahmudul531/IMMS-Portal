package com.imms.phar.controller;

import com.imms.phar.model.PharUploadLog;
import com.imms.phar.model.PharSalesRecord;
import com.imms.phar.repository.PharCommissionResultRepository;
import com.imms.phar.repository.PharSalesRecordRepository;
import com.imms.phar.repository.PharUploadLogRepository;
import com.imms.phar.service.PharExcelParserService;
import com.imms.phar.service.PharExcelParserService.JobProgress;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/phar/api/upload")
@CrossOrigin(origins = "*")
public class PharUploadController {

    @Autowired private PharExcelParserService parserService;
    @Autowired private PharUploadLogRepository uploadLogRepo;
    @Autowired private PharSalesRecordRepository salesRecordRepo;
    @Autowired private PharCommissionResultRepository commissionRepo;

    /** Upload file — returns jobId immediately, processing happens async */
    @PostMapping("/excel")
    public ResponseEntity<?> uploadExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body("File is empty");
        String name = file.getOriginalFilename();
        if (name == null || (!name.endsWith(".xlsx") && !name.endsWith(".xls"))) {
            return ResponseEntity.badRequest().body("Only .xlsx or .xls files are accepted");
        }
        try {
            String jobId = parserService.startImport(file);
            Map<String, Object> resp = new HashMap<>();
            resp.put("jobId", jobId);
            resp.put("message", "Upload started. Use /phar/api/upload/progress/" + jobId + " to track.");
            return ResponseEntity.accepted().body(resp);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to start upload: " + e.getMessage());
        }
    }

    /** Poll progress for a running/completed job */
    @GetMapping("/progress/{jobId}")
    public ResponseEntity<?> getProgress(@PathVariable String jobId) {
        JobProgress prog = parserService.getProgress(jobId);
        if (prog == null) return ResponseEntity.notFound().build();

        Map<String, Object> resp = new HashMap<>();
        resp.put("jobId",        prog.jobId);
        resp.put("status",       prog.status);
        resp.put("totalRows",    prog.totalRows);
        resp.put("processedRows",prog.processedRows);
        resp.put("importedRows", prog.importedRows);
        resp.put("errorRows",    prog.errorRows);
        resp.put("percent",      prog.getPercent());
        resp.put("currentStep",  prog.currentStep);
        resp.put("errorSummary", prog.errorSummary);
        resp.put("logId",        prog.logId);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/logs")
    public ResponseEntity<List<PharUploadLog>> getLogs() {
        return ResponseEntity.ok(uploadLogRepo.findAllByOrderByUploadedAtDesc());
    }

    @DeleteMapping("/logs/{id}")
    @Transactional
    public ResponseEntity<?> deleteLog(@PathVariable Long id) {
        Optional<PharUploadLog> logOpt = uploadLogRepo.findById(id);
        if (logOpt.isEmpty()) return ResponseEntity.notFound().build();
        
        JobProgress prog = parserService.getProgressByLogId(id);
        if (prog != null && ("PROCESSING".equals(prog.status) || "QUEUED".equals(prog.status))) {
            prog.cancelled = true;
            return ResponseEntity.accepted().body("Cancellation signal sent. The background task will stop and clear its data momentarily.");
        }

        List<PharSalesRecord> records = salesRecordRepo.findByUploadLogId(id);
        Set<String> periods = records.stream()
                .map(r -> r.getSaleDate().getYear() + "-" + String.format("%02d", r.getSaleDate().getMonthValue()))
                .collect(Collectors.toSet());

        for (String period : periods) commissionRepo.deleteByPeriod(period);
        salesRecordRepo.deleteByUploadLogId(id);
        uploadLogRepo.deleteById(id);

        return ResponseEntity.ok().body("Log " + id + " and its data (" + records.size() + " records) deleted.");
    }
}
