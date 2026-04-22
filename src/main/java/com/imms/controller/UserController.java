package com.imms.controller;

import com.imms.dto.RegisterRequest;
import com.imms.model.entity.User;
import com.imms.service.UserService;
import com.imms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword());
        user.setRole(request.getRole() != null ? request.getRole() : "VENDOR");
        user.setEmail(request.getEmail());

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        if (request.getDob() != null && !request.getDob().isBlank()) {
            user.setDob(java.time.LocalDate.parse(request.getDob()));
        }
        user.setGender(request.getGender());
        user.setNidOrPassport(request.getNidOrPassport());
        user.setDepartment(request.getDepartment());
        user.setDesignation(request.getDesignation());
        user.setPropertyId(request.getPropertyId());
        user.setPermissionGroupId(request.getPermissionGroupId());

        // Vendors always start inactive — pending admin approval
        if ("VENDOR".equalsIgnoreCase(user.getRole())) {
            user.setActive(false);
            user.setInactiveNote("Pending Admin Approval");
        }

        return ResponseEntity.ok(userService.registerUser(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody RegisterRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        // Profile fields — always updatable
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getDob() != null && !request.getDob().isBlank()) {
            user.setDob(java.time.LocalDate.parse(request.getDob()));
        }
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getNidOrPassport() != null) user.setNidOrPassport(request.getNidOrPassport());
        if (request.getDepartment() != null) user.setDepartment(request.getDepartment());
        if (request.getDesignation() != null) user.setDesignation(request.getDesignation());
        if (request.getPropertyId() != null) user.setPropertyId(request.getPropertyId());
        if (request.getPermissionGroupId() != null) user.setPermissionGroupId(request.getPermissionGroupId());

        // Role change rules:
        //  - VENDOR role is permanently fixed — cannot be changed to or from VENDOR
        //  - Non-vendor roles can be changed among ADMIN / ENGINEER / TECHNICIAN
        if (request.getRole() != null
                && !"VENDOR".equalsIgnoreCase(user.getRole())
                && !"VENDOR".equalsIgnoreCase(request.getRole())) {
            user.setRole(request.getRole());
        }

        return ResponseEntity.ok(userRepository.save(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody com.imms.dto.LoginRequest request) {
        return ResponseEntity.ok(userService.loginUser(request.getUsername(), request.getPassword()));
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id,
                                               @RequestParam Boolean active,
                                               @RequestParam(required = false) String note) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Block activation of VENDOR without an assigned Permission Group
        if (Boolean.TRUE.equals(active) && "VENDOR".equalsIgnoreCase(user.getRole())) {
            if (user.getPermissionGroupId() == null) {
                return ResponseEntity.badRequest()
                        .body("Cannot activate vendor: no Permission Group assigned. Edit the user profile to assign one first.");
            }
        }

        userService.updateUserStatus(id, active, note);
        return ResponseEntity.ok().build();
    }
}