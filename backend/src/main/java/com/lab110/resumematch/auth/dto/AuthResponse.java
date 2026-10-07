package com.lab110.resumematch.auth.dto;

public record AuthResponse(String token, UserResponse user) {
}
