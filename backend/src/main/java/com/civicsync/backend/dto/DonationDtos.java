package com.civicsync.backend.dto;

import com.civicsync.backend.entity.Donation;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class DonationDtos {

    public record CreateDonationRequest(
            @NotNull Donation.Type type,
            Double amount,   // required if type = MONETARY, ignored for PLEDGE
            String message,
            String contactPhone
    ) {}

    public record DonationResponse(
            Long id,
            Long campaignId,
            String campaignTitle,
            Donation.Type type,
            Double amount,
            String message,
            String contactPhone,
            String donorName,
            Donation.Status status,
            Instant confirmedAt,
            Instant createdAt
    ) {
        public static DonationResponse from(Donation d) {
            return new DonationResponse(
                    d.getId(),
                    d.getCampaign().getId(),
                    d.getCampaign().getTitle(),
                    d.getType(),
                    d.getAmount(),
                    d.getMessage(),
                    d.getContactPhone(),
                    d.getDonor().getFullName(),
                    d.getStatus() == null ? Donation.Status.CONFIRMED : d.getStatus(),
                    d.getConfirmedAt(),
                    d.getCreatedAt()
            );
        }
        public static DonationResponse publicFrom(Donation d) {
            DonationResponse full = from(d);
            return new DonationResponse(full.id(), full.campaignId(), full.campaignTitle(), full.type(),
                    full.amount(), null, null, full.donorName(), full.status(), full.confirmedAt(), full.createdAt());
        }
    }
}
