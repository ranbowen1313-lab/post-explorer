package com.lab110.resumematch.resume.dto;

import jakarta.validation.constraints.NotBlank;

public record ResumeRequest(
        @NotBlank String title,
        @NotBlank String content
) {
}
