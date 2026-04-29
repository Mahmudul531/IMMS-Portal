package com.imms.phar.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "phar_tier")
@Getter @Setter
public class PharTier {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private Integer tierNumber; // 1, 2, 3

    @Column(nullable = false)
    private String label; // e.g. "Tier 1 - Premium"
}
