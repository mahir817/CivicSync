package com.civicsync.backend.service;

import com.civicsync.backend.dto.CivicReportDtos.*;
import com.civicsync.backend.entity.CivicReport;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.CivicReportRepository;
import com.civicsync.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CivicReportService {

    private static final int CONFIRMATIONS_TO_LOCK_IN = 3;

    private final CivicReportRepository civicReportRepository;
    private final UserRepository userRepository;

    public CivicReportService(CivicReportRepository civicReportRepository, UserRepository userRepository) {
        this.civicReportRepository = civicReportRepository;
        this.userRepository = userRepository;
    }

    public List<CivicReportResponse> getActive() {
        return civicReportRepository.findByStatusNotOrderByCreatedAtDesc(CivicReport.Status.RESOLVED)
                .stream().map(CivicReportResponse::from).toList();
    }

    public CivicReportResponse create(CreateCivicReportRequest req, String reporterEmail) {
        User reporter = userRepository.findByEmail(reporterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CivicReport report = new CivicReport();
        report.setReporter(reporter);
        report.setLatitude(req.latitude());
        report.setLongitude(req.longitude());
        report.setDescription(req.description());
        report.setPhotoUrl(req.photoUrl());
        report.setStatus(CivicReport.Status.UNCONFIRMED);

        return CivicReportResponse.from(civicReportRepository.save(report));
    }

    // No duplicate-confirmer tracking yet (see README known-gaps) — same user could confirm
    // their own report or confirm multiple times. Fine for demo, flagged for later.
    public CivicReportResponse confirm(Long id) {
        CivicReport report = civicReportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));

        report.setConfirmationCount(report.getConfirmationCount() + 1);
        if (report.getConfirmationCount() >= CONFIRMATIONS_TO_LOCK_IN
                && report.getStatus() == CivicReport.Status.UNCONFIRMED) {
            report.setStatus(CivicReport.Status.CONFIRMED);
        }

        return CivicReportResponse.from(civicReportRepository.save(report));
    }

    public CivicReportResponse resolve(Long id) {
        CivicReport report = civicReportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));
        report.setStatus(CivicReport.Status.RESOLVED);
        return CivicReportResponse.from(civicReportRepository.save(report));
    }
}