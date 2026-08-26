package com.twentysixprojects.patriotassist.patriotassist_gmu.Frontend_API;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.twentysixprojects.patriotassist.patriotassist_gmu.postgresql.UserPlanRepository;
import com.twentysixprojects.patriotassist.patriotassist_gmu.postgresql.models.UserPlan;

@RestController
@RequestMapping("/api/me")
public class UserPlanController {

    private final UserPlanRepository plans;
    private final ObjectMapper mapper = new ObjectMapper();

    public UserPlanController(UserPlanRepository plans) {
        this.plans = plans;
    }

    @GetMapping("/plan")
    public ResponseEntity<JsonNode> getPlan(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            ObjectNode error = mapper.createObjectNode();
            error.put("error", "Login required");
            return ResponseEntity.status(401).body(error);
        }
        Optional<UserPlan> existing = plans.findByUsername(auth.getName());
        if (existing.isEmpty()) {
            return ResponseEntity.ok(mapper.createObjectNode());
        }
        try {
            return ResponseEntity.ok(mapper.readTree(existing.get().getPlanJson()));
        } catch (Exception e) {
            return ResponseEntity.ok(mapper.createObjectNode());
        }
    }

    @PutMapping("/plan")
    public ResponseEntity<?> savePlan(Authentication auth, @RequestBody JsonNode body) {
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Login required"));
        }
        try {
            String username = auth.getName();
            String json = mapper.writeValueAsString(body);
            UserPlan plan = plans.findByUsername(username)
                    .orElseGet(() -> new UserPlan(username, json));
            plan.setPlanJson(json);
            plans.save(plan);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Could not save plan"));
        }
    }
}
