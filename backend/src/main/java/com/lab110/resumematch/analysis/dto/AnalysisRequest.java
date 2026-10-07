package com.lab110.resumematch.analysis.dto;

import jakarta.validation.constraints.NotNull;

public record AnalysisRequest(@NotNull Long jobId) {
}
