package com.civicsync.backend.dto;

import com.civicsync.backend.entity.CivicReport;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class CivicReportDtos {

    public record CreateCivicReportRequest(
            @NotNull Double latitude,
            @NotNull Double longitude,
            @NotBlank String description,
            String photoUrl // optional
    ) {}

    public record CivicReportResponse(
            Long id,
            Double latitude,
            Double longitude,
            String description,
            String photoUrl,
            CivicReport.Status status,
            Integer confirmationCount,
            Long reporterId,
            String reporterName,
            Instant createdAt,
            Instant lastConfirmedAt
    ) {
        public static CivicReportResponse from(CivicReport r) {
            return new CivicReportResponse(
                    r.getId(),
                    r.getLatitude(),
                    r.getLongitude(),
                    r.getDescription(),
                    r.getPhotoUrl(),
                    r.getStatus(),
                    r.getConfirmationCount(),
                    r.getReporter().getId(),
                    r.getReporter().getFullName(),
                    r.getCreatedAt(),
                    r.getLastConfirmedAt()
            );
        }
    }
}
