package com.civicsync.backend.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
    );

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024; // 10MB per file

    private Path rootLocation;

    @PostConstruct
    public void init() {
        rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory: " + rootLocation, e);
        }
    }

    public String store(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File too large: " + file.getOriginalFilename() + " (max 10MB per file)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(
                    "Unsupported file type: " + contentType + " (allowed: jpg, png, webp, pdf, doc, docx)");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String extension = "";
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalName.substring(dotIndex);
        }
        if (!extension.matches("\\.[A-Za-z0-9]{1,8}")) {
            throw new IllegalArgumentException("Invalid file extension");
        }
        String storedFileName = UUID.randomUUID() + extension;

        try {
            Path destination = rootLocation.resolve(storedFileName).normalize();
            file.transferTo(destination);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + originalName, e);
        }

        return storedFileName;
    }

    public Resource load(String storedFileName) {
        try {
            Path file = rootLocation.resolve(storedFileName).normalize();
            if (!file.startsWith(rootLocation)) {
                throw new IllegalArgumentException("Invalid file name");
            }
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new IllegalArgumentException("File not found: " + storedFileName);
        } catch (MalformedURLException e) {
            throw new IllegalArgumentException("File not found: " + storedFileName, e);
        }
    }
}
