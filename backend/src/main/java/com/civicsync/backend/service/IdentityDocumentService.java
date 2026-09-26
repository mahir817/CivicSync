package com.civicsync.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class IdentityDocumentService {
    private final Path directory;

    public IdentityDocumentService(@Value("${identity.documents-dir:private-documents}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    public String save(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > 5_000_000) {
            throw new IllegalArgumentException("An identity document up to 5 MB is required");
        }
        try {
            byte[] bytes = file.getBytes();
            String extension;
            if (bytes.length >= 4 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F') extension = ".pdf";
            else if (bytes.length >= 3 && (bytes[0] & 255) == 255 && (bytes[1] & 255) == 216 && (bytes[2] & 255) == 255) extension = ".jpg";
            else if (bytes.length >= 8 && (bytes[0] & 255) == 137 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G') extension = ".png";
            else throw new IllegalArgumentException("Identity document must be a PDF, JPG, or PNG");
            Files.createDirectories(directory);
            String name = UUID.randomUUID() + extension;
            Files.write(directory.resolve(name), bytes, java.nio.file.StandardOpenOption.CREATE_NEW);
            return name;
        } catch (IOException ex) {
            throw new IllegalStateException("Could not store identity document", ex);
        }
    }

    public Resource read(String name) {
        if (name == null || !name.matches("[0-9a-f-]{36}\\.(pdf|jpg|png)")) throw new IllegalArgumentException("Document unavailable");
        try {
            Path path = directory.resolve(name).normalize();
            if (!path.startsWith(directory)) throw new SecurityException("Invalid document path");
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists()) throw new IllegalArgumentException("Document unavailable");
            return resource;
        } catch (java.net.MalformedURLException ex) {
            throw new IllegalArgumentException("Document unavailable", ex);
        }
    }

    public void remove(String name) {
        if (name == null) return;
        try { Files.deleteIfExists(directory.resolve(name)); } catch (IOException ignored) { }
    }
}
