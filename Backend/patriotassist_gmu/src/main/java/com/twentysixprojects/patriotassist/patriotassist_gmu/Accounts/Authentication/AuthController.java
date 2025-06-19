package com.twentysixprojects.patriotassist.patriotassist_gmu.Accounts.Authentication;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthHandler userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        try {
            userService.register(body.get("username"), body.get("password"));
            return ResponseEntity.ok(Map.of("message", "User registered"));
        } catch (IllegalArgumentException | IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            boolean auth = userService.authenticate(body.get("username"), body.get("password"));
            if (!auth) return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));

            String token = jwtUtil.generateToken(body.get("username"));
            return ResponseEntity.ok(Map.of("token", token));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Server error"));
        }
    }
}

