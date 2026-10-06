package com.lab110.resumematch.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 连通性探测接口，用于验证前后端与后端服务是否正常。
 */
@RestController
public class PingController {

    @GetMapping("/api/ping")
    public Map<String, Object> ping() {
        return Map.of(
                "status", "ok",
                "service", "resume-match",
                "time", System.currentTimeMillis()
        );
    }
}
