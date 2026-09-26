package com.civicsync.backend.service;

import com.civicsync.backend.dto.CivicReportDtos.*;
import com.civicsync.backend.entity.CivicReport;
import com.civicsync.backend.entity.CivicConfirmation;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.CivicReportRepository;
import com.civicsync.backend.repository.CivicConfirmationRepository;
import com.civicsync.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CivicReportService {

    private static final int CONFIRMATIONS_TO_LOCK_IN = 3;

    private final CivicReportRepository civicReportRepository;
    private final UserRepository userRepository;
    private final CivicConfirmationRepository confirmationRepository;

    public CivicReportService(CivicReportRepository civicReportRepository, UserRepository userRepository,
            CivicConfirmationRepository confirmationRepository) {
        this.civicReportRepository = civicReportRepository;
        this.userRepository = userRepository;
        this.confirmationRepository = confirmationRepository;
    }

    public List<CivicReportResponse> getActive() {
        return civicReportRepository.findByStatusNotOrderByCreatedAtDesc(CivicReport.Status.RESOLVED)
                .stream().map(CivicReportResponse::from).toList();
    }

    public CivicReportResponse create(CreateCivicReportRequest req, String reporterEmail) {
        if (req.photoUrl() != null && !req.photoUrl().startsWith("/api/files/")) {
            throw new IllegalArgumentException("Photo must be an uploaded file");
        }
        if (!Double.isFinite(req.latitude()) || !Double.isFinite(req.longitude())
                || Math.abs(req.latitude()) > 90 || Math.abs(req.longitude()) > 180) {
            throw new IllegalArgumentException("Invalid map coordinates");
        }
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

    public CivicReportResponse getById(Long id) {
        CivicReport report = civicReportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));
        if (report.getStatus() == CivicReport.Status.RESOLVED) {
            throw new IllegalArgumentException("Report not found");
        }
        return CivicReportResponse.from(report);
    }

    @Transactional
    public CivicReportResponse confirm(Long id, String confirmerEmail) {
        CivicReport report = civicReportRepository.findLockedById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));

        User confirmer = userRepository.findByEmail(confirmerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (report.getStatus() == CivicReport.Status.RESOLVED) {
            throw new IllegalStateException("Report is resolved");
        }
        if (report.getReporter().getId().equals(confirmer.getId())) {
            throw new SecurityException("You cannot confirm your own report");
        }
        if (confirmationRepository.existsByReportIdAndUserId(id, confirmer.getId())) {
            throw new IllegalStateException("You already confirmed this report");
        }
        CivicConfirmation confirmation = new CivicConfirmation();
        confirmation.setReport(report);
        confirmation.setUser(confirmer);
        confirmationRepository.save(confirmation);

        report.setConfirmationCount(report.getConfirmationCount() + 1);
        if (report.getConfirmationCount() >= CONFIRMATIONS_TO_LOCK_IN
                && report.getStatus() == CivicReport.Status.UNCONFIRMED) {
            report.setStatus(CivicReport.Status.CONFIRMED);
        }

        return CivicReportResponse.from(civicReportRepository.save(report));
    }

    @Transactional
    public CivicReportResponse resolve(Long id, String actorEmail) {
        CivicReport report = civicReportRepository.findLockedById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!report.getReporter().getId().equals(actor.getId()) && actor.getRole() != User.Role.ADMIN) {
            throw new SecurityException("Only the reporter or admin can resolve this report");
        }
        report.setStatus(CivicReport.Status.RESOLVED);
        return CivicReportResponse.from(civicReportRepository.save(report));
    }
}
