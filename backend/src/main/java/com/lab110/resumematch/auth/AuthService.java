package com.lab110.resumematch.auth;

import com.lab110.resumematch.auth.dto.AuthResponse;
import com.lab110.resumematch.auth.dto.LoginRequest;
import com.lab110.resumematch.auth.dto.RegisterRequest;
import com.lab110.resumematch.auth.dto.UserResponse;
import com.lab110.resumematch.common.ApiException;
import com.lab110.resumematch.llm.DeepSeekClient;
import com.lab110.resumematch.user.User;
import com.lab110.resumematch.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final DeepSeekClient deepSeekClient;

    // API Key 仅存内存（会话级），不落库、不落容器持久化；服务重启或用户重新登录后需重新配置
    private final Map<Long, String> apiKeyCache = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                       DeepSeekClient deepSeekClient) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.deepSeekClient = deepSeekClient;
    }

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ApiException(409, "该邮箱已注册");
        }
        User user = new User();
        user.setEmail(req.email());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setName(req.name());
        userRepository.save(user);
        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail()), toDto(user));
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new ApiException(401, "邮箱或密码错误"));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ApiException(401, "邮箱或密码错误");
        }
        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail()), toDto(user));
    }

    public UserResponse me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "用户不存在"));
        return toDto(user);
    }

    public void setApiKey(Long userId, String apiKey) {
        apiKeyCache.put(userId, apiKey);
    }

    public boolean hasApiKey(Long userId) {
        String k = apiKeyCache.get(userId);
        return k != null && !k.isBlank();
    }

    public String getApiKey(Long userId) {
        String k = apiKeyCache.get(userId);
        return (k == null || k.isBlank()) ? null : k;
    }

    public Map<String, Object> testApiKey(String apiKey) {
        try {
            deepSeekClient.chat(apiKey, "你是连接测试助手。", "请回复 ok", false);
            return Map.of("ok", true);
        } catch (Exception e) {
            return Map.of("ok", false, "error", classifyKeyError(e));
        }
    }

    private String classifyKeyError(Exception e) {
        if (e instanceof HttpClientErrorException hce) {
            int code = hce.getStatusCode().value();
            if (code == 401 || code == 403) {
                return "密钥无效或无权限";
            }
            return "服务返回错误（HTTP " + code + "）";
        }
        if (e instanceof ResourceAccessException) {
            return "网络不可用或连接超时";
        }
        return "连接失败";
    }

    private UserResponse toDto(User u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getName());
    }
}
