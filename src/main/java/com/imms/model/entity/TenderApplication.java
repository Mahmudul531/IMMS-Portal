package com.imms.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name = "tender_application")
@Getter
@Setter
public class TenderApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tender_id", nullable = false)
    private Tender tender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private User vendor;

    @Column(nullable = false)
    private Double amount;

    private String documentUrl;
    private String documentName;

    // APPLIED, APPROVED, REJECTED
    private String status = "APPLIED";

    @org.hibernate.annotations.CreationTimestamp
    @Column(updatable = false)
    private LocalDate createdAt;
}
