package com.imms.controller;

import com.imms.dto.PropertyRequest;
import com.imms.model.entity.Property;
import com.imms.model.entity.PropertyImage;
import com.imms.repository.PropertyRepository;
import com.imms.repository.PropertyImageRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/properties")
@CrossOrigin(origins = "*")
public class PropertyController {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private PropertyImageRepository propertyImageRepository;

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

    // ─── Image endpoints ───────────────────────────────────────────────────

    @PostMapping("/{id}/images")
    public ResponseEntity<PropertyImage> addPropertyImage(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        if (!propertyRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        PropertyImage img = new PropertyImage();
        img.setPropertyId(id);
        img.setImageData(body.get("imageData"));
        return ResponseEntity.ok(propertyImageRepository.save(img));
    }

    @GetMapping("/{id}/images")
    public ResponseEntity<List<PropertyImage>> getPropertyImages(@PathVariable Long id) {
        return ResponseEntity.ok(propertyImageRepository.findByPropertyId(id));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<Void> deletePropertyImage(
            @PathVariable Long id,
            @PathVariable Long imageId) {
        propertyImageRepository.deleteById(imageId);
        return ResponseEntity.noContent().build();
    }
}
