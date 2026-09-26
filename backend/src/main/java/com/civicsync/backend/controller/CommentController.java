package com.civicsync.backend.controller;

import com.civicsync.backend.dto.CommentDtos.*;
import com.civicsync.backend.entity.Comment;
import com.civicsync.backend.service.CommentService;
import com.civicsync.backend.service.CampaignService;
import com.civicsync.backend.service.CivicReportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class CommentController {

    private final CommentService commentService;
    private final CampaignService campaignService;
    private final CivicReportService civicReportService;

    public CommentController(CommentService commentService, CampaignService campaignService,
            CivicReportService civicReportService) {
        this.commentService = commentService;
        this.campaignService = campaignService;
        this.civicReportService = civicReportService;
    }

    // --- Campaign comments ---

    @GetMapping("/api/campaigns/{id}/comments")
    public ResponseEntity<?> getCampaignComments(@PathVariable Long id, Authentication auth) {
        campaignService.getById(id, auth == null ? null : auth.getName());
        return ResponseEntity.ok(commentService.getFor(Comment.PostType.CAMPAIGN, id));
    }

    @PostMapping("/api/campaigns/{id}/comments")
    public ResponseEntity<?> addCampaignComment(@PathVariable Long id,
                                                 @Valid @RequestBody CreateCommentRequest req,
                                                 Authentication auth) {
        campaignService.getById(id, auth.getName());
        try {
            return ResponseEntity.ok(commentService.create(Comment.PostType.CAMPAIGN, id, req, auth.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }

    // --- Civic report comments ---

    @GetMapping("/api/civic-reports/{id}/comments")
    public ResponseEntity<?> getCivicReportComments(@PathVariable Long id) {
        civicReportService.getById(id);
        return ResponseEntity.ok(commentService.getFor(Comment.PostType.CIVIC_REPORT, id));
    }

    @PostMapping("/api/civic-reports/{id}/comments")
    public ResponseEntity<?> addCivicReportComment(@PathVariable Long id,
                                                    @Valid @RequestBody CreateCommentRequest req,
                                                    Authentication auth) {
        civicReportService.getById(id);
        try {
            return ResponseEntity.ok(commentService.create(Comment.PostType.CIVIC_REPORT, id, req, auth.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }
}
