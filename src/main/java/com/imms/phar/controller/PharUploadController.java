package com.imms.phar.controller;

import com.imms.phar.model.PharUploadLog;
import com.imms.phar.repository.PharUploadLogRepository;
import com.imms.phar.service.PharExcelParserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/phar/api/upload")
@CrossOrigin(origins = "*")
public class PharUploadController {

    @Autowired private PharExcelParserService parserService;
    @Autowired private PharUploadLogRepository uploadLogRepo;

    @PostMapping("/excel")
    public ResponseEntity<?> uploadExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body("File is empty");
        String name = file.getOriginalFilename();
        if (name == null || (!name.endsWith(".xlsx") && !name.endsWith(".xls"))) {
            return ResponseEntity.badRequest().body("Only .xlsx or .xls files are accepted");
        }
        PharUploadLog log = parserService.parseAndImport(file);
        return ResponseEntity.ok(log);
    }

    @GetMapping("/logs")
    public ResponseEntity<List<PharUploadLog>> getLogs() {
        return ResponseEntity.ok(uploadLogRepo.findAllByOrderByUploadedAtDesc());
    }
}
