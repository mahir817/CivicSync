package com.civicsync.backend.service;

import com.civicsync.backend.dto.CampaignDtos.*;
import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.CampaignRepository;
import com.civicsync.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class CampaignService {

    public record PendingOutcome(CampaignResponse campaign, String summary, String proofUrl) {}

    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;

    public CampaignService(CampaignRepository campaignRepository, UserRepository userRepository) {
        this.campaignRepository = campaignRepository;
        this.userRepository = userRepository;
    }

    public List<CampaignResponse> getAll() {
        return campaignRepository.findByStatusInOrderByCreatedAtDesc(List.of(
                Campaign.VerificationStatus.VERIFIED, Campaign.VerificationStatus.COMPLETED))
                .stream().map(CampaignResponse::from).toList();
    }

    public List<CampaignResponse> getByCategory(Campaign.Category category) {
        return campaignRepository.findByCategory(category)
                .stream().filter(c -> c.getStatus() == Campaign.VerificationStatus.VERIFIED
                        || c.getStatus() == Campaign.VerificationStatus.COMPLETED)
                .map(CampaignResponse::from).toList();
    }

    public CampaignResponse getById(Long id, String viewerEmail) {
    Campaign campaign = campaignRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Campaign not found"));
    if (campaign.getStatus() != Campaign.VerificationStatus.VERIFIED
            && campaign.getStatus() != Campaign.VerificationStatus.COMPLETED) {
        User viewer = viewerEmail == null ? null : userRepository.findByEmail(viewerEmail).orElse(null);
        boolean owner = viewer != null && campaign.getRequester().getId().equals(viewer.getId());
        boolean reviewer = viewer != null && (viewer.getRole() == User.Role.ADMIN
                || (viewer.getRole() == User.Role.VERIFIER
                && viewer.getVerifierCategories().contains(campaign.getCategory())));
        if (!owner && !reviewer) throw new IllegalArgumentException("Campaign not found");
    }
    return CampaignResponse.from(campaign);
    }

    public List<CampaignResponse> getPending(String verifierEmail) {
        User verifier = userRepository.findByEmail(verifierEmail)
                .orElseThrow(() -> new IllegalArgumentException("Verifier not found"));
        return campaignRepository.findByStatus(Campaign.VerificationStatus.PENDING)
                .stream().filter(c -> verifier.getRole() == User.Role.ADMIN
                        || verifier.getVerifierCategories().contains(c.getCategory()))
                .map(CampaignResponse::from).toList();
    }

    public CampaignResponse create(CreateCampaignRequest req, String requesterEmail) {
        if (req.goalAmount() != null && (!Double.isFinite(req.goalAmount()) || req.goalAmount() <= 0)) {
            throw new IllegalArgumentException("Goal amount must be positive");
        }
        if ((req.latitude() == null) != (req.longitude() == null)
                || req.latitude() != null && (!Double.isFinite(req.latitude())
                || !Double.isFinite(req.longitude()) || Math.abs(req.latitude()) > 90
                || Math.abs(req.longitude()) > 180)) {
            throw new IllegalArgumentException("Invalid map coordinates");
        }
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Campaign campaign = new Campaign();
        campaign.setTitle(req.title());
        campaign.setDescription(req.description());
        campaign.setCategory(req.category());
        campaign.setLocation(req.location());
        campaign.setLatitude(req.latitude());
        campaign.setLongitude(req.longitude());
        campaign.setGoalAmount(req.goalAmount());
        campaign.setRequester(requester);
        campaign.setStatus(Campaign.VerificationStatus.PENDING);

        return CampaignResponse.from(campaignRepository.save(campaign));
    }

    public CampaignResponse verify(Long campaignId, String verifierEmail, boolean approve) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found"));
        User verifier = userRepository.findByEmail(verifierEmail)
                .orElseThrow(() -> new IllegalArgumentException("Verifier not found"));
        if (campaign.getStatus() != Campaign.VerificationStatus.PENDING) {
            throw new IllegalStateException("Only pending campaigns can be reviewed");
        }
        if (verifier.getRole() != User.Role.ADMIN
                && (verifier.getRole() != User.Role.VERIFIER
                || !verifier.getVerifierCategories().contains(campaign.getCategory()))) {
            throw new SecurityException("Verifier is not qualified for this category");
        }
        if (campaign.getRequester().getId().equals(verifier.getId())) {
            throw new SecurityException("You cannot review your own campaign");
        }

        campaign.setStatus(approve ? Campaign.VerificationStatus.VERIFIED : Campaign.VerificationStatus.REJECTED);
        campaign.setVerifiedBy(verifier);
        campaign.setVerifiedAt(Instant.now());

        return CampaignResponse.from(campaignRepository.save(campaign));
    }

    public List<PendingOutcome> getPendingOutcomes(String verifierEmail) {
        User verifier = userRepository.findByEmail(verifierEmail)
                .orElseThrow(() -> new IllegalArgumentException("Verifier not found"));
        return campaignRepository.findByStatus(Campaign.VerificationStatus.VERIFIED).stream()
                .filter(c -> c.getOutcomeSummary() != null && !c.isOutcomeApproved())
                .filter(c -> verifier.getRole() == User.Role.ADMIN
                        || verifier.getVerifierCategories().contains(c.getCategory()))
                .map(c -> new PendingOutcome(CampaignResponse.from(c),
                        c.getOutcomeSummary(), c.getOutcomeProofUrl())).toList();
    }

    public CampaignResponse submitOutcome(Long id, OutcomeRequest req, String requesterEmail) {
        if (req.proofUrl() != null && !req.proofUrl().startsWith("/api/files/")) {
            throw new IllegalArgumentException("Proof must be an uploaded file");
        }
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found"));
        if (!campaign.getRequester().getEmail().equalsIgnoreCase(requesterEmail)
                || campaign.getStatus() != Campaign.VerificationStatus.VERIFIED) {
            throw new SecurityException("Only the requester can submit an outcome for a verified campaign");
        }
        campaign.setOutcomeSummary(req.summary());
        campaign.setOutcomeProofUrl(req.proofUrl());
        campaign.setOutcomeApproved(false);
        return CampaignResponse.from(campaignRepository.save(campaign));
    }

    public CampaignResponse approveOutcome(Long id, String verifierEmail) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found"));
        User verifier = userRepository.findByEmail(verifierEmail)
                .orElseThrow(() -> new IllegalArgumentException("Verifier not found"));
        if (verifier.getRole() != User.Role.ADMIN
                && (verifier.getRole() != User.Role.VERIFIER
                || !verifier.getVerifierCategories().contains(campaign.getCategory()))) {
            throw new SecurityException("Verifier is not qualified for this category");
        }
        if (campaign.getRequester().getId().equals(verifier.getId())) {
            throw new SecurityException("You cannot review your own campaign");
        }
        if (campaign.getOutcomeSummary() == null || campaign.getStatus() != Campaign.VerificationStatus.VERIFIED) {
            throw new IllegalStateException("No outcome is awaiting review");
        }
        campaign.setOutcomeApproved(true);
        campaign.setStatus(Campaign.VerificationStatus.COMPLETED);
        campaign.setCompletedAt(Instant.now());
        return CampaignResponse.from(campaignRepository.save(campaign));
    }

    public List<CampaignResponse> getMine(String requesterEmail) {
    User requester = userRepository.findByEmail(requesterEmail)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    return campaignRepository.findByRequesterIdOrderByCreatedAtDesc(requester.getId())
            .stream().map(CampaignResponse::from).toList();
}
}
