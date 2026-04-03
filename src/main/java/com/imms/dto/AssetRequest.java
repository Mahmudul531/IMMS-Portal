package com.imms.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AssetRequest {
    private String name;
    private String type;
    private Long propertyId;
}
