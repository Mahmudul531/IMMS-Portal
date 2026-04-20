package com.imms.controller;

import com.imms.model.entity.AssetPreference;
import com.imms.repository.AssetPreferenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/preferences/assets")
@CrossOrigin(origins = "*")
public class AssetPreferenceController {

    @Autowired
    private AssetPreferenceRepository repository;

    @GetMapping
    public ResponseEntity<List<AssetPreference>> getAllPreferences(@RequestParam(required = false) String type) {
        if (type != null && !type.isBlank()) {
            return ResponseEntity.ok(repository.findByPrefType(type));
        }
        return ResponseEntity.ok(repository.findAll());
    }

    @PostMapping
    public ResponseEntity<AssetPreference> createPreference(@RequestBody AssetPreference pref) {
        return ResponseEntity.ok(repository.save(pref));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetPreference> updatePreference(@PathVariable Long id, @RequestBody AssetPreference pref) {
        AssetPreference existing = repository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        existing.setPrefType(pref.getPrefType());
        existing.setPrefValue(pref.getPrefValue());
        return ResponseEntity.ok(repository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePreference(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
