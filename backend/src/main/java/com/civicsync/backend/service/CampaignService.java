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

    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;

    public CampaignService(CampaignRepository campaignRepository, UserRepository userRepository) {
        this.campaignRepository = campaignRepository;
        this.userRepository = userRepository;
    }

    public List<CampaignResponse> getAll() {
        return campaignRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(CampaignResponse::from).toList();
    }

    public List<CampaignResponse> getByCategory(Campaign.Category category) {
        return campaignRepository.findByCategory(category)
                .stream().map(CampaignResponse::from).toList();
    }

    public CampaignResponse getById(Long id) {
    Campaign campaign = campaignRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Campaign not found"));
    return CampaignResponse.from(campaign);
    }

    public List<CampaignResponse> getPending() {
        return campaignRepository.findByStatus(Campaign.VerificationStatus.PENDING)
                .stream().map(CampaignResponse::from).toList();
    }

    public CampaignResponse create(CreateCampaignRequest req, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Campaign campaign = new Campaign();
        campaign.setTitle(req.title());
        campaign.setDescription(req.description());
        campaign.setCategory(req.category());
        campaign.setLocation(req.location());
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

        campaign.setStatus(approve ? Campaign.VerificationStatus.VERIFIED : Campaign.VerificationStatus.REJECTED);
        campaign.setVerifiedBy(verifier);
        campaign.setVerifiedAt(Instant.now());

        return CampaignResponse.from(campaignRepository.save(campaign));
    }

    public List<CampaignResponse> getMine(String requesterEmail) {
    User requester = userRepository.findByEmail(requesterEmail)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    return campaignRepository.findByRequesterIdOrderByCreatedAtDesc(requester.getId())
            .stream().map(CampaignResponse::from).toList();
}
}
