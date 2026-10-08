package com.lab110.resumematch.resume.dto;

import jakarta.validation.constraints.NotBlank;

public record FormatRequest(@NotBlank String raw) {
}
