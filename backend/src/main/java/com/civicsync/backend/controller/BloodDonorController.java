package com.civicsync.backend.controller;

import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.UserRepository;
import com.civicsync.backend.service.AreaDirectory;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/blood-donors")
public class BloodDonorController {
    private final UserRepository users;
    private final AreaDirectory areas;
    public BloodDonorController(UserRepository users, AreaDirectory areas) { this.users = users; this.areas = areas; }

    public record DonorResult(Long id, String fullName, String area, String bloodGroup,
                              String phone, Double distanceKm, Instant nextEligibleAt) {}

    @GetMapping
    public List<DonorResult> find(@RequestParam String bloodGroup, @RequestParam(required = false) String area,
                                  Authentication auth) {
        if (!Set.of("A+","A-","B+","B-","AB+","AB-","O+","O-").contains(bloodGroup)) {
            throw new IllegalArgumentException("Invalid blood group");
        }
        User requester = users.findByEmail(auth.getName()).orElseThrow();
        String origin = area == null || area.isBlank() ? requester.getArea() : area;
        return users.findByDonorOptInTrueAndBloodGroup(bloodGroup).stream()
                .filter(user -> !user.getId().equals(requester.getId()))
                .map(user -> new DonorResult(user.getId(), user.getFullName(), user.getArea(),
                        user.getBloodGroup(), user.getLastBloodDonationAt() != null
                                && user.getLastBloodDonationAt().plus(112, ChronoUnit.DAYS).isAfter(Instant.now())
                                ? null : user.getPhone(), areas.distanceKm(origin, user.getArea()),
                        user.getLastBloodDonationAt() == null ? null
                                : user.getLastBloodDonationAt().plus(112, ChronoUnit.DAYS)))
                .sorted(Comparator.comparing((DonorResult donor) -> donor.distanceKm() == null
                        ? Double.POSITIVE_INFINITY : donor.distanceKm())
                        .thenComparing(DonorResult::fullName))
                .toList();
    }
}
