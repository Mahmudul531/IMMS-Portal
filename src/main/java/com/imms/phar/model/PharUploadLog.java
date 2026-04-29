package com.imms.phar.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "phar_upload_log")
@Getter @Setter
public class PharUploadLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();

    private String status; // SUCCESS, PARTIAL, FAILED
    private Integer recordsImported = 0;
    private String errorMessage;
}
