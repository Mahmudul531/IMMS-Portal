package com.imms.controller;

import com.imms.model.entity.JobMethod;
import com.imms.repository.JobMethodRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/job-methods")
@CrossOrigin(origins = "*")
public class JobMethodController {

    @Autowired
    private JobMethodRepository repository;

    @GetMapping
    public ResponseEntity<List<JobMethod>> getAll() {
        return ResponseEntity.ok(repository.findAll());
    }

    @PostMapping
    public ResponseEntity<JobMethod> create(@RequestBody JobMethod method) {
        return ResponseEntity.ok(repository.save(method));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
