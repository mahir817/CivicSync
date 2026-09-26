package com.civicsync.backend.dto;

import com.civicsync.backend.entity.Campaign;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class CampaignDtos {

    public record CreateCampaignRequest(
            @NotBlank String title,
            @NotBlank String description,
            @NotNull Campaign.Category category,
            String location,
            Double latitude,
            Double longitude,
            Double goalAmount
    ) {}

    public record CampaignResponse(
            Long id,
            String title,
            String description,
            Campaign.Category category,
            Campaign.VerificationStatus status,
            String location,
            Double latitude,
            Double longitude,
            Double goalAmount,
            Double raisedAmount,
            Long requesterId,
            String requesterName,
            String verifiedByName,
            Instant createdAt,
            Instant verifiedAt,
            String outcomeSummary,
            String outcomeProofUrl,
            boolean outcomeApproved,
            Instant completedAt
    ) {
        public static CampaignResponse from(Campaign c) {
            return new CampaignResponse(
                    c.getId(),
                    c.getTitle(),
                    c.getDescription(),
                    c.getCategory(),
                    c.getStatus(),
                    c.getLocation(),
                    c.getLatitude(),
                    c.getLongitude(),
                    c.getGoalAmount(),
                    c.getRaisedAmount(),
                    c.getRequester() != null ? c.getRequester().getId() : null,
                    c.getRequester() != null ? c.getRequester().getFullName() : null,
                    c.getVerifiedBy() != null ? c.getVerifiedBy().getFullName() : null,
                    c.getCreatedAt(),
                    c.getVerifiedAt(),
                    c.isOutcomeApproved() ? c.getOutcomeSummary() : null,
                    c.isOutcomeApproved() ? c.getOutcomeProofUrl() : null,
                    c.isOutcomeApproved(),
                    c.getCompletedAt()
            );
        }
    }

    public record CampaignWithAttachmentsResponse(
        CampaignResponse campaign,
        java.util.List<com.civicsync.backend.dto.AttachmentDtos.AttachmentResponse> attachments
    ) {}

    public record OutcomeRequest(@NotBlank String summary, String proofUrl) {}
}
