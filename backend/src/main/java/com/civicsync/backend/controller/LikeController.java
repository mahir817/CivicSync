package com.civicsync.backend.controller;

import com.civicsync.backend.entity.PostLike;
import com.civicsync.backend.service.LikeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class LikeController {

    private final LikeService likeService;

    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    // --- Campaign Likes ---

    @GetMapping("/api/campaigns/{id}/likes")
    public ResponseEntity<?> getCampaignLikes(@PathVariable Long id, Authentication auth) {
        String email = auth != null ? auth.getName() : null;
        return ResponseEntity.ok(likeService.getLikes(PostLike.PostType.CAMPAIGN, id, email));
    }

    @PostMapping("/api/campaigns/{id}/likes")
    public ResponseEntity<?> toggleCampaignLike(@PathVariable Long id, Authentication auth) {
        try {
            return ResponseEntity.ok(likeService.toggleLike(PostLike.PostType.CAMPAIGN, id, auth.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }

    // --- Civic Report Likes ---

    @GetMapping("/api/civic-reports/{id}/likes")
    public ResponseEntity<?> getCivicReportLikes(@PathVariable Long id, Authentication auth) {
        String email = auth != null ? auth.getName() : null;
        return ResponseEntity.ok(likeService.getLikes(PostLike.PostType.CIVIC_REPORT, id, email));
    }

    @PostMapping("/api/civic-reports/{id}/likes")
    public ResponseEntity<?> toggleCivicReportLike(@PathVariable Long id, Authentication auth) {
        try {
            return ResponseEntity.ok(likeService.toggleLike(PostLike.PostType.CIVIC_REPORT, id, auth.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }
}
