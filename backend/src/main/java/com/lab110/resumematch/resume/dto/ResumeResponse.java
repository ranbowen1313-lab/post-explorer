package com.lab110.resumematch.resume.dto;

import java.time.LocalDateTime;

public record ResumeResponse(
        Long id,
        String title,
        String content,
        String draftContent,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
