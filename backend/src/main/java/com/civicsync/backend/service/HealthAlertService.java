package com.civicsync.backend.service;

import com.civicsync.backend.dto.HealthDtos.*;
import com.civicsync.backend.entity.SymptomReport;
import com.civicsync.backend.repository.SymptomReportRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class HealthAlertService {

    // Simple, explainable rule — no ML: X or more reports in an area within Y days triggers a WATCH alert.
    private static final int WINDOW_DAYS = 14;
    private static final long WATCH_THRESHOLD = 5;

    private final SymptomReportRepository symptomReportRepository;

    public HealthAlertService(SymptomReportRepository symptomReportRepository) {
        this.symptomReportRepository = symptomReportRepository;
    }

    public void submit(SubmitSymptomRequest req) {
        SymptomReport report = new SymptomReport();
        report.setArea(req.area().trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT));
        report.setSymptom(req.symptom().trim());
        symptomReportRepository.save(report);
    }

    public List<AreaAlert> getAlerts() {
        Instant since = Instant.now().minus(WINDOW_DAYS, ChronoUnit.DAYS);
        List<SymptomReport> recent = symptomReportRepository.findByReportedAtAfter(since);

        Map<String, Long> countsByArea = recent.stream()
                .collect(Collectors.groupingBy(SymptomReport::getArea, Collectors.counting()));

        return countsByArea.entrySet().stream()
                .map(entry -> new AreaAlert(
                        entry.getKey(),
                        entry.getValue(),
                        entry.getValue() >= WATCH_THRESHOLD ? "WATCH" : "NORMAL",
                        WINDOW_DAYS
                ))
                // Only surface areas actually worth showing — no point listing single stray reports
                .filter(alert -> alert.reportCount() >= 2)
                .sorted((a, b) -> Long.compare(b.reportCount(), a.reportCount()))
                .toList();
    }
}
