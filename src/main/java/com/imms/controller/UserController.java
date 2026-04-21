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
    public ResponseEntity<User> register(@RequestBody RegisterRequest request) {
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword());
        user.setRole(request.getRole());
        user.setEmail(request.getEmail());

        // Extended profile
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        if (request.getDob() != null && !request.getDob().isBlank()) {
            user.setDob(java.time.LocalDate.parse(request.getDob()));
        }
        user.setGender(request.getGender());
        user.setNidOrPassport(request.getNidOrPassport());

        // Organization
        user.setDepartment(request.getDepartment());
        user.setDesignation(request.getDesignation());
        user.setPropertyId(request.getPropertyId());

        // Permissions
        user.setPermissionGroupId(request.getPermissionGroupId());

        if ("VENDOR".equalsIgnoreCase(request.getRole())) {
            user.setActive(false);
            user.setInactiveNote("Pending Admin Approval");
        }

        return ResponseEntity.ok(userService.registerUser(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody RegisterRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        if (request.getFullName() != null) user.setFullName(request.getFullName());
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
        if (request.getRole() != null) user.setRole(request.getRole());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody com.imms.dto.LoginRequest request) {
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
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestParam Boolean active, @RequestParam(required = false) String note) {
        userService.updateUserStatus(id, active, note);
        return ResponseEntity.ok().build();
    }
}