package com.civicsync.backend.controller;

import com.civicsync.backend.dto.CivicReportDtos.*;
import com.civicsync.backend.service.CivicReportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/civic-reports")
public class CivicReportController {

    private final CivicReportService civicReportService;

    public CivicReportController(CivicReportService civicReportService) {
        this.civicReportService = civicReportService;
    }

    // Public - powers the map
    @GetMapping
    public ResponseEntity<?> getActive() {
        return ResponseEntity.ok(civicReportService.getActive());
    }

    // Requires auth - any logged-in user can report
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateCivicReportRequest req, Authentication auth) {
        try {
            return ResponseEntity.ok(civicReportService.create(req, auth.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }

    // Requires auth - "Confirm This" button
    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(civicReportService.confirm(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }

    // Requires auth - marks a clogging report as cleared
    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolve(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(civicReportService.resolve(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        }
    }
}