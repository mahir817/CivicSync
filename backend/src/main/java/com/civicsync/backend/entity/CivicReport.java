package com.civicsync.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "civic_reports")
@Getter
@Setter
@NoArgsConstructor
public class CivicReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false, length = 1000)
    private String description;

    private String photoUrl; // optional — can point to /api/files/{name} if a photo was uploaded

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.UNCONFIRMED;

    @Column(nullable = false)
    private Integer confirmationCount = 0;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public enum Status {
        UNCONFIRMED, CONFIRMED, RESOLVED
    }
}