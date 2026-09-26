package com.civicsync.backend.controller;

import com.civicsync.backend.dto.DonationDtos.*;
import com.civicsync.backend.service.DonationService;
import com.civicsync.backend.service.CampaignService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/campaigns/{campaignId}/donations")
public class DonationController {

    private final DonationService donationService;
    private final CampaignService campaignService;

    public DonationController(DonationService donationService, CampaignService campaignService) {
        this.donationService = donationService;
        this.campaignService = campaignService;
    }

    // Public - shown under the Trust Trail as social proof
    @GetMapping
    public ResponseEntity<?> getAll(@PathVariable Long campaignId, Authentication auth) {
        campaignService.getById(campaignId, auth == null ? null : auth.getName());
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

    @PutMapping("/{donationId}/confirm")
    public ResponseEntity<?> confirm(@PathVariable Long campaignId, @PathVariable Long donationId, Authentication auth) {
        return ResponseEntity.ok(donationService.confirm(campaignId, donationId, auth.getName()));
    }

    @PutMapping("/{donationId}/confirm-blood")
    public ResponseEntity<?> confirmBlood(@PathVariable Long campaignId, @PathVariable Long donationId,
                                           Authentication auth) {
        return ResponseEntity.ok(donationService.confirmBlood(campaignId, donationId, auth.getName()));
    }
}
