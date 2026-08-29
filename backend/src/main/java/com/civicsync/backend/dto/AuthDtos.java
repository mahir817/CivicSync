package com.civicsync.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @Size(min = 6, message = "Password must be at least 6 characters") String password,
            String role // optional: USER, VERIFIER, ADMIN — defaults to USER
    ) {}

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            String token,
            Long userId,
            String fullName,
            String email,
            String role
    ) {}
}
