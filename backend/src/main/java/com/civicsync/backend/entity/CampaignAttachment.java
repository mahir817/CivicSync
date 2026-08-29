package com.civicsync.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "campaign_attachments")
@Getter
@Setter
@NoArgsConstructor
public class CampaignAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private Campaign campaign;

    @Column(nullable = false)
    private String fileName; // original filename, shown to users

    @Column(nullable = false, unique = true)
    private String storedFileName; // UUID-based name actually saved on disk

    @Column(nullable = false)
    private String fileType; // MIME type, e.g. image/png, application/pdf

    @Column(nullable = false)
    private Long fileSizeBytes;

    @Column(nullable = false, updatable = false)
    private Instant uploadedAt = Instant.now();
}