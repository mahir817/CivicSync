package com.civicsync.backend.repository;

import com.civicsync.backend.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findByCategory(Campaign.Category category);
    List<Campaign> findByStatus(Campaign.VerificationStatus status);
    List<Campaign> findByStatusInOrderByCreatedAtDesc(List<Campaign.VerificationStatus> statuses);
    List<Campaign> findAllByOrderByCreatedAtDesc();
    List<Campaign> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Campaign c where c.id = :id")
    Optional<Campaign> findLockedById(@Param("id") Long id);
}
