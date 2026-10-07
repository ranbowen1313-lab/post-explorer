package com.lab110.resumematch.analysis.dto;

import java.time.LocalDateTime;
import java.util.List;

public record AnalysisResponse(
        Long id,
        String status,
        String errorMessage,
        LocalDateTime createdAt,
        LocalDateTime completedAt,
        List<RequirementDto> requirements,
        List<SuggestionDto> suggestions
) {
}
