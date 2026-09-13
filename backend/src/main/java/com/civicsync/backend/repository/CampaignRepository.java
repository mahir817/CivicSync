package com.civicsync.backend.repository;

import com.civicsync.backend.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findByCategory(Campaign.Category category);
    List<Campaign> findByStatus(Campaign.VerificationStatus status);
    List<Campaign> findAllByOrderByCreatedAtDesc();
    List<Campaign> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);
}
