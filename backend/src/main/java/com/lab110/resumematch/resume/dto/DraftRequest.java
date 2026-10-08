package com.lab110.resumematch.resume.dto;

import jakarta.validation.constraints.NotBlank;

public record DraftRequest(@NotBlank String content) {
}
