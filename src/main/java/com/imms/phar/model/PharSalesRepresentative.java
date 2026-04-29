package com.imms.phar.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "phar_sales_representative")
@Getter @Setter
public class PharSalesRepresentative {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String phone;
    private String email;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "territory_id", nullable = false)
    private PharTerritory territory;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_manager_id", nullable = false)
    private PharSalesManager salesManager;
}
