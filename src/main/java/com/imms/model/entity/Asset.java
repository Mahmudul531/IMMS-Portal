package com.imms.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;

@Entity
@Table(name = "asset")
@Getter
@Setter
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String type; // Fixed as "Physical", "Digital", "Rental"
    
    private String category;
    private String subCategory;

    private String supplierName;
    private String assetCode;
    private java.time.LocalDate purchaseDate;
    private java.math.BigDecimal purchaseValue;
    private Double depreciationPercentage;
    private String invoiceUrl;
    
    @Column(columnDefinition = "TEXT")
    private String longDescription;
    
    @Column(columnDefinition = "TEXT")
    private String remarks;

    // --- Physical Fields ---
    private String assetCondition;
    private Double weight;
    private String dimensions;
    private java.time.LocalDate installationDate;

    // --- Digital Fields ---
    private String softwareName;
    private String license;
    private java.time.LocalDate expiryDate;
    private String credentials;

    // --- Rental Fields ---
    private String rentalUnit;
    private Boolean availability;
    private java.math.BigDecimal deposit;

    // --- Status & Personnel ---
    @Column(columnDefinition = "boolean default true")
    private Boolean active = true;

    private String department;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @org.hibernate.annotations.CreationTimestamp
    @Column(updatable = false)
    private java.time.LocalDate createdAt;

    @JsonIgnore
    @OneToMany(mappedBy = "asset", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkOrder> workOrders;
}
