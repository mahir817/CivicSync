package com.civicsync.backend.controller;

import com.civicsync.backend.service.DonationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/donations")
public class MyDonationsController {

    private final DonationService donationService;

    public MyDonationsController(DonationService donationService) {
        this.donationService = donationService;
    }

    // Requires auth - powers "My Donations" tab on Profile
    @GetMapping("/mine")
    public ResponseEntity<?> getMine(Authentication auth) {
        return ResponseEntity.ok(donationService.getMine(auth.getName()));
    }
}