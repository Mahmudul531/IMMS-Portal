package com.imms.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role;   // ADMIN, ENGINEER, TECHNICIAN, ACCOUNTS, CONTRACTOR

    private String email;

    private Boolean active = true;

    private String inactiveNote;

    // --- Extended Profile ---
    private String fullName;
    private String phone;
    private java.time.LocalDate dob;
    private String gender;        // MALE, FEMALE, OTHER
    private String nidOrPassport;

    // --- Organization ---
    private String department;
    private String designation;
    private Long propertyId;      // Links to a property (organization/location)

    // --- Permissions ---
    private Long permissionGroupId;

    @org.hibernate.annotations.CreationTimestamp
    @jakarta.persistence.Column(updatable = false)
    private java.time.LocalDate createdAt;
}