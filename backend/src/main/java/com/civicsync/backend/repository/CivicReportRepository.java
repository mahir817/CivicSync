package com.civicsync.backend.repository;

import com.civicsync.backend.entity.CivicReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CivicReportRepository extends JpaRepository<CivicReport, Long> {
    List<CivicReport> findByStatusNotOrderByCreatedAtDesc(CivicReport.Status excludedStatus);
}