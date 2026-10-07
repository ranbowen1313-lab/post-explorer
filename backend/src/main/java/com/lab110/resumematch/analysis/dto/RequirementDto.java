package com.lab110.resumematch.analysis.dto;

public record RequirementDto(
        Long id,
        Integer seq,
        String jobRequirementQuote,
        String resumeEvidenceQuote,
        String matchStatus,
        String reason
) {
}
