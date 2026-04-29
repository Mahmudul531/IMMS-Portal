package com.imms.phar.repository;

import com.imms.phar.model.PharUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PharUserRepository extends JpaRepository<PharUser, Long> {
    Optional<PharUser> findByUsername(String username);
}
