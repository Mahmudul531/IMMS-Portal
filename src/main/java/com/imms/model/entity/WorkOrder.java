package com.imms.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "work_order")
@Getter
@Setter
public class WorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Legacy field kept for backward compat; jobTitle replaces it
    @Column(columnDefinition = "TEXT")
    private String description;

    // --- New Job Fields ---
    private String jobTitle;

    @Column(unique = true)
    private String jobCode;

    private String method; // OTM, RFP, EoI, etc.

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, APPLIED, ASSIGNED, COMPLETED, CANCELLED

    // Timeline
    private LocalDate publishDate;
    private LocalDate closeDate;

    // Budget
    private BigDecimal budgetStart;
    private BigDecimal budgetEnd;

    // Eligibility / rich description
    @Column(columnDefinition = "TEXT")
    private String eligibility;

    // Property link
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "property_id")
    private Property property;

    // Legacy single asset (kept for backward compat)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "asset_id")
    private Asset asset;

    // Multi-asset tagging
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "work_order_assets",
        joinColumns = @JoinColumn(name = "work_order_id"),
        inverseJoinColumns = @JoinColumn(name = "asset_id")
    )
    private List<Asset> taggedAssets;

    // Field engineer (ENGINEER role only)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "field_engineer_id")
    private User fieldEngineer;

    // Assigned vendor (from bidding flow)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vendor_id")
    private User vendor;

    private Double amount;

    @org.hibernate.annotations.CreationTimestamp
    @Column(updatable = false)
    private LocalDate createdAt;

    @JsonIgnore
    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkOrderApplication> applications;
}
