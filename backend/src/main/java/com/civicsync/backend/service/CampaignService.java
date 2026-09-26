package com.civicsync.backend.service;

import com.civicsync.backend.dto.CampaignDtos.*;
import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.CampaignRepository;
import com.civicsync.backend.repository.DonationRepository;
import com.civicsync.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
public class CampaignService {

    public record PendingOutcome(CampaignResponse campaign, String summary, String proofUrl) {}

    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final DonationRepository donationRepository;
    private final NotificationService notifications;

    public CampaignService(CampaignRepository campaignRepository, UserRepository userRepository,
            DonationRepository donationRepository, NotificationService notifications) {
        this.campaignRepository = campaignRepository;
        this.userRepository = userRepository;
        this.donationRepository = donationRepository;
        this.notifications = notifications;
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
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Campaign campaign = new Campaign();
        applyRequest(campaign, req);
        campaign.setRequester(requester);
        campaign.setStatus(Campaign.VerificationStatus.PENDING);

        return CampaignResponse.from(campaignRepository.save(campaign));
    }

    @Transactional
    public CampaignResponse resubmit(Long id, CreateCampaignRequest req, String requesterEmail) {
        Campaign campaign = campaignRepository.findLockedById(id)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found"));
        if (!campaign.getRequester().getEmail().equalsIgnoreCase(requesterEmail)) {
            throw new SecurityException("Only the requester can update this campaign");
        }
        if (campaign.getStatus() != Campaign.VerificationStatus.INFO_REQUESTED
                && campaign.getStatus() != Campaign.VerificationStatus.PENDING) {
            throw new IllegalStateException("This campaign cannot be edited now");
        }
        applyRequest(campaign, req);
        campaign.setStatus(Campaign.VerificationStatus.PENDING);
        campaign.setVerificationNote(null);
        campaign.setInfoRequestedAt(null);
        return CampaignResponse.from(campaignRepository.save(campaign));
    }

    private void applyRequest(Campaign campaign, CreateCampaignRequest req) {
        if (req.goalAmount() != null && (!Double.isFinite(req.goalAmount()) || req.goalAmount() <= 0)) {
            throw new IllegalArgumentException("Goal amount must be positive");
        }
        if ((req.latitude() == null) != (req.longitude() == null)
                || req.latitude() != null && (!Double.isFinite(req.latitude())
                || !Double.isFinite(req.longitude()) || Math.abs(req.latitude()) > 90
                || Math.abs(req.longitude()) > 180)) {
            throw new IllegalArgumentException("Invalid map coordinates");
        }
        if (req.category() == Campaign.Category.BLOOD) {
            if (req.patientName() == null || req.patientName().isBlank()
                    || req.hospital() == null || req.hospital().isBlank()
                    || req.unitsNeeded() == null || req.unitsNeeded() < 1
                    || req.bloodType() == null || !Set.of("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-").contains(req.bloodType())) {
                throw new IllegalArgumentException("Blood requests need a patient, blood type, units, and hospital");
            }
        }
        campaign.setTitle(req.title().trim());
        campaign.setDescription(req.description().trim());
        campaign.setCategory(req.category());
        campaign.setLocation(req.location());
        campaign.setLatitude(req.latitude());
        campaign.setLongitude(req.longitude());
        campaign.setGoalAmount(req.category() == Campaign.Category.BLOOD ? null : req.goalAmount());
        campaign.setPatientName(req.category() == Campaign.Category.BLOOD ? req.patientName().trim() : null);
        campaign.setBloodType(req.category() == Campaign.Category.BLOOD ? req.bloodType() : null);
        campaign.setUnitsNeeded(req.category() == Campaign.Category.BLOOD ? req.unitsNeeded() : null);
        campaign.setHospital(req.category() == Campaign.Category.BLOOD ? req.hospital().trim() : null);
        campaign.setUrgency(req.urgency());
    }

    @Transactional
    public CampaignResponse verify(Long campaignId, String verifierEmail, boolean approve) {
        return review(campaignId, new ReviewRequest(approve ? ReviewAction.APPROVE : ReviewAction.REJECT,
                approve ? null : "Declined by verifier"), verifierEmail);
    }

    @Transactional
    public CampaignResponse review(Long campaignId, ReviewRequest req, String verifierEmail) {
        Campaign campaign = campaignRepository.findLockedById(campaignId)
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
        if (req.action() != ReviewAction.APPROVE && (req.reason() == null || req.reason().isBlank())) {
            throw new IllegalArgumentException("A reason is required to reject or request information");
        }
        if (req.reason() != null && req.reason().length() > 1000) {
            throw new IllegalArgumentException("Review reason is too long");
        }
        campaign.setStatus(switch (req.action()) {
            case APPROVE -> Campaign.VerificationStatus.VERIFIED;
            case REJECT -> Campaign.VerificationStatus.REJECTED;
            case REQUEST_INFO -> Campaign.VerificationStatus.INFO_REQUESTED;
        });
        campaign.setVerificationNote(req.action() == ReviewAction.APPROVE ? null : req.reason().trim());
        campaign.setInfoRequestedAt(req.action() == ReviewAction.REQUEST_INFO ? Instant.now() : null);
        campaign.setVerifiedBy(verifier);
        campaign.setVerifiedAt(Instant.now());
        notifications.send(campaign.getRequester(), "review-" + campaignId + "-" + campaign.getStatus() + "-" + System.nanoTime(),
                switch (req.action()) {
                    case APPROVE -> "CAMPAIGN_APPROVED";
                    case REJECT -> "CAMPAIGN_REJECTED";
                    case REQUEST_INFO -> "INFO_REQUESTED";
                }, campaignId, campaign.getVerificationNote());
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

    @Transactional
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
        donationRepository.findByCampaignIdOrderByCreatedAtDesc(id).stream()
                .map(d -> d.getDonor()).distinct()
                .forEach(donor -> notifications.send(donor, "outcome-" + id,
                        "PROOF_OF_IMPACT", id, null));
        return CampaignResponse.from(campaignRepository.save(campaign));
    }

    public List<CampaignResponse> getMine(String requesterEmail) {
    User requester = userRepository.findByEmail(requesterEmail)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    return campaignRepository.findByRequesterIdOrderByCreatedAtDesc(requester.getId())
            .stream().map(CampaignResponse::from).toList();
}
}
