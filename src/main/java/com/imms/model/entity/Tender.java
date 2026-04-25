package com.imms.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name = "tender")
@Getter
@Setter
public class Tender {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "budget_start")
    private Double budgetStart;

    @Column(name = "budget_end")
    private Double budgetEnd;

    // OPEN_BID, DIRECT_ASSIGN
    @Column(nullable = false)
    private String method;

    // OPEN, PENDING_APPROVAL, APPROVED, REJECTED
    @Column(nullable = false)
    private String status = "OPEN";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id")
    private Property property;

    // For DIRECT_ASSIGN
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_vendor_id")
    private User assignedVendor;

    @Column(name = "assigned_amount")
    private Double assignedAmount;

    @org.hibernate.annotations.CreationTimestamp
    @Column(updatable = false)
    private LocalDate createdAt;
}
