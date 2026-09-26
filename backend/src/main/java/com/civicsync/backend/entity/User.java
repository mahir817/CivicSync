package com.civicsync.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    private String area;
    private String phone;
    private LocalDate dateOfBirth;
    private String bloodGroup;
    @Enumerated(EnumType.STRING)
    private IdentityDocumentType identityDocumentType;
    private String identityDocumentFile;
    private boolean donorOptIn = false;
    private boolean emailAlertsEnabled = true;
    private Instant lastBloodDonationAt;
    @Column(unique = true)
    private String verifierCode;
    private String language = "en";
    private boolean remindersEnabled = true;
    private boolean legacyRoleNeedsReview = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_interests", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private Set<Campaign.Category> interests = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "verifier_categories", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private Set<Campaign.Category> verifierCategories = new HashSet<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public enum Role {
        USER, VERIFIER, ADMIN
    }
    public enum IdentityDocumentType { NID, BIRTH_CERTIFICATE }
}
