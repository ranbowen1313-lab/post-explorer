package com.lab110.resumematch.job.dto;

import jakarta.validation.constraints.NotBlank;

public record JobRequest(
        @NotBlank String title,
        @NotBlank String description
) {
}
