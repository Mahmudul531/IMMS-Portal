package com.imms.controller;

import com.imms.dto.PropertyRequest;
import com.imms.model.entity.Property;
import com.imms.model.entity.PropertyImage;
import com.imms.repository.PropertyRepository;
import com.imms.repository.PropertyImageRepository;
import com.imms.service.CloudinaryService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

import com.imms.model.entity.PropertyType;
import com.imms.repository.PropertyTypeRepository;

@RestController
@RequestMapping("/api/properties")
@CrossOrigin(origins = "*")
public class PropertyController {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private PropertyTypeRepository propertyTypeRepository;

    @Autowired
    private PropertyImageRepository propertyImageRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    // ─── Core CRUD ────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> createProperty(@RequestBody PropertyRequest request) {
        if (request.getCode() != null && propertyRepository.existsByCode(request.getCode())) {
            return ResponseEntity.badRequest().body("Property code already exists.");
        }
        
        Property property = new Property();
        property.setName(request.getName());
        property.setAddress(request.getAddress());
        property.setCode(request.getCode());
        property.setManagerName(request.getManagerName());
        property.setContactPhone(request.getContactPhone());
        property.setContactEmail(request.getContactEmail());
        property.setDescription(request.getDescription());
        property.setCity(request.getCity());
        property.setCountry(request.getCountry() == null ? "Bangladesh" : request.getCountry());
        property.setActive(request.getActive() == null ? true : request.getActive());
        
        if (request.getPropertyTypeId() != null) {
            PropertyType pt = propertyTypeRepository.findById(request.getPropertyTypeId()).orElse(null);
            property.setPropertyType(pt);
        }
        
        property.setLocLat(request.getLocLat());
        property.setLocLon(request.getLocLon());
        return ResponseEntity.ok(propertyRepository.save(property));
    }

    @GetMapping
    public ResponseEntity<List<Property>> getAllProperties() {
        return ResponseEntity.ok(propertyRepository.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProperty(@PathVariable Long id, @RequestBody PropertyRequest request) {
        if (request.getCode() != null && propertyRepository.existsByCodeAndIdNot(request.getCode(), id)) {
            return ResponseEntity.badRequest().body("Property code already exists.");
        }

        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        property.setName(request.getName());
        property.setAddress(request.getAddress());
        property.setCode(request.getCode());
        property.setManagerName(request.getManagerName());
        property.setContactPhone(request.getContactPhone());
        property.setContactEmail(request.getContactEmail());
        property.setDescription(request.getDescription());
        property.setCity(request.getCity());
        property.setCountry(request.getCountry() == null ? "Bangladesh" : request.getCountry());
        if(request.getActive() != null) {
            property.setActive(request.getActive());
        }

        if (request.getPropertyTypeId() != null) {
            PropertyType pt = propertyTypeRepository.findById(request.getPropertyTypeId()).orElse(null);
            property.setPropertyType(pt);
        } else {
            property.setPropertyType(null);
        }
        
        property.setLocLat(request.getLocLat());
        property.setLocLon(request.getLocLon());
        return ResponseEntity.ok(propertyRepository.save(property));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProperty(@PathVariable Long id) {
        propertyRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Image endpoints ──────────────────────────────────────────────────

    /**
     * Upload file to Cloudinary → store returned HTTPS URL in DB.
     */
    @PostMapping(value = "/{id}/images", consumes = "multipart/form-data")
    public ResponseEntity<PropertyImage> addPropertyImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        if (!propertyRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        String url = cloudinaryService.upload(file, "imms/properties");

        PropertyImage img = new PropertyImage();
        img.setPropertyId(id);
        img.setImageData(url); // full https://res.cloudinary.com/... URL
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

        propertyImageRepository.findById(imageId).ifPresent(img -> {
            cloudinaryService.delete(img.getImageData());
            propertyImageRepository.delete(img);
        });
        return ResponseEntity.noContent().build();
    }
}
