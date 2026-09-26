package com.civicsync.backend.repository;

import com.civicsync.backend.entity.CivicConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CivicConfirmationRepository extends JpaRepository<CivicConfirmation, Long> {
    boolean existsByReportIdAndUserId(Long reportId, Long userId);
}
