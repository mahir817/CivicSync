package com.civicsync.backend.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AreaDirectoryTest {
    private final AreaDirectory areas = new AreaDirectory();

    @Test
    void keepsNearbyAlertsLocalAndFallsBackForUnknownAreas() {
        assertEquals(0, areas.distanceKm("Mirpur 10, Dhaka", "Mirpur"));
        assertTrue(areas.matchesAlertArea("Mirpur 10, Dhaka", "Mohammadpur"));
        assertFalse(areas.matchesAlertArea("Mirpur 10, Dhaka", "Sylhet"));
        assertFalse(areas.matchesAlertArea("Mirpur 10, Dhaka", "Unmapped area"));
        assertTrue(areas.matchesAlertArea("Unmapped area", "Sylhet"));
    }
}
