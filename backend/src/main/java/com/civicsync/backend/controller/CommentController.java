package com.civicsync.backend.controller;

import com.civicsync.backend.dto.CommentDtos.*;
import com.civicsync.backend.entity.Comment;
import com.civicsync.backend.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    // --- Campaign comments ---

    @GetMapping("/api/campaigns/{id}/comments")
    public ResponseEntity<?> getCampaignComments(@PathVariable Long id) {
        return ResponseEntity.ok(commentService.getFor(Comment.PostType.CAMPAIGN, id));
    }

    @PostMapping("/api/campaigns/{id}/comments")
    public ResponseEntity<?> addCampaignComment(@PathVariable Long id,
                                                 @Valid @RequestBody CreateCommentRequest req,
                                                 Authentication auth) {
        try {
            return ResponseEntity.ok(commentService.create(Comment.PostType.CAMPAIGN, id, req, auth.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }

    // --- Civic report comments ---

    @GetMapping("/api/civic-reports/{id}/comments")
    public ResponseEntity<?> getCivicReportComments(@PathVariable Long id) {
        return ResponseEntity.ok(commentService.getFor(Comment.PostType.CIVIC_REPORT, id));
    }

    @PostMapping("/api/civic-reports/{id}/comments")
    public ResponseEntity<?> addCivicReportComment(@PathVariable Long id,
                                                    @Valid @RequestBody CreateCommentRequest req,
                                                    Authentication auth) {
        try {
            return ResponseEntity.ok(commentService.create(Comment.PostType.CIVIC_REPORT, id, req, auth.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }
}