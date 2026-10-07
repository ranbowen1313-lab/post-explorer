package com.lab110.resumematch.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record ApiKeyRequest(@NotBlank String apiKey) {
}
