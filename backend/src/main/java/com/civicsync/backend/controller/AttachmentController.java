package com.civicsync.backend.controller;

import com.civicsync.backend.dto.AttachmentDtos.AttachmentResponse;
import com.civicsync.backend.service.AttachmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns/{campaignId}/attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    // Public - shown on the Campaign Detail page
    @GetMapping
    public ResponseEntity<?> getAll(@PathVariable Long campaignId) {
        return ResponseEntity.ok(attachmentService.getForCampaign(campaignId));
    }

    // Requires auth - only the campaign's own requester can attach files
    @PostMapping
    public ResponseEntity<?> upload(@PathVariable Long campaignId,
                                     @RequestParam("files") MultipartFile[] files,
                                     Authentication auth) {
        try {
            List<AttachmentResponse> uploaded = attachmentService.upload(campaignId, files, auth.getName());
            return ResponseEntity.ok(uploaded);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(new AuthController.ErrorResponse(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }
}