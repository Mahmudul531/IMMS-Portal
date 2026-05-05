package com.imms.phar.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity
@Table(name = "phar_tier_commission_config", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tier_id", "period"})
})
@Getter @Setter
public class PharTierCommissionConfig {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tier_id", nullable = false)
    private PharTier tier;

    @Column(nullable = false, length = 7, columnDefinition = "varchar(7) default 'DEFAULT'")
    private String period; // Format: "YYYY-MM"

    // Base commission percentage (e.g. 10.00 for 10%)
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal baseCommissionPct = BigDecimal.ZERO;

    // Minimum total sales amount to qualify for bonus
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal bonusThresholdAmount = BigDecimal.ZERO;

    // Extra percentage added if threshold is met
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal bonusCommissionPct = BigDecimal.ZERO;

    @PrePersist
    @PreUpdate
    private void validateCommission() {
        BigDecimal total = (baseCommissionPct != null ? baseCommissionPct : BigDecimal.ZERO)
            .add(bonusCommissionPct != null ? bonusCommissionPct : BigDecimal.ZERO);
        if (total.compareTo(new BigDecimal("100.00")) > 0) {
            throw new IllegalArgumentException("Total commission percentage cannot exceed 100%");
        }
    }
}
