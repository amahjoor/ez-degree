package com.twentysixprojects.patriotassist.patriotassist_gmu.Accounts.Authentication;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DemoUserSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DemoUserSeeder.class);

    private final AuthHandler authHandler;

    @Value("${demo.username:judge}")
    private String demoUsername;

    @Value("${demo.password:MasonPride2026}")
    private String demoPassword;

    public DemoUserSeeder(AuthHandler authHandler) {
        this.authHandler = authHandler;
    }

    @Override
    public void run(String... args) {
        try {
            authHandler.register(demoUsername, demoPassword);
            log.info("Created demo account '{}'", demoUsername);
        } catch (IllegalArgumentException alreadyExists) {
            log.info("Demo account '{}' already exists", demoUsername);
        }
    }
}
