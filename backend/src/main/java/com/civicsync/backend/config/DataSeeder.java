package com.civicsync.backend.config;

import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.CampaignRepository;
import com.civicsync.backend.repository.UserRepository;
import com.civicsync.backend.entity.CivicReport;
import com.civicsync.backend.repository.CivicReportRepository;
import com.civicsync.backend.entity.SymptomReport;
import com.civicsync.backend.repository.SymptomReportRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@Profile("dev")
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CampaignRepository campaignRepository;
    private final CivicReportRepository civicReportRepository;
    private final SymptomReportRepository symptomReportRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository userRepository,
            CampaignRepository campaignRepository,
            CivicReportRepository civicReportRepository,
            SymptomReportRepository symptomReportRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.campaignRepository = campaignRepository;
        this.civicReportRepository = civicReportRepository;
        this.symptomReportRepository = symptomReportRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        // Do not seed again if users already exist in MySQL
        if (userRepository.count() > 0) {
            System.out.println("CivicSync database already contains data. Skipping seed.");
            return;
        }

        System.out.println("Seeding CivicSync database...");

        // =========================================================
        // VERIFIER PARTNERS / ADMIN
        // =========================================================

        User deltaHospital = createUser(
                "Delta Hospital (Verifier)",
                "verifier@deltahospital.bd",
                User.Role.VERIFIER
        );
        deltaHospital.getVerifierCategories().add(Campaign.Category.BLOOD);
        userRepository.save(deltaHospital);

        User pawsShelter = createUser(
                "Paws & Whiskers Shelter (Verifier)",
                "verifier@pawsshelter.bd",
                User.Role.VERIFIER
        );
        pawsShelter.getVerifierCategories().add(Campaign.Category.PET_CARE);
        userRepository.save(pawsShelter);

        User admin = createUser(
                "CivicSync Admin",
                "admin@civicsync.app",
                User.Role.ADMIN
        );

        // =========================================================
        // EVERYDAY USERS
        // =========================================================

        User rafi = createUser(
                "Rafiul Islam",
                "rafi@example.com",
                User.Role.USER
        );

        User nusrat = createUser(
                "Nusrat Jahan",
                "nusrat@example.com",
                User.Role.USER
        );

        User tanvir = createUser(
                "Tanvir Ahmed",
                "tanvir@example.com",
                User.Role.USER
        );

        seedCivicReport(tanvir, 23.8069, 90.3687,
                "Waterlogging at Mirpur 10 Circle. Vehicles are delayed; avoid the main road.",
                CivicReport.Status.UNCONFIRMED, 0);
        for (int i = 0; i < 5; i++) seedSymptom("mirpur 10", "Fever and body pain");
        for (int i = 0; i < 3; i++) seedSymptom("dhanmondi", "Fever");

        User mim = createUser(
                "Mim Akter",
                "mim@example.com",
                User.Role.USER
        );

        // =========================================================
        // VERIFIED CAMPAIGNS
        // =========================================================

        seedCampaign(
                rafi,
                deltaHospital,
                "O+ blood needed urgently — Delta Hospital",
                "Patient undergoing surgery tomorrow morning needs 2 units of O+ blood. Delta Hospital blood bank confirmed the request.",
                Campaign.Category.BLOOD,
                "Dhanmondi, Dhaka",
                null,
                null,
                Campaign.VerificationStatus.VERIFIED,
                6
        );

        seedCampaign(
                nusrat,
                pawsShelter,
                "Injured stray dog needs vet care",
                "Found this dog with a leg injury near Mirpur 10. Paws & Whiskers Shelter has confirmed and is treating her — funds go toward the vet bill.",
                Campaign.Category.PET_CARE,
                "Mirpur 10, Dhaka",
                8000.0,
                5200.0,
                Campaign.VerificationStatus.VERIFIED,
                30
        );

        seedCampaign(
                tanvir,
                admin,
                "Flood relief for Sylhet families",
                "Recent flash flooding has displaced dozens of families in Sylhet. Verified NGO partner is distributing food and clean water.",
                Campaign.Category.DISASTER_RELIEF,
                "Sylhet",
                200000.0,
                143500.0,
                Campaign.VerificationStatus.VERIFIED,
                10
        );

        seedCampaign(
                mim,
                admin,
                "School supplies for underprivileged children",
                "Providing books, bags, and uniforms for 40 children ahead of the new school term. Verified through local community charity.",
                Campaign.Category.CHARITY,
                "Old Dhaka",
                60000.0,
                60000.0,
                Campaign.VerificationStatus.COMPLETED,
                45
        );

        seedCampaign(
                rafi,
                pawsShelter,
                "Stray cat hit by car, needs surgery",
                "Cat found near Gulshan with a fractured leg. Vet estimate attached — surgery scheduled once funded.",
                Campaign.Category.PET_CARE,
                "Gulshan, Dhaka",
                12000.0,
                3000.0,
                Campaign.VerificationStatus.VERIFIED,
                15
        );

        // =========================================================
        // PENDING CAMPAIGNS
        // =========================================================

        seedCampaign(
                nusrat,
                null,
                "A- blood needed for dialysis patient",
                "Regular dialysis patient needs A- blood every 3 weeks. Awaiting hospital verification.",
                Campaign.Category.BLOOD,
                "Uttara, Dhaka",
                null,
                null,
                Campaign.VerificationStatus.PENDING,
                0
        );

        seedCampaign(
                tanvir,
                null,
                "General charity — winter clothing drive",
                "Collecting funds for warm clothing for homeless individuals ahead of winter. Pending NGO review.",
                Campaign.Category.CHARITY,
                "Chittagong",
                30000.0,
                0.0,
                Campaign.VerificationStatus.PENDING,
                0
        );

        System.out.println(
                "CivicSync database seeded successfully: "
                        + userRepository.count()
                        + " users, "
                        + campaignRepository.count()
                        + " campaigns."
        );
    }

    // =============================================================
    // CREATE USER
    // =============================================================

    private User createUser(
            String fullName,
            String email,
            User.Role role) {

        User user = new User();

        user.setFullName(fullName);
        user.setEmail(email);

        // Demo password
        user.setPasswordHash(
                passwordEncoder.encode("password123")
        );

        user.setRole(role);

        return userRepository.save(user);
    }

    // =============================================================
    // CREATE CAMPAIGN
    // =============================================================

    private void seedCampaign(
            User requester,
            User verifier,
            String title,
            String description,
            Campaign.Category category,
            String location,
            Double goal,
            Double raised,
            Campaign.VerificationStatus status,
            int daysAgo) {

        Campaign campaign = new Campaign();

        campaign.setTitle(title);
        campaign.setDescription(description);
        campaign.setCategory(category);
        campaign.setLocation(location);
        String normalized = location.toLowerCase(java.util.Locale.ROOT);
        if (normalized.contains("dhanmondi")) { campaign.setLatitude(23.7461); campaign.setLongitude(90.3742); }
        else if (normalized.contains("mirpur")) { campaign.setLatitude(23.8069); campaign.setLongitude(90.3687); }
        else if (normalized.contains("uttara")) { campaign.setLatitude(23.8759); campaign.setLongitude(90.3795); }
        else if (normalized.contains("gulshan")) { campaign.setLatitude(23.7925); campaign.setLongitude(90.4078); }
        else if (normalized.contains("sylhet")) { campaign.setLatitude(24.8949); campaign.setLongitude(91.8687); }
        else if (normalized.contains("old dhaka")) { campaign.setLatitude(23.7104); campaign.setLongitude(90.4074); }
        campaign.setUrgency(category == Campaign.Category.BLOOD || category == Campaign.Category.DISASTER_RELIEF
                ? Campaign.Urgency.CRITICAL : Campaign.Urgency.SOON);
        if (category == Campaign.Category.BLOOD) {
            campaign.setPatientName(title.startsWith("O+") ? "Amina Rahman" : "Sadia Islam");
            campaign.setBloodType(title.startsWith("O+") ? "O+" : "A-");
            campaign.setUnitsNeeded(2);
            campaign.setHospital(title.contains("Delta") ? "Delta Hospital" : "Uttara Medical College Hospital");
        }

        campaign.setGoalAmount(goal);
        campaign.setRaisedAmount(raised);

        campaign.setRequester(requester);
        campaign.setStatus(status);

        campaign.setCreatedAt(
                Instant.now().minus(daysAgo, ChronoUnit.DAYS)
        );

        if ((status == Campaign.VerificationStatus.VERIFIED || status == Campaign.VerificationStatus.COMPLETED)
                && verifier != null) {

            campaign.setVerifiedBy(verifier);

            campaign.setVerifiedAt(
                    Instant.now().minus(
                            Math.max(daysAgo - 1, 0),
                            ChronoUnit.DAYS
                    )
            );
        }
        if (status == Campaign.VerificationStatus.COMPLETED) {
            campaign.setOutcomeSummary("School supplies were delivered to 40 children in Old Dhaka.");
            campaign.setOutcomeApproved(true);
            campaign.setCompletedAt(Instant.now().minus(Math.max(daysAgo - 2, 0), ChronoUnit.DAYS));
        }

        campaignRepository.save(campaign);
    }

    private void seedCivicReport(User reporter, Double lat, Double lng, String desc, CivicReport.Status status, int confirmations) {
        CivicReport report = new CivicReport();
        report.setReporter(reporter);
        report.setLatitude(lat);
        report.setLongitude(lng);
        report.setDescription(desc);
        report.setStatus(status);
        report.setConfirmationCount(confirmations);
        civicReportRepository.save(report);
    }

    private void seedSymptom(String area, String symptom) {
        SymptomReport report = new SymptomReport();
        report.setArea(area);
        report.setSymptom(symptom);
        symptomReportRepository.save(report);
    }
}
