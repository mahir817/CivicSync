package com.civicsync.backend.controller;

import com.civicsync.backend.dto.HealthDtos.*;
import com.civicsync.backend.service.HealthAlertService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final HealthAlertService healthAlertService;

    public HealthController(HealthAlertService healthAlertService) {
        this.healthAlertService = healthAlertService;
    }

    // Public, no auth — anonymous by design, so nothing to authenticate
    @PostMapping("/symptom-reports")
    public ResponseEntity<?> submit(@Valid @RequestBody SubmitSymptomRequest req) {
        healthAlertService.submit(req);
        return ResponseEntity.ok().build();
    }

    // Public - powers the Disease Pre-Alert cards/map layer
    @GetMapping("/health-alerts")
    public ResponseEntity<?> getAlerts() {
        return ResponseEntity.ok(healthAlertService.getAlerts());
    }
}