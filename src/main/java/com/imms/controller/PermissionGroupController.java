package com.imms.controller;

import com.imms.model.entity.PermissionGroup;
import com.imms.repository.PermissionGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permission-groups")
@CrossOrigin(origins = "*")
public class PermissionGroupController {

    @Autowired
    private PermissionGroupRepository repository;

    @GetMapping
    public ResponseEntity<List<PermissionGroup>> getAll() {
        return ResponseEntity.ok(repository.findAll());
    }

    /** Returns all permission groups configured for a specific role (e.g. ENGINEER, TECHNICIAN, VENDOR).
     *  Frontend calls this on every refresh to get live permissions. */
    @GetMapping("/by-role/{role}")
    public ResponseEntity<List<PermissionGroup>> getByRole(@PathVariable String role) {
        return ResponseEntity.ok(repository.findByTargetRole(role.toUpperCase()));
    }

    @PostMapping
    public ResponseEntity<PermissionGroup> create(@RequestBody PermissionGroup group) {
        if (group.getTargetRole() != null) {
            group.setTargetRole(group.getTargetRole().toUpperCase());
        }
        return ResponseEntity.ok(repository.save(group));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PermissionGroup> update(@PathVariable Long id, @RequestBody PermissionGroup group) {
        PermissionGroup existing = repository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        existing.setName(group.getName());
        existing.setPermissions(group.getPermissions());
        if (group.getTargetRole() != null) {
            existing.setTargetRole(group.getTargetRole().toUpperCase());
        }
        return ResponseEntity.ok(repository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

