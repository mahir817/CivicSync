package com.civicsync.backend.controller;

import com.civicsync.backend.entity.Dispute;
import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.entity.CivicReport;
import com.civicsync.backend.repository.CampaignRepository;
import com.civicsync.backend.repository.CivicReportRepository;
import com.civicsync.backend.repository.DisputeRepository;
import com.civicsync.backend.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@RestController
public class DisputeController {
    private final DisputeRepository disputes;
    private final UserRepository users;
    private final CampaignRepository campaigns;
    private final CivicReportRepository reports;

    public DisputeController(DisputeRepository disputes, UserRepository users,
            CampaignRepository campaigns, CivicReportRepository reports) {
        this.disputes = disputes;
        this.users = users;
        this.campaigns = campaigns;
        this.reports = reports;
    }

    public record NewDispute(@NotNull Dispute.PostType postType, @NotNull Long postId,
            @NotBlank String reason) {}
    public record DisputeResponse(Long id, Dispute.PostType postType, Long postId,
            String reason, Dispute.Status status, Dispute.ModerationAction action, String createdBy, Instant createdAt,
            String reviewedBy, Instant reviewedAt) {
        static DisputeResponse from(Dispute d) {
            return new DisputeResponse(d.getId(), d.getPostType(), d.getPostId(), d.getReason(),
                    d.getStatus(), d.getAction(), d.getCreatedBy().getFullName(), d.getCreatedAt(),
                    d.getReviewedBy() == null ? null : d.getReviewedBy().getFullName(), d.getReviewedAt());
        }
    }

    @PostMapping("/api/disputes")
    public DisputeResponse create(@Valid @RequestBody NewDispute req, Authentication auth) {
        boolean exists = req.postType() == Dispute.PostType.CAMPAIGN
                ? campaigns.existsById(req.postId()) : reports.existsById(req.postId());
        if (!exists) throw new IllegalArgumentException("Post not found");
        Dispute d = new Dispute();
        d.setPostType(req.postType());
        d.setPostId(req.postId());
        d.setReason(req.reason().trim());
        d.setCreatedBy(users.findByEmail(auth.getName()).orElseThrow());
        return DisputeResponse.from(disputes.save(d));
    }

    @GetMapping("/api/admin/disputes")
    public List<DisputeResponse> list() {
        return disputes.findAllByOrderByCreatedAtDesc().stream().map(DisputeResponse::from).toList();
    }

    @PatchMapping("/api/admin/disputes/{id}")
    @Transactional
    public DisputeResponse review(@PathVariable Long id, @RequestParam Dispute.Status status,
            @RequestParam(defaultValue = "KEEP") Dispute.ModerationAction action,
            Authentication auth) {
        if (status == Dispute.Status.OPEN) throw new IllegalArgumentException("Choose a review decision");
        if (status == Dispute.Status.DISMISSED) action = Dispute.ModerationAction.KEEP;
        Dispute d = disputes.findById(id).orElseThrow(() -> new IllegalArgumentException("Dispute not found"));
        if (d.getStatus() != Dispute.Status.OPEN) throw new IllegalStateException("Dispute was already reviewed");
        if (status == Dispute.Status.RESOLVED && action == Dispute.ModerationAction.HIDE) {
            if (d.getPostType() == Dispute.PostType.CAMPAIGN) {
                Campaign campaign = campaigns.findById(d.getPostId())
                        .orElseThrow(() -> new IllegalArgumentException("Campaign not found"));
                campaign.setStatus(Campaign.VerificationStatus.REJECTED);
                campaigns.save(campaign);
            } else {
                CivicReport report = reports.findById(d.getPostId())
                        .orElseThrow(() -> new IllegalArgumentException("Report not found"));
                report.setStatus(CivicReport.Status.RESOLVED);
                reports.save(report);
            }
        }
        d.setStatus(status);
        d.setAction(action);
        d.setReviewedBy(users.findByEmail(auth.getName()).orElseThrow());
        d.setReviewedAt(Instant.now());
        return DisputeResponse.from(disputes.save(d));
    }
}
