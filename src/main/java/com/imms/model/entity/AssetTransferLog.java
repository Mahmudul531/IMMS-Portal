package com.imms.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "asset_transfer_log")
@Getter
@Setter
public class AssetTransferLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long assetId;

    @Column(nullable = false)
    private String assetName;

    @Column(nullable = false)
    private Long fromPropertyId;

    @Column(nullable = false)
    private String fromPropertyName;

    @Column(nullable = false)
    private Long toPropertyId;

    @Column(nullable = false)
    private String toPropertyName;

    @Column(nullable = false)
    private String transferredBy;

    private String transferNote;

    @Column(nullable = false)
    private LocalDateTime transferDate;
}
