package com.imms.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AssetRequest {
    private String name;
    private String type;
    private String category;
    private String subCategory;
    private String supplierName;
    private String assetCode;
    private java.time.LocalDate purchaseDate;
    private java.math.BigDecimal purchaseValue;
    private Double depreciationPercentage;
    private String longDescription;
    private String remarks;
    private String invoiceUrl;
    private Long propertyId;

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
    private Boolean active;
    private String department;
    private Long assignedUserId;
}
