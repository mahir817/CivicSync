package com.civicsync.backend.repository;

import com.civicsync.backend.entity.Donation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByCampaignIdOrderByCreatedAtDesc(Long campaignId);
    List<Donation> findByDonorIdOrderByCreatedAtDesc(Long donorId);
}