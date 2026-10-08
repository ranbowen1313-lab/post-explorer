package com.lab110.resumematch.auth;

import com.lab110.resumematch.auth.dto.ApiKeyRequest;
import com.lab110.resumematch.auth.dto.AuthResponse;
import com.lab110.resumematch.auth.dto.LoginRequest;
import com.lab110.resumematch.auth.dto.RegisterRequest;
import com.lab110.resumematch.auth.dto.UserResponse;
import com.lab110.resumematch.common.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(201).body(authService.register(req));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/me")
    public UserResponse me() {
        return authService.me(SecurityUtils.currentUserId());
    }

    @PutMapping("/api-key")
    public ResponseEntity<Void> setApiKey(@Valid @RequestBody ApiKeyRequest req) {
        authService.setApiKey(SecurityUtils.currentUserId(), req.apiKey());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api-key")
    public Map<String, Boolean> apiKeyStatus() {
        return Map.of("configured", authService.hasApiKey(SecurityUtils.currentUserId()));
    }

    @PostMapping("/api-key/test")
    public Map<String, Object> testApiKey(@Valid @RequestBody ApiKeyRequest req) {
        return authService.testApiKey(req.apiKey());
    }
}
