package com.imms.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "asset_preference")
@Getter
@Setter
public class AssetPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String prefType; // "TYPE" or "CATEGORY"

    @Column(nullable = false)
    private String prefValue; // e.g. "Fixed", "Rental", "AC"
}
