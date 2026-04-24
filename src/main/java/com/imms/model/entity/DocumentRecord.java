package com.imms.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Represents one uploaded version of a document or drawing.
 *
 * Versioning model:
 *   - documentGroup  = normalized slug of the document title (shared across versions)
 *   - version        = monotonically increasing integer per group (1, 2, 3 …)
 *
 * Full-text search:
 *   - extractedText  = plain-text content extracted from PDF at upload time via PDFBox.
 *                      NULL for binary/DWG/non-PDF files. Searched via ILIKE in PostgreSQL.
 */
@Entity
@Table(name = "document_record")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Normalised slug used to group all versions of the same document together.
     * Generated from the title: lower-cased, spaces → underscores.
     * Example: "Site Survey Report" → "site_survey_report"
     */
    @Column(nullable = false)
    private String documentGroup;

    /** Human-readable document title provided by the uploader */
    @Column(nullable = false)
    private String title;

    /** Optional description / purpose of the file */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** Category: ENGINEERING_DRAWING | REPORT | CONTRACT | SPECIFICATION | OTHER */
    private String category;

    /** Free-text project reference (e.g. work order number or project name) */
    private String projectRef;

    /** Free-text property reference */
    private String propertyRef;

    /** Original file name as supplied by the browser */
    private String originalFileName;

    /** MIME type or extension (pdf, dwg, docx, xlsx, …) */
    private String fileType;

    /** File size in bytes */
    private Long fileSizeBytes;

    /** Cloudinary secure URL */
    @Column(nullable = false, length = 2048)
    private String cloudinaryUrl;

    /** Cloudinary public_id – needed for deletion */
    @Column(length = 1024)
    private String cloudinaryPublicId;

    /**
     * Plain text extracted from PDF content via PDFBox at upload time.
     * NULL for non-extractable formats (DWG, images, etc.).
     * Used for full-text keyword search.
     */
    @Column(columnDefinition = "TEXT")
    private String extractedText;

    /** Version number within the document group (1 = first upload, 2 = first revision, …) */
    @Column(nullable = false)
    private Integer version;

    // ── Uploader info ──────────────────────────────────────────────────────

    /** ID of the user who uploaded this version */
    private Long uploadedByUserId;

    /** Display name of the uploader (denormalised for quick display) */
    private String uploadedByName;

    // ── Audit ──────────────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime uploadedAt;
}
