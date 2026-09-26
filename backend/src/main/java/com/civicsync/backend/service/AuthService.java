package com.civicsync.backend.service;

import com.civicsync.backend.dto.AuthDtos.*;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.UserRepository;
import com.civicsync.backend.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final IdentityDocumentService documents;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
                       IdentityDocumentService documents) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.documents = documents;
    }

    public AuthResponse register(RegisterRequest req, MultipartFile identityDocument) {
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = new User();
        user.setFullName(req.fullName());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        if (req.donorOptIn() && req.dateOfBirth().isAfter(java.time.LocalDate.now().minusYears(18))) {
            throw new IllegalArgumentException("Donor listings require age 18 or older");
        }
        if (req.donorOptIn() && (req.bloodGroup() == null
                || !java.util.Set.of("A+","A-","B+","B-","AB+","AB-","O+","O-").contains(req.bloodGroup()))) {
            throw new IllegalArgumentException("A valid blood group is required for donor listings");
        }
        user.setPhone(req.phone().trim());
        user.setArea(req.area().trim());
        user.setDateOfBirth(req.dateOfBirth());
        user.setBloodGroup(req.bloodGroup());
        user.setIdentityDocumentType(req.identityDocumentType());
        user.setDonorOptIn(req.donorOptIn());
        user.setEmailAlertsEnabled(req.emailAlertsEnabled());

        // Public registration never grants elevated roles, regardless of the submitted payload.
        user.setRole(User.Role.USER);

        String documentName = documents.save(identityDocument);
        user.setIdentityDocumentFile(documentName);
        try { userRepository.save(user); }
        catch (RuntimeException ex) { documents.remove(documentName); throw ex; }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail(), user.getRole().name(), user.getLanguage());
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getFullName(), user.getEmail(), user.getRole().name(), user.getLanguage());
    }
}
