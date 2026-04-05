package com.imms.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AssetTransferRequest {
    private Long targetPropertyId;
    private String transferNote;
}
