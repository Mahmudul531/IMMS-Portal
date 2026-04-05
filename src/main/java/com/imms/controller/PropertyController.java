package com.imms.controller;

import com.imms.dto.PropertyRequest;
import com.imms.model.entity.Property;
import com.imms.model.entity.PropertyImage;
import com.imms.repository.PropertyRepository;
import com.imms.repository.PropertyImageRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/properties")
@CrossOrigin(origins = "*")
public class PropertyController {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private PropertyImageRepository propertyImageRepository;

    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;

    // ─── Core CRUD ─────────────────────────────────────────────────────────

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

    // ─── Image endpoints ────────────────────────────────────────────────────

    /**
     * Upload a file, save it to the upload directory, and store the URL in DB.
     * URL format: /uploads/properties/{filename}
     */
    @PostMapping(value = "/{id}/images", consumes = "multipart/form-data")
    public ResponseEntity<PropertyImage> addPropertyImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        if (!propertyRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        // Ensure directory exists
        Path dir = Paths.get(uploadDir, "properties").toAbsolutePath();
        Files.createDirectories(dir);

        // Generate unique filename
        String ext = getExtension(file.getOriginalFilename());
        String filename = "prop_" + id + "_" + UUID.randomUUID().toString().replace("-", "") + ext;
        Path filePath = dir.resolve(filename);
        Files.write(filePath, file.getBytes());

        // Store the public URL
        String url = "/uploads/properties/" + filename;
        PropertyImage img = new PropertyImage();
        img.setPropertyId(id);
        img.setImageData(url);
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
            // Delete physical file
            try {
                String filename = Paths.get(img.getImageData()).getFileName().toString();
                Path file = Paths.get(uploadDir, "properties", filename).toAbsolutePath();
                Files.deleteIfExists(file);
            } catch (IOException e) {
                // log but don't fail
            }
            propertyImageRepository.delete(img);
        });
        return ResponseEntity.noContent().build();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf('.'));
    }
}
