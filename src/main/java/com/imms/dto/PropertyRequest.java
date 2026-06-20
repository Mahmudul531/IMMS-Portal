package com.imms.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PropertyRequest {
    private String name;
    private String address;
    private String code;
    private Long propertyTypeId;
    private String managerName;
    private String contactPhone;
    private String contactEmail;
    private String description;
    private String city;
    private String country;
    private Boolean active;
    
    private String locLat;
    private String locLon;
    private Long parentPropertyId;
}
