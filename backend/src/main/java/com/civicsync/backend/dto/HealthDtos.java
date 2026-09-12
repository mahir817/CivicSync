package com.civicsync.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class HealthDtos {

    public record SubmitSymptomRequest(
            @NotBlank String area,
            @NotBlank String symptom
    ) {}

    public record AreaAlert(
            String area,
            long reportCount,
            String level, // "WATCH" or "NORMAL" — rule-based, not ML
            int windowDays
    ) {}
}