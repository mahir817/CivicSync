package com.civicsync.backend.controller;

import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.entity.CivicReport;
import com.civicsync.backend.entity.Dispute;
import com.civicsync.backend.entity.Donation;
import com.civicsync.backend.repository.CampaignRepository;
import com.civicsync.backend.repository.CivicReportRepository;
import com.civicsync.backend.repository.DisputeRepository;
import com.civicsync.backend.repository.DonationRepository;
import com.civicsync.backend.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {
    private final UserRepository users;
    private final CampaignRepository campaigns;
    private final CivicReportRepository reports;
    private final DonationRepository donations;
    private final DisputeRepository disputes;

    public AdminDashboardController(UserRepository users, CampaignRepository campaigns,
            CivicReportRepository reports, DonationRepository donations, DisputeRepository disputes) {
        this.users = users;
        this.campaigns = campaigns;
        this.reports = reports;
        this.donations = donations;
        this.disputes = disputes;
    }

    public record Dashboard(long users, long pendingCampaigns, long liveCampaigns,
            long activeCivicReports, long pendingReceipts, long openDisputes) {}

    @GetMapping
    public Dashboard get() {
        return new Dashboard(users.count(),
                campaigns.countByStatus(Campaign.VerificationStatus.PENDING),
                campaigns.countByStatus(Campaign.VerificationStatus.VERIFIED),
                reports.countByStatusNot(CivicReport.Status.RESOLVED),
                donations.countByStatus(Donation.Status.PENDING_RECEIPT),
                disputes.countByStatus(Dispute.Status.OPEN));
    }
}
