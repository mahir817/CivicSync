package com.civicsync.backend.service;

import com.civicsync.backend.dto.AttachmentDtos.AttachmentResponse;
import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.entity.CampaignAttachment;
import com.civicsync.backend.repository.CampaignAttachmentRepository;
import com.civicsync.backend.repository.CampaignRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

@Service
public class AttachmentService {

    private final CampaignRepository campaignRepository;
    private final CampaignAttachmentRepository attachmentRepository;
    private final FileStorageService fileStorageService;

    public AttachmentService(CampaignRepository campaignRepository,
                              CampaignAttachmentRepository attachmentRepository,
                              FileStorageService fileStorageService) {
        this.campaignRepository = campaignRepository;
        this.attachmentRepository = attachmentRepository;
        this.fileStorageService = fileStorageService;
    }

    public List<AttachmentResponse> getForCampaign(Long campaignId) {
        return attachmentRepository.findByCampaignIdOrderByUploadedAtAsc(campaignId)
                .stream().map(AttachmentResponse::from).toList();
    }

    public List<AttachmentResponse> upload(Long campaignId, MultipartFile[] files, String requesterEmail) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found"));

        boolean isOwner = campaign.getRequester() != null
                && campaign.getRequester().getEmail().equalsIgnoreCase(requesterEmail);
        if (!isOwner) {
            throw new SecurityException("Only the campaign's requester can attach files to it");
        }

        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("No files provided");
        }
        if (files.length > 5) {
            throw new IllegalArgumentException("Maximum 5 files per upload");
        }

        return Arrays.stream(files).map(file -> {
            String storedFileName = fileStorageService.store(file);

            CampaignAttachment attachment = new CampaignAttachment();
            attachment.setCampaign(campaign);
            attachment.setFileName(file.getOriginalFilename());
            attachment.setStoredFileName(storedFileName);
            attachment.setFileType(file.getContentType());
            attachment.setFileSizeBytes(file.getSize());

            return AttachmentResponse.from(attachmentRepository.save(attachment));
        }).toList();
    }
}