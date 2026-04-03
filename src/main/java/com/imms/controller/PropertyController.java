package com.imms.controller;

import com.imms.dto.PropertyRequest;
import com.imms.model.entity.Property;
import com.imms.repository.PropertyRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
@CrossOrigin(origins = "*")
public class PropertyController {

    @Autowired
    private PropertyRepository propertyRepository;


    @PostMapping
    public ResponseEntity<Property> createProperty(@RequestBody PropertyRequest request) {
        Property property = new Property();
        property.setName(request.getName());
        property.setAddress(request.getAddress());

        property.setLocLat(request.getLocLat());
        property.setLocLon(request.getLocLon());

        return ResponseEntity.ok(propertyRepository.save(property));
    }

    @GetMapping
    public ResponseEntity<List<Property>> getAllProperties() {
        return ResponseEntity.ok(propertyRepository.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Property> updateProperty(@PathVariable Long id, @RequestBody PropertyRequest request) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        property.setName(request.getName());
        property.setAddress(request.getAddress());

        property.setLocLat(request.getLocLat());
        property.setLocLon(request.getLocLon());

        return ResponseEntity.ok(propertyRepository.save(property));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProperty(@PathVariable Long id) {
        propertyRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
