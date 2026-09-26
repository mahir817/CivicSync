package com.civicsync.backend.config;

import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class BootstrapAdmin implements CommandLineRunner {
    private final UserRepository users;
    private final PasswordEncoder passwords;

    @Value("${CIVICSYNC_BOOTSTRAP_ADMIN_EMAIL:}") private String email;
    @Value("${CIVICSYNC_BOOTSTRAP_ADMIN_PASSWORD:}") private String password;

    public BootstrapAdmin(UserRepository users, PasswordEncoder passwords) {
        this.users = users; this.passwords = passwords;
    }

    @Override public void run(String... args) {
        if (users.countByRole(User.Role.ADMIN) > 0) return;
        if (email.isBlank() || password.length() < 12) {
            throw new IllegalStateException("Set CIVICSYNC_BOOTSTRAP_ADMIN_EMAIL and a 12+ character CIVICSYNC_BOOTSTRAP_ADMIN_PASSWORD");
        }
        User user = new User();
        user.setEmail(email.trim().toLowerCase());
        user.setFullName("CivicSync Admin");
        user.setPasswordHash(passwords.encode(password));
        user.setRole(User.Role.ADMIN);
        users.save(user);
    }
}
