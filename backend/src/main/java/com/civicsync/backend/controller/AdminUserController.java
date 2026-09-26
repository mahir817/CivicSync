package com.civicsync.backend.controller;

import com.civicsync.backend.entity.Campaign;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final UserRepository users;
    public AdminUserController(UserRepository users) { this.users = users; }

    public record UserSummary(Long id, String fullName, String email, User.Role role,
            Set<Campaign.Category> verifierCategories, boolean legacyRoleNeedsReview, String verifierCode) {
        static UserSummary from(User user) {
            return new UserSummary(user.getId(), user.getFullName(), user.getEmail(),
                    user.getRole(), user.getVerifierCategories(), user.isLegacyRoleNeedsReview(), user.getVerifierCode());
        }
    }
    public record UpdateRole(@NotNull User.Role role, Set<Campaign.Category> verifierCategories,
            boolean reviewed) {}

    @GetMapping
    public List<UserSummary> list() {
        return users.findAll().stream().map(UserSummary::from).toList();
    }

    @PatchMapping("/{id}")
    public UserSummary update(@PathVariable Long id, @Valid @RequestBody UpdateRole req) {
        User user = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getRole() == User.Role.ADMIN && req.role() != User.Role.ADMIN
                && users.countByRole(User.Role.ADMIN) <= 1) {
            throw new IllegalStateException("At least one admin must remain");
        }
        user.setRole(req.role());
        if (req.role() == User.Role.VERIFIER && user.getVerifierCode() == null) {
            user.setVerifierCode(java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        }
        user.setVerifierCategories(req.role() == User.Role.VERIFIER
                ? (req.verifierCategories() == null ? Set.of() : req.verifierCategories()) : Set.of());
        if (req.reviewed()) user.setLegacyRoleNeedsReview(false);
        return UserSummary.from(users.save(user));
    }
}
