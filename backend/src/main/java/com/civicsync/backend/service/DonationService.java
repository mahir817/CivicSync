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
    private final NotificationService notifications;

    public DonationService(DonationRepository donationRepository,
                            CampaignRepository campaignRepository,
                            UserRepository userRepository, NotificationService notifications) {
        this.donationRepository = donationRepository;
        this.campaignRepository = campaignRepository;
        this.userRepository = userRepository;
        this.notifications = notifications;
    }

    public List<DonationResponse> getForCampaign(Long campaignId) {
        return donationRepository.findByCampaignIdOrderByCreatedAtDesc(campaignId)
                .stream().filter(d -> d.getStatus() != Donation.Status.PENDING_RECEIPT)
                .map(DonationResponse::publicFrom).toList();
    }

    @Transactional
    public DonationResponse create(Long campaignId, CreateDonationRequest req, String donorEmail) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found"));

        if (campaign.getStatus() != Campaign.VerificationStatus.VERIFIED) {
            throw new IllegalStateException("Only verified campaigns can receive donations");
        }
        if (campaign.getCategory() == Campaign.Category.BLOOD && req.type() != Donation.Type.PLEDGE) {
            throw new IllegalArgumentException("Blood requests accept pledges only");
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
        if (req.contactPhone() != null && req.contactPhone().length() > 255) {
            throw new IllegalArgumentException("Contact phone is too long");
        }
        donation.setContactPhone(req.type() == Donation.Type.PLEDGE ? req.contactPhone() : null);
        donation.setStatus(req.type() == Donation.Type.MONETARY
                ? Donation.Status.PENDING_RECEIPT : Donation.Status.PLEDGED);

        Donation saved = donationRepository.save(donation);
        if (saved.getType() == Donation.Type.PLEDGE) {
            notifications.send(campaign.getRequester(), "pledge-" + saved.getId(),
                    "NEW_PLEDGE", campaignId, donor.getFullName());
        }
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

    @Transactional
    public DonationResponse confirmBlood(Long campaignId, Long donationId, String requesterEmail) {
        Donation donation = donationRepository.findLockedById(donationId)
                .orElseThrow(() -> new IllegalArgumentException("Pledge not found"));
        if (!donation.getCampaign().getId().equals(campaignId)
                || donation.getCampaign().getCategory() != Campaign.Category.BLOOD
                || donation.getType() != Donation.Type.PLEDGE) {
            throw new IllegalArgumentException("This is not a blood pledge for the campaign");
        }
        if (!donation.getCampaign().getRequester().getEmail().equalsIgnoreCase(requesterEmail)) {
            throw new SecurityException("Only the requester can confirm a blood donation");
        }
        if (donation.getStatus() != Donation.Status.PLEDGED) {
            throw new IllegalStateException("Blood donation was already confirmed");
        }
        Instant now = Instant.now();
        donation.setStatus(Donation.Status.CONFIRMED);
        donation.setConfirmedAt(now);
        donation.setConfirmedBy(donation.getCampaign().getRequester());
        User donor = donation.getDonor();
        donor.setLastBloodDonationAt(now);
        userRepository.save(donor);
        notifications.send(donor, "blood-confirmed-" + donation.getId(), "BLOOD_DONATION_CONFIRMED", campaignId,
                "Donation recorded. Your estimated next date is " + now.plus(112, java.time.temporal.ChronoUnit.DAYS));
        return DonationResponse.from(donationRepository.save(donation));
    }

    public List<DonationResponse> getPledgesForRequester(String email) {
        User requester = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return donationRepository.findByCampaignRequesterIdAndTypeOrderByCreatedAtDesc(
                requester.getId(), Donation.Type.PLEDGE).stream().map(DonationResponse::from).toList();
    }

    public List<DonationResponse> getMine(String donorEmail) {
    User donor = userRepository.findByEmail(donorEmail)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    return donationRepository.findByDonorIdOrderByCreatedAtDesc(donor.getId())
            .stream().map(DonationResponse::from).toList();
}
}
