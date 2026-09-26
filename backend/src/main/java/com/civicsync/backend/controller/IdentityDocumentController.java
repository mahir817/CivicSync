package com.civicsync.backend.controller;

import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.UserRepository;
import com.civicsync.backend.service.IdentityDocumentService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/identity-documents")
public class IdentityDocumentController {
    private final UserRepository users;
    private final IdentityDocumentService documents;
    public IdentityDocumentController(UserRepository users, IdentityDocumentService documents) {
        this.users = users; this.documents = documents;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Resource> view(@PathVariable Long userId, Authentication auth) {
        User viewer = users.findByEmail(auth.getName()).orElseThrow();
        if (!viewer.getId().equals(userId) && viewer.getRole() != User.Role.ADMIN) {
            throw new SecurityException("Document access denied");
        }
        User owner = users.findById(userId).orElseThrow();
        String name = owner.getIdentityDocumentFile();
        Resource document = documents.read(name);
        MediaType type = name.endsWith(".pdf") ? MediaType.APPLICATION_PDF
                : name.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok().contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=identity-document" + name.substring(name.lastIndexOf('.')))
                .body(document);
    }
}
