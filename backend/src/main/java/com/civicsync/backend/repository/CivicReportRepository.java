package com.civicsync.backend.repository;

import com.civicsync.backend.entity.CivicReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CivicReportRepository extends JpaRepository<CivicReport, Long> {
    List<CivicReport> findByStatusNotOrderByCreatedAtDesc(CivicReport.Status excludedStatus);
    long countByStatusNot(CivicReport.Status excludedStatus);
    List<CivicReport> findByReporterIdOrderByCreatedAtDesc(Long reporterId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from CivicReport r where r.id = :id")
    Optional<CivicReport> findLockedById(@Param("id") Long id);
}
