package com.civicsync.backend.config;

import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.CampaignRepository;
import com.civicsync.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CampaignRepository campaignRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository userRepository,
            CampaignRepository campaignRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.campaignRepository = campaignRepository;
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

        User pawsShelter = createUser(
                "Paws & Whiskers Shelter (Verifier)",
                "verifier@pawsshelter.bd",
                User.Role.VERIFIER
        );

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
                22000.0,
                Campaign.VerificationStatus.VERIFIED,
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

        campaign.setGoalAmount(goal);
        campaign.setRaisedAmount(raised);

        campaign.setRequester(requester);
        campaign.setStatus(status);

        campaign.setCreatedAt(
                Instant.now().minus(daysAgo, ChronoUnit.DAYS)
        );

        if (status == Campaign.VerificationStatus.VERIFIED
                && verifier != null) {

            campaign.setVerifiedBy(verifier);

            campaign.setVerifiedAt(
                    Instant.now().minus(
                            Math.max(daysAgo - 1, 0),
                            ChronoUnit.DAYS
                    )
            );
        }

        campaignRepository.save(campaign);
    }
}
