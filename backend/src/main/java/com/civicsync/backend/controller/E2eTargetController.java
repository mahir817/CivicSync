package com.civicsync.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

/** Allows the browser suite to verify its disposable database before it writes data. */
@RestController
@Profile("dev")
public class E2eTargetController {
    private final DataSource dataSource;
    private final String marker;

    public E2eTargetController(DataSource dataSource,
            @Value("${CIVICSYNC_E2E_MARKER:}") String marker) {
        this.dataSource = dataSource;
        this.marker = marker;
    }

    @GetMapping("/api/dev/e2e-target")
    public ResponseEntity<Map<String, String>> target() throws SQLException {
        if (marker.isBlank()) return ResponseEntity.notFound().build();
        try (Connection connection = dataSource.getConnection()) {
            return ResponseEntity.ok(Map.of("database", connection.getCatalog(), "marker", marker));
        }
    }
}
