package com.civicsync.backend.dto;

import com.civicsync.backend.entity.CampaignAttachment;

import java.time.Instant;

public class AttachmentDtos {

    public record AttachmentResponse(
            Long id,
            String fileName,
            String fileType,
            Long fileSizeBytes,
            String url,
            Instant uploadedAt
    ) {
        public static AttachmentResponse from(CampaignAttachment a) {
            return new AttachmentResponse(
                    a.getId(),
                    a.getFileName(),
                    a.getFileType(),
                    a.getFileSizeBytes(),
                    "/api/files/" + a.getStoredFileName(), // frontend uses this directly as <img src> or download link
                    a.getUploadedAt()
            );
        }
    }
}