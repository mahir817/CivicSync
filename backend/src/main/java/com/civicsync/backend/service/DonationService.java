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
import java.time.Instant;
import org.springframework.transaction.annotation.Transactional;

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
                .stream().filter(d -> d.getStatus() != Donation.Status.PENDING_RECEIPT)
                .map(DonationResponse::from).toList();
    }

    @Transactional
    public DonationResponse create(Long campaignId, CreateDonationRequest req, String donorEmail) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found"));

        if (campaign.getStatus() != Campaign.VerificationStatus.VERIFIED) {
            throw new IllegalStateException("Only verified campaigns can receive donations");
        }

        User donor = userRepository.findByEmail(donorEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (req.type() == Donation.Type.MONETARY && (req.amount() == null
                || !Double.isFinite(req.amount()) || req.amount() <= 0)) {
            throw new IllegalArgumentException("A positive amount is required for monetary donations");
        }

        Donation donation = new Donation();
        donation.setCampaign(campaign);
        donation.setDonor(donor);
        donation.setType(req.type());
        donation.setAmount(req.type() == Donation.Type.MONETARY ? req.amount() : null);
        donation.setMessage(req.message());
        donation.setStatus(req.type() == Donation.Type.MONETARY
                ? Donation.Status.PENDING_RECEIPT : Donation.Status.PLEDGED);

        Donation saved = donationRepository.save(donation);
        return DonationResponse.from(saved);
    }

    @Transactional
    public DonationResponse confirm(Long campaignId, Long donationId, String requesterEmail) {
        Donation donation = donationRepository.findLockedById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("Donation not found"));
        if (!donation.getCampaign().getId().equals(campaignId)) {
            throw new IllegalArgumentException("Donation does not belong to this campaign");
        }
        Campaign campaign = campaignRepository.findLockedById(donation.getCampaign().getId())
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found"));
        if (!campaign.getRequester().getEmail().equalsIgnoreCase(requesterEmail)) {
            throw new SecurityException("Only the campaign requester can confirm receipt");
        }
        if (donation.getStatus() != Donation.Status.PENDING_RECEIPT) {
            throw new IllegalStateException("Donation is not awaiting receipt confirmation");
        }
        if (campaign.getStatus() == Campaign.VerificationStatus.REJECTED) {
            throw new IllegalStateException("Campaign is unavailable");
        }
        User requester = campaign.getRequester();
        donation.setStatus(Donation.Status.CONFIRMED);
        donation.setConfirmedAt(Instant.now());
        donation.setConfirmedBy(requester);
        campaign.setRaisedAmount((campaign.getRaisedAmount() == null ? 0 : campaign.getRaisedAmount())
                + donation.getAmount());
        campaignRepository.save(campaign);
        return DonationResponse.from(donationRepository.save(donation));
    }

    public List<DonationResponse> getPendingForRequester(String email) {
        User requester = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return donationRepository.findByCampaignRequesterIdAndStatusOrderByCreatedAtDesc(
                requester.getId(), Donation.Status.PENDING_RECEIPT)
                .stream().map(DonationResponse::from).toList();
    }

    public List<DonationResponse> getMine(String donorEmail) {
    User donor = userRepository.findByEmail(donorEmail)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    return donationRepository.findByDonorIdOrderByCreatedAtDesc(donor.getId())
            .stream().map(DonationResponse::from).toList();
}
}
