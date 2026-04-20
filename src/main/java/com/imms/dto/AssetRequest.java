package com.imms.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AssetRequest {
    private String name;
    private String type;
    private String category;
    private String supplierName;
    private String assetCode;
    private java.time.LocalDate purchaseDate;
    private java.math.BigDecimal purchaseValue;
    private Double depreciationPercentage;
    private String longDescription;
    private String remarks;
    private String invoiceUrl;
    private Long propertyId;
}
