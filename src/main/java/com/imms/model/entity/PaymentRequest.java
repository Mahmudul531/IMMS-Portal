package com.imms.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name = "payment_request")
@Getter
@Setter
public class PaymentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "work_order_id", nullable = false)
    private WorkOrder workOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vendor_id", nullable = false)
    private User vendor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "task_id", nullable = true)
    private Task task;

    @Column(nullable = false)
    private Double amount;

    // Status: PENDING_ENGINEER, PENDING_ADMIN, APPROVED, REJECTED
    @Column(nullable = false)
    private String status = "PENDING_ENGINEER";

    private String invoiceUrl;
    
    private String note;

    @org.hibernate.annotations.CreationTimestamp
    @Column(updatable = false)
    private LocalDate createdAt;
}
