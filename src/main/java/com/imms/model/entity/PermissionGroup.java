package com.imms.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "permission_group")
@Getter
@Setter
public class PermissionGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // e.g. "Site Engineers", "Finance Team"

    @Column(columnDefinition = "TEXT")
    private String permissions; // Comma-separated: "CREATE_ASSET,VIEW_REPORTS,MANAGE_INFRASTRUCTURE"

    // Role this group applies to: ADMIN, ENGINEER, TECHNICIAN, VENDOR
    private String targetRole;
}

