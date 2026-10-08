package com.lab110.resumematch.analysis.dto;

import java.time.Instant;
import java.util.List;

public record AnalysisResponse(
        Long id,
        String status,
        String errorMessage,
        Instant createdAt,
        Instant completedAt,
        Long resumeId,
        Long jobId,
        String resumeSnapshot,
        String jobSnapshot,
        String draftContent,
        List<RequirementDto> requirements,
        List<SuggestionDto> suggestions
) {
}
