package com.imms.phar.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "phar_commission_result")
@Getter @Setter
public class PharCommissionResult {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "shop_id", nullable = false)
    private PharShop shop;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tier_id", nullable = false)
    private PharTier tier;

    // e.g. "2024-04" for April 2024
    @Column(nullable = false, length = 7)
    private String period;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalSales = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal baseCommission = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal bonusCommission = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalCommission = BigDecimal.ZERO;
}
