package com.lab110.resumematch.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class DeepSeekClient {

    private final RestClient restClient;
    private final String model;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DeepSeekClient(
            @Value("${app.llm.base-url:https://api.deepseek.com}") String baseUrl,
            @Value("${app.llm.model:deepseek-chat}") String model) {
        this.model = model;
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public String chat(String apiKey, String system, String user) {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", system),
                        Map.of("role", "user", "content", user)
                ),
                "response_format", Map.of("type", "json_object"),
                "temperature", 0.2
        );
        String response = restClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);
        return extractContent(response);
    }

    private String extractContent(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            return root.path("choices").path(0).path("message").path("content").asText();
        } catch (Exception e) {
            throw new RuntimeException("模型响应解析失败", e);
        }
    }
}
