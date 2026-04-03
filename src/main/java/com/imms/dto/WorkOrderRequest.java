package com.imms.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkOrderRequest {
    private String description;
    private Long assetId;
    private Long vendorId;
}
