package com.imms.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String role;
    private String email;

    // Extended profile
    private String fullName;
    private String phone;
    private String dob;           // ISO date string YYYY-MM-DD
    private String gender;
    private String nidOrPassport;

    // Organization
    private String department;
    private String designation;
    private Long propertyId;

    // Permissions
    private Long permissionGroupId;
}