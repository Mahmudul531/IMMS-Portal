package com.imms.controller;

import com.imms.model.entity.PropertyType;
import com.imms.repository.PropertyTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/property-types")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PropertyTypeController {

    @Autowired
    private PropertyTypeRepository propertyTypeRepository;

    @GetMapping
    public List<PropertyType> getAll() {
        return propertyTypeRepository.findAll();
    }

    @PostMapping
    public PropertyType create(@RequestBody PropertyType type) {
        return propertyTypeRepository.save(type);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        propertyTypeRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
