package com.civicsync.backend.repository;

import com.civicsync.backend.entity.SymptomReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface SymptomReportRepository extends JpaRepository<SymptomReport, Long> {
    List<SymptomReport> findByReportedAtAfter(Instant since);
}