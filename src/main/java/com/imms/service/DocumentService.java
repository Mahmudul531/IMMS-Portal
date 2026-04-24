package com.imms.service;

import com.imms.model.entity.DocumentRecord;
import com.imms.repository.DocumentRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Handles all business logic for document/drawing upload, versioning, and search.
 *
 * Upload flow:
 *   1. Normalise title → documentGroup slug
 *   2. Upload file to Cloudinary (resource_type=raw for all docs)
 *   3. Extract plain text if PDF (via PDFBox) → stored in extractedText for search
 *   4. Compute version = maxVersionByGroup + 1
 *   5. Persist DocumentRecord
 */
@Service
public class DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    // ── Public API ─────────────────────────────────────────────────────────

    /**
     * Upload a new document (or new version of an existing one).
     *
     * @param file           the multipart file
     * @param title          user-supplied title
     * @param description    optional description
     * @param category       e.g. REPORT, ENGINEERING_DRAWING
     * @param projectRef     optional project reference
     * @param propertyRef    optional property reference
     * @param uploadedById   user ID of uploader
     * @param uploadedByName display name of uploader
     * @return the persisted DocumentRecord
     */
    public DocumentRecord upload(
            MultipartFile file,
            String title,
            String description,
            String category,
            String projectRef,
            String propertyRef,
            Long uploadedById,
            String uploadedByName
    ) throws IOException {

        // 1. Normalise title to documentGroup slug
        String documentGroup = toSlug(title);

        // 2. Upload to Cloudinary – always use raw so any file type is preserved
        Map<?, ?> uploadResult = cloudinaryService.uploadRaw(file, "imms/documents");
        String url      = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id");
        Long   bytes    = uploadResult.get("bytes") instanceof Number n ? n.longValue() : null;

        // 3. Extract text for PDFs
        String extractedText = null;
        String contentType = file.getContentType();
        if (contentType != null && contentType.equalsIgnoreCase("application/pdf")) {
            extractedText = extractPdfText(file.getBytes());
        }

        // 4. Compute version
        int nextVersion = documentRepository.maxVersionByGroup(documentGroup) + 1;

        // 5. Persist
        DocumentRecord record = new DocumentRecord();
        record.setDocumentGroup(documentGroup);
        record.setTitle(title);
        record.setDescription(description);
        record.setCategory(category);
        record.setProjectRef(projectRef);
        record.setPropertyRef(propertyRef);
        record.setOriginalFileName(file.getOriginalFilename());
        record.setFileType(deriveFileType(file));
        record.setFileSizeBytes(bytes);
        record.setCloudinaryUrl(url);
        record.setCloudinaryPublicId(publicId);
        record.setExtractedText(extractedText);
        record.setVersion(nextVersion);
        record.setUploadedByUserId(uploadedById);
        record.setUploadedByName(uploadedByName);

        return documentRepository.save(record);
    }

    /** Returns latest version of every document group, with optional search + date filter */
    public List<DocumentRecord> search(String q, LocalDateTime from, LocalDateTime to) {
        String keyword = (q != null && !q.isBlank()) ? q.trim() : "";
        LocalDateTime actualFrom = from != null ? from : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime actualTo   = to   != null ? to   : LocalDateTime.of(2999, 12, 31, 23, 59);
        return documentRepository.search(keyword, actualFrom, actualTo);
    }

    /** All versions for a document group, newest first */
    public List<DocumentRecord> getVersionHistory(String documentGroup) {
        return documentRepository.findByDocumentGroupOrderByVersionDesc(documentGroup);
    }

    /** Delete one version record and remove file from Cloudinary */
    public void delete(Long id) {
        documentRepository.findById(id).ifPresent(rec -> {
            cloudinaryService.deleteByPublicId(rec.getCloudinaryPublicId(), "raw");
            documentRepository.delete(rec);
        });
    }

    /** How many versions exist for a given document title */
    public int versionCount(String title) {
        return documentRepository.maxVersionByGroup(toSlug(title));
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Normalise a title into a URL/slug-safe group key.
     * "Site Survey Report 2024" → "site_survey_report_2024"
     */
    public static String toSlug(String title) {
        if (title == null) return "unknown";
        return title.trim()
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s_-]", "")
                .replaceAll("\\s+", "_");
    }

    /**
     * Extract all text from a PDF byte array using Apache PDFBox.
     * Returns null instead of throwing if extraction fails (e.g. password-protected).
     */
    private String extractPdfText(byte[] pdfBytes) {
        if (pdfBytes == null || pdfBytes.length == 0) return null;
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            if (doc.isEncrypted()) return null;
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);
            // Truncate to 500 KB to avoid bloating the DB
            return text != null && text.length() > 512_000 ? text.substring(0, 512_000) : text;
        } catch (Exception e) {
            System.err.println("PDFBox extraction warning: " + e.getMessage());
            return null;
        }
    }

    private String deriveFileType(MultipartFile file) {
        String ct = file.getContentType();
        if (ct != null) {
            if (ct.contains("pdf"))  return "pdf";
            if (ct.contains("word") || ct.contains("docx") || ct.contains("msword")) return "docx";
            if (ct.contains("excel") || ct.contains("spreadsheet")) return "xlsx";
            if (ct.contains("image")) return "image";
        }
        String name = file.getOriginalFilename();
        if (name != null) {
            int dot = name.lastIndexOf('.');
            if (dot >= 0) return name.substring(dot + 1).toLowerCase();
        }
        return "file";
    }
}
