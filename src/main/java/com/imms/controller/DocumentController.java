package com.imms.controller;

import com.imms.model.entity.DocumentRecord;
import com.imms.model.entity.User;
import com.imms.repository.DocumentRepository;
import com.imms.repository.UserRepository;
import com.imms.service.DocumentService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST controller for the Document & Drawing Management module.
 *
 * All endpoints are under /api/documents
 */
@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    // ── Upload ─────────────────────────────────────────────────────────────

    /**
     * Upload a new document (or a new version of an existing title).
     *
     * Accepts multipart/form-data with:
     *   file            – the file to upload (required)
     *   title           – document title (required)
     *   description     – optional
     *   category        – optional (REPORT | ENGINEERING_DRAWING | CONTRACT | SPECIFICATION | OTHER)
     *   projectRef      – optional
     *   propertyRef     – optional
     *   uploadedById    – user ID of the uploader
     *   uploadedByName  – display name of the uploader
     */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> upload(
            @RequestParam("file")                           MultipartFile file,
            @RequestParam("title")                          String title,
            @RequestParam(value = "description",   required = false) String description,
            @RequestParam(value = "category",      required = false) String category,
            @RequestParam(value = "projectRef",    required = false) String projectRef,
            @RequestParam(value = "propertyRef",   required = false) String propertyRef,
            @RequestParam(value = "uploadedById",  required = false) Long uploadedById,
            @RequestParam(value = "uploadedByName",required = false) String uploadedByName
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File must not be empty"));
        }
        if (title == null || title.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Title is required"));
        }
        try {
            DocumentRecord saved = documentService.upload(
                    file, title, description, category,
                    projectRef, propertyRef, uploadedById, uploadedByName
            );
            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    // ── List / Search ──────────────────────────────────────────────────────

    /**
     * Returns the latest version of every document group.
     * Optional query params:
     *   q    – full-text keyword (searches title, description, category, refs, extracted PDF text)
     *   from – start date (inclusive) format: yyyy-MM-dd
     *   to   – end date   (inclusive) format: yyyy-MM-dd
     */
    @GetMapping
    public ResponseEntity<List<DocumentRecord>> list(
            @RequestParam(value = "q",    required = false) String q,
            @RequestParam(value = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to",   required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LocalDateTime fromDt = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDt   = to   != null ? to.atTime(23, 59, 59) : null;
        return ResponseEntity.ok(documentService.search(q, fromDt, toDt));
    }

    // ── Version History ────────────────────────────────────────────────────

    /**
     * Returns all versions for a document group, newest first.
     * URL: GET /api/documents/{group}/versions
     */
    @GetMapping("/{group}/versions")
    public ResponseEntity<List<DocumentRecord>> versions(@PathVariable String group) {
        return ResponseEntity.ok(documentService.getVersionHistory(group));
    }

    // ── Version count check (before upload) ───────────────────────────────

    /**
     * Check how many versions already exist for a given title.
     * Used by the frontend to warn "This will create Version N".
     * URL: GET /api/documents/check?title=XYZ
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkTitle(@RequestParam String title) {
        int count = documentService.versionCount(title);
        return ResponseEntity.ok(Map.of(
                "documentGroup", DocumentService.toSlug(title),
                "existingVersions", count,
                "nextVersion", count + 1
        ));
    }

    // ── Delete ─────────────────────────────────────────────────────────────

    /**
     * Delete a single version by its record ID.
     * Also removes the file from Cloudinary.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── User lookup for version history "uploader" link ───────────────────

    /**
     * Returns basic user info for the uploader name link in version history.
     * URL: GET /api/documents/users/{userId}
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<User> getUser(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
