package com.civicsync.backend.controller;

import com.civicsync.backend.controller.AuthController.ErrorResponse;
import com.civicsync.backend.dto.CampaignDtos;
import com.civicsync.backend.dto.CampaignDtos.*;
import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.service.AttachmentService;
import com.civicsync.backend.service.CampaignService;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/campaigns")
public class CampaignController {

    private final CampaignService campaignService;
    private final AttachmentService attachmentService;

public CampaignController(CampaignService campaignService, AttachmentService attachmentService) {
    this.campaignService = campaignService;
    this.attachmentService = attachmentService;
}

    // Public - powers the Home feed, no auth required to browse
    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) Campaign.Category category) {
        if (category != null) {
            return ResponseEntity.ok(campaignService.getByCategory(category));
        }
        return ResponseEntity.ok(campaignService.getAll());
    }

    // Verifier/Admin only - powers the Verifier Dashboard queue
    @GetMapping("/pending")
    public ResponseEntity<?> getPending(Authentication auth) {
        return ResponseEntity.ok(campaignService.getPending(auth.getName()));
    }

    @GetMapping("/outcomes/pending")
    public ResponseEntity<?> getPendingOutcomes(Authentication auth) {
        return ResponseEntity.ok(campaignService.getPendingOutcomes(auth.getName()));
    }

    // Requires auth - powers "My Posts" on the Profile page
    @GetMapping("/mine")
    public ResponseEntity<?> getMine(Authentication auth) {
        return ResponseEntity.ok(campaignService.getMine(auth.getName()));
    }

    // Public - powers the Campaign Detail page (Trust Trail)
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id, Authentication auth) {
        try {
            return ResponseEntity.ok(campaignService.getById(id, auth == null ? null : auth.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/{id}/outcome")
    public ResponseEntity<?> submitOutcome(@PathVariable Long id,
            @Valid @RequestBody CampaignDtos.OutcomeRequest req, Authentication auth) {
        return ResponseEntity.ok(campaignService.submitOutcome(id, req, auth.getName()));
    }

    @PutMapping("/{id}/outcome/approve")
    public ResponseEntity<?> approveOutcome(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(campaignService.approveOutcome(id, auth.getName()));
    }


    // Requires auth - creates a PENDING campaign tied to the logged-in user
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateCampaignRequest req, Authentication auth) {
        try {
            String email = auth.getName();
            return ResponseEntity.ok(campaignService.create(req, email));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> resubmit(@PathVariable Long id,
            @Valid @RequestBody CreateCampaignRequest req, Authentication auth) {
        return ResponseEntity.ok(campaignService.resubmit(id, req, auth.getName()));
    }

    @PutMapping("/{id}/review")
    public ResponseEntity<?> review(@PathVariable Long id,
            @Valid @RequestBody CampaignDtos.ReviewRequest req, Authentication auth) {
        return ResponseEntity.ok(campaignService.review(id, req, auth.getName()));
    }

    // Verifier/Admin only - approves or rejects a pending campaign
    @PutMapping("/{id}/verify")
    public ResponseEntity<?> verify(@PathVariable Long id,
                                     @RequestParam boolean approve,
                                     Authentication auth) {
        try {
            return ResponseEntity.ok(campaignService.verify(id, auth.getName(), approve));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping(value = "/with-images", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<?> createWithImages(
        @Valid @RequestPart("campaign") CreateCampaignRequest req,
        @RequestPart(value = "files", required = false) org.springframework.web.multipart.MultipartFile[] files,
        Authentication auth) {
             try {
                 CampaignResponse created = campaignService.create(req, auth.getName());

                    List<com.civicsync.backend.dto.AttachmentDtos.AttachmentResponse> attachments =
                        (files != null && files.length > 0)
                                ? attachmentService.upload(created.id(), files, auth.getName())
                                : List.of();

                    return ResponseEntity.ok(new CampaignDtos.CampaignWithAttachmentsResponse(created, attachments));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
            }
    }
}
