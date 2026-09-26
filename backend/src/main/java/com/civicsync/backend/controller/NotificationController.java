package com.civicsync.backend.controller;

import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.entity.Notification;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.CampaignRepository;
import com.civicsync.backend.repository.DonationRepository;
import com.civicsync.backend.repository.NotificationRepository;
import com.civicsync.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/me/notifications")
public class NotificationController {
    private final NotificationRepository notifications;
    private final UserRepository users;
    private final DonationRepository donations;
    private final CampaignRepository campaigns;
    private final com.civicsync.backend.service.NotificationService sender;

    public NotificationController(NotificationRepository notifications, UserRepository users,
            DonationRepository donations, CampaignRepository campaigns,
            com.civicsync.backend.service.NotificationService sender) {
        this.notifications = notifications;
        this.users = users;
        this.donations = donations;
        this.campaigns = campaigns;
        this.sender = sender;
    }

    public record NotificationResponse(Long id, String messageKey, Long campaignId, String message,
            boolean read, Instant createdAt) {
        static NotificationResponse from(Notification n) {
            return new NotificationResponse(n.getId(), n.getMessageKey(), n.getCampaignId(), n.getMessage(),
                    n.isReadState(), n.getCreatedAt());
        }
    }

    @GetMapping
    public List<NotificationResponse> list(Authentication auth) {
        User user = users.findByEmail(auth.getName()).orElseThrow();
        if (user.isRemindersEnabled()) generate(user);
        return notifications.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(NotificationResponse::from).toList();
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(@PathVariable Long id, Authentication auth) {
        User user = users.findByEmail(auth.getName()).orElseThrow();
        Notification n = notifications.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        n.setReadState(true);
        return NotificationResponse.from(notifications.save(n));
    }

    private void generate(User user) {
        var history = donations.findByDonorIdOrderByCreatedAtDesc(user.getId());
        if (!history.isEmpty() && history.get(0).getCreatedAt().isBefore(Instant.now().minus(30, ChronoUnit.DAYS))) {
            sender.send(user, "activity-" + YearMonth.now(), "REMINDER_ACTIVITY", null, null);
        }
        campaigns.findByStatus(Campaign.VerificationStatus.VERIFIED).stream()
                .filter(c -> c.getCreatedAt().isAfter(Instant.now().minus(14, ChronoUnit.DAYS)))
                .filter(c -> user.getInterests().contains(c.getCategory())
                        || user.getArea() != null && c.getLocation() != null
                        && c.getLocation().toLowerCase().contains(user.getArea().toLowerCase()))
                .limit(3).forEach(c -> sender.send(user, "campaign-" + c.getId(), "MATCHING_CAMPAIGN", c.getId(), null));
    }
}
