package com.imms.repository;

import com.imms.model.entity.PermissionGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PermissionGroupRepository extends JpaRepository<PermissionGroup, Long> {
    List<PermissionGroup> findByTargetRole(String targetRole);
}

