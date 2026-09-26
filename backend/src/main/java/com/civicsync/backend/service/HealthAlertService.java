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
                .map(entry -> {
                    double[] point = approximateCenter(entry.getKey());
                    return new AreaAlert(entry.getKey(), entry.getValue(),
                            entry.getValue() >= WATCH_THRESHOLD ? "WATCH" : "NORMAL",
                            WINDOW_DAYS, point == null ? null : point[0], point == null ? null : point[1]);
                })
                // Only surface areas actually worth showing — no point listing single stray reports
                .filter(alert -> alert.reportCount() >= 2)
                .sorted((a, b) -> Long.compare(b.reportCount(), a.reportCount()))
                .toList();
    }

    private double[] approximateCenter(String area) {
        if (area.contains("mirpur")) return new double[]{23.8069, 90.3687};
        if (area.contains("dhanmondi")) return new double[]{23.7461, 90.3742};
        if (area.contains("uttara")) return new double[]{23.8759, 90.3795};
        if (area.contains("gulshan")) return new double[]{23.7925, 90.4078};
        if (area.contains("banani")) return new double[]{23.7937, 90.4066};
        if (area.contains("motijheel")) return new double[]{23.7330, 90.4172};
        if (area.contains("mohammadpur")) return new double[]{23.7674, 90.3588};
        if (area.contains("badda")) return new double[]{23.7809, 90.4250};
        if (area.contains("old dhaka") || area.contains("puran dhaka")) return new double[]{23.7104, 90.4074};
        if (area.contains("sylhet")) return new double[]{24.8949, 91.8687};
        if (area.contains("chattogram") || area.contains("chittagong")) return new double[]{22.3569, 91.7832};
        return null;
    }
}
