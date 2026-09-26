package com.civicsync.backend.controller;

import com.civicsync.backend.dto.CampaignDtos.CampaignResponse;
import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.CampaignRepository;
import com.civicsync.backend.repository.DonationRepository;
import com.civicsync.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/me/recommendations")
public class RecommendationController {
    private final UserRepository users;
    private final CampaignRepository campaigns;
    private final DonationRepository donations;

    public RecommendationController(UserRepository users, CampaignRepository campaigns,
            DonationRepository donations) {
        this.users = users;
        this.campaigns = campaigns;
        this.donations = donations;
    }

    public record Recommendation(CampaignResponse campaign, String reason) {}

    @GetMapping
    public List<Recommendation> get(Authentication auth) {
        User user = users.findByEmail(auth.getName()).orElseThrow();
        Set<Campaign.Category> supported = donations.findByDonorIdOrderByCreatedAtDesc(user.getId())
                .stream().map(d -> d.getCampaign().getCategory()).collect(Collectors.toSet());
        return campaigns.findByStatus(Campaign.VerificationStatus.VERIFIED).stream()
                .filter(c -> !c.getRequester().getId().equals(user.getId()))
                .sorted(Comparator.<Campaign>comparingInt(c -> score(c, user, supported)).reversed()
                        .thenComparing(Campaign::getCreatedAt, Comparator.reverseOrder()))
                .limit(6)
                .map(c -> new Recommendation(CampaignResponse.from(c), reason(c, user, supported)))
                .toList();
    }

    private int score(Campaign c, User user, Set<Campaign.Category> supported) {
        int score = 0;
        if (user.getInterests().contains(c.getCategory())) score += 3;
        if (supported.contains(c.getCategory())) score += 2;
        if (user.getArea() != null && c.getLocation() != null
                && c.getLocation().toLowerCase().contains(user.getArea().toLowerCase())) score += 2;
        return score;
    }

    private String reason(Campaign c, User user, Set<Campaign.Category> supported) {
        if (user.getArea() != null && c.getLocation() != null
                && c.getLocation().toLowerCase().contains(user.getArea().toLowerCase())) return "NEAR_YOU";
        if (user.getInterests().contains(c.getCategory()) || supported.contains(c.getCategory())) return "YOUR_INTEREST";
        return "RECENT_VERIFIED";
    }
}
