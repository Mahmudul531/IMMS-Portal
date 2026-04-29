package com.imms.phar.controller;

import com.imms.phar.model.PharUser;
import com.imms.phar.repository.PharUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/phar/api/auth")
@CrossOrigin(origins = "*")
public class PharAuthController {

    @Autowired private PharUserRepository userRepo;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        Optional<PharUser> userOpt = userRepo.findByUsername(username);
        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(password)) {
            return ResponseEntity.status(401).body("Invalid username or password");
        }

        PharUser user = userOpt.get();
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", user.getId());
        resp.put("username", user.getUsername());
        resp.put("fullName", user.getFullName());
        resp.put("role", user.getRole());
        return ResponseEntity.ok(resp);
    }

    // Seed default admin user p/p if not exists
    @PostMapping("/seed")
    public ResponseEntity<?> seed() {
        if (userRepo.findByUsername("p").isEmpty()) {
            PharUser u = new PharUser();
            u.setUsername("p");
            u.setPassword("p");
            u.setFullName("Pharma Admin");
            u.setRole("ADMIN");
            userRepo.save(u);
            return ResponseEntity.ok("Default user 'p' created.");
        }
        return ResponseEntity.ok("User already exists.");
    }
}
