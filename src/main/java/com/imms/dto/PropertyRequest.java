package com.imms.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PropertyRequest {
    private String name;
    private String address;
    private String locLat;
    private String locLon;
}
