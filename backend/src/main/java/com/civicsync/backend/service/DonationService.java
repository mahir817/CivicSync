package com.civicsync.backend.service;

import com.civicsync.backend.dto.DonationDtos.*;
import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.entity.Donation;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.CampaignRepository;
import com.civicsync.backend.repository.DonationRepository;
import com.civicsync.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DonationService {

    private final DonationRepository donationRepository;
    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;

    public DonationService(DonationRepository donationRepository,
                            CampaignRepository campaignRepository,
                            UserRepository userRepository) {
        this.donationRepository = donationRepository;
        this.campaignRepository = campaignRepository;
        this.userRepository = userRepository;
    }

    public List<DonationResponse> getForCampaign(Long campaignId) {
        return donationRepository.findByCampaignIdOrderByCreatedAtDesc(campaignId)
                .stream().map(DonationResponse::from).toList();
    }

    public DonationResponse create(Long campaignId, CreateDonationRequest req, String donorEmail) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found"));

        if (campaign.getStatus() != Campaign.VerificationStatus.VERIFIED
                && campaign.getStatus() != Campaign.VerificationStatus.COMPLETED) {
            throw new IllegalStateException("Only verified campaigns can receive donations");
        }

        User donor = userRepository.findByEmail(donorEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (req.type() == Donation.Type.MONETARY && (req.amount() == null || req.amount() <= 0)) {
            throw new IllegalArgumentException("A positive amount is required for monetary donations");
        }

        Donation donation = new Donation();
        donation.setCampaign(campaign);
        donation.setDonor(donor);
        donation.setType(req.type());
        donation.setAmount(req.type() == Donation.Type.MONETARY ? req.amount() : null);
        donation.setMessage(req.message());

        Donation saved = donationRepository.save(donation);

        // This is what makes the Trust Trail's progress bar real instead of a manually-set number.
        if (req.type() == Donation.Type.MONETARY) {
            double current = campaign.getRaisedAmount() != null ? campaign.getRaisedAmount() : 0.0;
            campaign.setRaisedAmount(current + req.amount());
            campaignRepository.save(campaign);
        }

        return DonationResponse.from(saved);
    }
}