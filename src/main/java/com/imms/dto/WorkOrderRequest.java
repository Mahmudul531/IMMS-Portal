package com.imms.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class WorkOrderRequest {
    // Legacy
    private String description;
    private Long assetId;
    private Long vendorId;

    // New fields
    private String jobTitle;
    private String jobCode;
    private String method;
    private Long propertyId;
    private LocalDate publishDate;
    private LocalDate closeDate;
    private BigDecimal budgetStart;
    private BigDecimal budgetEnd;
    private String eligibility;
    private List<Long> assetIds;   // Multi-asset tagging
    private Long fieldEngineerId;
}
