package com.imms.phar.repository;

import com.imms.phar.model.PharUploadLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PharUploadLogRepository extends JpaRepository<PharUploadLog, Long> {
    List<PharUploadLog> findAllByOrderByUploadedAtDesc();
}
