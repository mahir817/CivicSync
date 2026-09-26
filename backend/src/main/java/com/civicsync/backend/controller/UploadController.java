package com.civicsync.backend.controller;

import com.civicsync.backend.service.FileStorageService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {
    private final FileStorageService storage;
    public UploadController(FileStorageService storage) { this.storage = storage; }

    @PostMapping
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) {
        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("Only images are accepted here");
        }
        return Map.of("url", "/api/files/" + storage.store(file));
    }
}
