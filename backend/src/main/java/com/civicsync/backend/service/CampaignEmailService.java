package com.civicsync.backend.service;

import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.repository.CampaignRepository;
import com.civicsync.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Service
public class CampaignEmailService {
    private static final Logger log = LoggerFactory.getLogger(CampaignEmailService.class);
    private final CampaignRepository campaigns;
    private final UserRepository users;
    private final AreaDirectory areas;
    private final ObjectProvider<JavaMailSender> sender;
    private final String from;
    private final String smtpHost;
    private final String publicBaseUrl;

    public CampaignEmailService(CampaignRepository campaigns, UserRepository users, AreaDirectory areas,
            ObjectProvider<JavaMailSender> sender, @Value("${civicsync.mail.from}") String from,
            @Value("${spring.mail.host:}") String smtpHost,
            @Value("${civicsync.public-base-url}") String publicBaseUrl) {
        this.campaigns = campaigns; this.users = users; this.areas = areas;
        this.sender = sender; this.from = from; this.smtpHost = smtpHost;
        this.publicBaseUrl = publicBaseUrl.replaceAll("/+$", "");
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendAfterApproval(CampaignPublishedEvent event) {
        Campaign campaign = campaigns.findById(event.campaignId()).orElse(null);
        if (campaign == null || campaign.getStatus() != Campaign.VerificationStatus.VERIFIED) return;
        if (smtpHost.isBlank() || sender.getIfAvailable() == null) {
            log.info("Campaign {} approved; SMTP is not configured", event.campaignId());
            return;
        }
        users.findByEmailAlertsEnabledTrue().stream()
                .filter(user -> !user.getId().equals(campaign.getRequester().getId()))
                .filter(user -> areas.matchesAlertArea(campaign.getLocation(), user.getArea()))
                .forEach(user -> {
                    try {
                        SimpleMailMessage mail = new SimpleMailMessage();
                        mail.setFrom(from);
                        mail.setTo(user.getEmail());
                        boolean bengali = "bn".equals(user.getLanguage());
                        String title = campaign.getTitle().replaceAll("[\\r\\n]", " ");
                        String link = publicBaseUrl + "/post/" + campaign.getId();
                        mail.setSubject((bengali ? "আপনার এলাকার যাচাইকৃত অনুরোধ: " : "Verified request near you: ") + title);
                        mail.setText(bengali
                                ? "আপনার এলাকার একটি নতুন যাচাইকৃত CivicSync অনুরোধ এসেছে: " + campaign.getLocation()
                                    + "\n\n" + campaign.getTitle() + "\n\nবিস্তারিত: " + link
                                    + "\n\nইমেইল বিজ্ঞপ্তি প্রোফাইল থেকে বন্ধ করতে পারেন।"
                                : "A new verified CivicSync request has been posted near " + campaign.getLocation()
                                    + ".\n\n" + campaign.getTitle() + "\n\nView request: " + link
                                    + "\n\nYou can turn off email alerts in your profile.");
                        sender.getObject().send(mail);
                    } catch (RuntimeException ex) {
                        log.warn("Campaign {} email delivery failed for user {}: {}", event.campaignId(), user.getId(), ex.getMessage());
                    }
                });
    }
}
