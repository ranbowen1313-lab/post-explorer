package com.lab110.resumematch.job.dto;

import java.time.LocalDateTime;

public record JobResponse(
        Long id,
        String title,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
