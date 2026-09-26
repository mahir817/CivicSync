package com.civicsync.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

// Deliberately has NO link to User — anonymous by design, per the product spec.
@Entity
@Table(name = "symptom_reports")
@Getter
@Setter
@NoArgsConstructor
public class SymptomReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String area; // free-text area/neighborhood name, e.g. "Mirpur 10"

    @Column(nullable = false)
    private String symptom; // free-text, e.g. "fever", "possible dengue symptoms"

    @Column(nullable = false, updatable = false)
    private Instant reportedAt = Instant.now();
}