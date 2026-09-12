package com.civicsync.backend.controller;

import com.civicsync.backend.dto.DonationDtos.*;
import com.civicsync.backend.service.DonationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/campaigns/{campaignId}/donations")
public class DonationController {

    private final DonationService donationService;

    public DonationController(DonationService donationService) {
        this.donationService = donationService;
    }

    // Public - shown under the Trust Trail as social proof
    @GetMapping
    public ResponseEntity<?> getAll(@PathVariable Long campaignId) {
        return ResponseEntity.ok(donationService.getForCampaign(campaignId));
    }

    // Requires auth - any logged-in user can donate to a VERIFIED campaign
    @PostMapping
    public ResponseEntity<?> create(@PathVariable Long campaignId,
                                     @Valid @RequestBody CreateDonationRequest req,
                                     Authentication auth) {
        try {
            return ResponseEntity.ok(donationService.create(campaignId, req, auth.getName()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }
}