package com.civicsync.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "post_likes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"post_type", "post_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class PostLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", nullable = false)
    private PostType postType;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public enum PostType {
        CAMPAIGN, CIVIC_REPORT
    }
}
