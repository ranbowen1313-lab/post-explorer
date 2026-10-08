package com.lab110.resumematch.resume.dto;

import java.time.LocalDateTime;

public record RevisionDto(
        Long id,
        Long resumeId,
        Integer versionNo,
        String content,
        LocalDateTime savedAt
) {
}
