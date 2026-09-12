package com.civicsync.backend.dto;

import com.civicsync.backend.entity.Donation;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class DonationDtos {

    public record CreateDonationRequest(
            @NotNull Donation.Type type,
            Double amount,   // required if type = MONETARY, ignored for PLEDGE
            String message
    ) {}

    public record DonationResponse(
            Long id,
            Donation.Type type,
            Double amount,
            String message,
            String donorName,
            Instant createdAt
    ) {
        public static DonationResponse from(Donation d) {
            return new DonationResponse(
                    d.getId(),
                    d.getType(),
                    d.getAmount(),
                    d.getMessage(),
                    d.getDonor().getFullName(),
                    d.getCreatedAt()
            );
        }
    }
}