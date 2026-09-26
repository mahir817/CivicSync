package com.civicsync.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "disputes")
@Getter @Setter @NoArgsConstructor
public class Dispute {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostType postType;
    @Column(nullable = false)
    private Long postId;
    @Column(nullable = false, length = 1000)
    private String reason;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.OPEN;
    @Enumerated(EnumType.STRING)
    private ModerationAction action;
    @ManyToOne(fetch = FetchType.LAZY)
    private User createdBy;
    @ManyToOne(fetch = FetchType.LAZY)
    private User reviewedBy;
    private Instant createdAt = Instant.now();
    private Instant reviewedAt;

    public enum PostType { CAMPAIGN, CIVIC_REPORT }
    public enum Status { OPEN, RESOLVED, DISMISSED }
    public enum ModerationAction { KEEP, HIDE }
}
