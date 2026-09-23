package com.civicsync.backend.dto;

public class LikeDtos {

    public record LikeResponse(
            long count,
            boolean liked
    ) {}
}
