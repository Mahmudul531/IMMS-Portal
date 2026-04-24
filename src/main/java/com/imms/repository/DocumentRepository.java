package com.imms.repository;

import com.imms.model.entity.DocumentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<DocumentRecord, Long> {

    /** All versions for a specific document group, newest first */
    List<DocumentRecord> findByDocumentGroupOrderByVersionDesc(String documentGroup);

    /** Maximum version number for a group (returns 0 if group doesn't exist) */
    @Query("SELECT COALESCE(MAX(d.version), 0) FROM DocumentRecord d WHERE d.documentGroup = :group")
    int maxVersionByGroup(@Param("group") String group);

    /**
     * Returns the latest version of every unique documentGroup.
     * Used for the main document list page.
     */
    @Query("""
        SELECT d FROM DocumentRecord d
        WHERE d.version = (
            SELECT MAX(d2.version) FROM DocumentRecord d2
            WHERE d2.documentGroup = d.documentGroup
        )
        ORDER BY d.uploadedAt DESC
        """)
    List<DocumentRecord> findAllLatestVersions();

    /**
     * Full search with optional keyword (title, description, category, projectRef,
     * propertyRef, originalFileName, extractedText) and optional date range.
     * All conditions are nullable – if null, that filter is skipped.
     */
    @Query("""
        SELECT d FROM DocumentRecord d
        WHERE d.version = (
            SELECT MAX(d2.version) FROM DocumentRecord d2
            WHERE d2.documentGroup = d.documentGroup
        )
        AND (:q = '' OR
             LOWER(d.title)            LIKE LOWER(CONCAT('%', :q, '%')) OR
             LOWER(d.description)      LIKE LOWER(CONCAT('%', :q, '%')) OR
             LOWER(d.category)         LIKE LOWER(CONCAT('%', :q, '%')) OR
             LOWER(d.projectRef)       LIKE LOWER(CONCAT('%', :q, '%')) OR
             LOWER(d.propertyRef)      LIKE LOWER(CONCAT('%', :q, '%')) OR
             LOWER(d.originalFileName) LIKE LOWER(CONCAT('%', :q, '%')) OR
             LOWER(d.extractedText)    LIKE LOWER(CONCAT('%', :q, '%'))
        )
        AND (d.uploadedAt >= :from)
        AND (d.uploadedAt <= :to)
        ORDER BY d.uploadedAt DESC
        """)
    List<DocumentRecord> search(
            @Param("q")    String q,
            @Param("from") LocalDateTime from,
            @Param("to")   LocalDateTime to
    );

    /** Count versions for a group */
    long countByDocumentGroup(String documentGroup);

    /** Check if any document with a given group exists */
    boolean existsByDocumentGroup(String documentGroup);
}
