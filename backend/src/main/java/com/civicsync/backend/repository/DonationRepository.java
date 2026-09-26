package com.civicsync.backend.repository;

import com.civicsync.backend.entity.Donation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByCampaignIdOrderByCreatedAtDesc(Long campaignId);
    List<Donation> findByDonorIdOrderByCreatedAtDesc(Long donorId);
    long countByStatus(Donation.Status status);
    List<Donation> findByCampaignRequesterIdAndStatusOrderByCreatedAtDesc(Long requesterId, Donation.Status status);
    List<Donation> findByCampaignRequesterIdAndTypeOrderByCreatedAtDesc(Long requesterId, Donation.Type type);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Donation d where d.id = :id")
    Optional<Donation> findLockedById(@Param("id") Long id);
}
