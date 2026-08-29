package com.civicsync.backend.repository;

import com.civicsync.backend.entity.CampaignAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignAttachmentRepository extends JpaRepository<CampaignAttachment, Long> {
    List<CampaignAttachment> findByCampaignIdOrderByUploadedAtAsc(Long campaignId);
}