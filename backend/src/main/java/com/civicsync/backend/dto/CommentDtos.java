package com.civicsync.backend.dto;

import com.civicsync.backend.entity.Comment;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class CommentDtos {

    public record CreateCommentRequest(
            @NotBlank String content
    ) {}

    public record CommentResponse(
            Long id,
            String content,
            String authorName,
            Instant createdAt
    ) {
        public static CommentResponse from(Comment c) {
            return new CommentResponse(c.getId(), c.getContent(), c.getAuthor().getFullName(), c.getCreatedAt());
        }
    }
}