package com.civicsync.backend.dto;

import com.civicsync.backend.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class AuthDtos {
    public record RegisterRequest(
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @NotBlank @Size(min = 6) String password,
            @NotBlank String phone,
            @NotBlank String area,
            @NotNull User.IdentityDocumentType identityDocumentType,
            String bloodGroup,
            @NotNull @Past LocalDate dateOfBirth,
            boolean donorOptIn,
            boolean emailAlertsEnabled
    ) {}
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
    public record AuthResponse(String token, Long userId, String fullName, String email,
                               String role, String language) {}
}
