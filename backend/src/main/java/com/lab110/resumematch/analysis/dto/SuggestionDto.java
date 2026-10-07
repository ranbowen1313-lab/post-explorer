package com.lab110.resumematch.analysis.dto;

public record SuggestionDto(
        Long id,
        Long requirementId,
        String kind,
        String originalPassage,
        String suggestedPassage,
        String rewriteReason,
        String confirmationQuestion,
        String decision
) {
}
