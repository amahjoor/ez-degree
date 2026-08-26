package com.twentysixprojects.patriotassist.patriotassist_gmu.Frontend_API;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("ok", true, "service", "java");
    }
}
