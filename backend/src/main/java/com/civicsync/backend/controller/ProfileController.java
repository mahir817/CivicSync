package com.civicsync.backend.controller;

import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/me")
public class ProfileController {
    private final UserRepository users;

    public ProfileController(UserRepository users) {
        this.users = users;
    }

    public record ProfileResponse(Long id, String fullName, String email, String role,
            String area, String phone, String language, boolean remindersEnabled,
            Set<Campaign.Category> interests, Set<Campaign.Category> verifierCategories) {
        static ProfileResponse from(User user) {
            return new ProfileResponse(user.getId(), user.getFullName(), user.getEmail(),
                    user.getRole().name(), user.getArea(), user.getPhone(), user.getLanguage(),
                    user.isRemindersEnabled(), user.getInterests(), user.getVerifierCategories());
        }
    }

    public record UpdateProfileRequest(@NotBlank String fullName, String area, String phone,
            String language, boolean remindersEnabled, Set<Campaign.Category> interests) {}

    @GetMapping
    public ProfileResponse get(Authentication auth) {
        return ProfileResponse.from(users.findByEmail(auth.getName()).orElseThrow());
    }

    @PatchMapping
    public ResponseEntity<?> update(@Valid @RequestBody UpdateProfileRequest req, Authentication auth) {
        User user = users.findByEmail(auth.getName()).orElseThrow();
        if (req.language() != null && !Set.of("en", "bn").contains(req.language())) {
            throw new IllegalArgumentException("Language must be en or bn");
        }
        user.setFullName(req.fullName().trim());
        user.setArea(req.area() == null ? null : req.area().trim());
        user.setPhone(req.phone() == null ? null : req.phone().trim());
        user.setLanguage(req.language() == null ? "en" : req.language());
        user.setRemindersEnabled(req.remindersEnabled());
        user.setInterests(req.interests() == null ? Set.of() : req.interests());
        return ResponseEntity.ok(ProfileResponse.from(users.save(user)));
    }
}
