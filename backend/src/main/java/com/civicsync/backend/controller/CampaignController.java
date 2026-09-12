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
    public ResponseEntity<?> getPending() {
        return ResponseEntity.ok(campaignService.getPending());
    }

    // Public - powers the Campaign Detail page (Trust Trail)
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(campaignService.getById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new AuthController.ErrorResponse(e.getMessage()));
        }
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
        @RequestPart("campaign") CreateCampaignRequest req,
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