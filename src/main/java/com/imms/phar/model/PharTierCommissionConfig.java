package com.imms.phar.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "phar_tier_commission_config")
@Getter @Setter
public class PharTierCommissionConfig {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tier_id", unique = true, nullable = false)
    private PharTier tier;

    // Base commission percentage (e.g. 10.00 for 10%)
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal baseCommissionPct = BigDecimal.ZERO;

    // Minimum total sales amount to qualify for bonus
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal bonusThresholdAmount = BigDecimal.ZERO;

    // Extra percentage added if threshold is met
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal bonusCommissionPct = BigDecimal.ZERO;
}
