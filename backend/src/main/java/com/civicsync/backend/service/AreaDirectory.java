package com.civicsync.backend.service;

import org.springframework.stereotype.Component;
import java.util.Locale;
import java.util.Map;

@Component
public class AreaDirectory {
    public record Point(double latitude, double longitude) {}
    private static final Map<String, Point> KNOWN = Map.ofEntries(
            Map.entry("mirpur", new Point(23.8069, 90.3687)),
            Map.entry("dhanmondi", new Point(23.7461, 90.3742)),
            Map.entry("uttara", new Point(23.8759, 90.3795)),
            Map.entry("gulshan", new Point(23.7925, 90.4078)),
            Map.entry("banani", new Point(23.7937, 90.4066)),
            Map.entry("mohammadpur", new Point(23.7639, 90.3586)),
            Map.entry("old dhaka", new Point(23.7104, 90.4074)),
            Map.entry("motijheel", new Point(23.7341, 90.4179)),
            Map.entry("sylhet", new Point(24.8949, 91.8687)),
            Map.entry("chittagong", new Point(22.3569, 91.7832)),
            Map.entry("chattogram", new Point(22.3569, 91.7832)));

    public String canonical(String area) {
        if (area == null) return "";
        String value = area.trim().toLowerCase(Locale.ROOT);
        return KNOWN.keySet().stream().filter(value::contains).findFirst().orElse(value);
    }

    public Double distanceKm(String a, String b) {
        String x = canonical(a), y = canonical(b);
        if (x.isBlank() || y.isBlank()) return null;
        if (x.equals(y)) return 0.0;
        Point p = KNOWN.get(x), q = KNOWN.get(y);
        if (p == null || q == null) return null;
        double dLat = Math.toRadians(q.latitude - p.latitude);
        double dLon = Math.toRadians(q.longitude - p.longitude);
        double h = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(p.latitude)) * Math.cos(Math.toRadians(q.latitude))
                * Math.pow(Math.sin(dLon / 2), 2);
        return 6371 * 2 * Math.asin(Math.sqrt(h));
    }

    public boolean hasCoordinates(String area) { return KNOWN.containsKey(canonical(area)); }

    public boolean matchesAlertArea(String requestArea, String recipientArea) {
        if (!hasCoordinates(requestArea)) return true;
        Double distance = distanceKm(requestArea, recipientArea);
        return distance != null && distance <= 10;
    }
}
