package com.twentysixprojects.patriotassist.patriotassist_gmu.postgresql.models;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_plans")
public class UserPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String username;

    @Column(name = "plan_json", nullable = false, columnDefinition = "TEXT")
    private String planJson = "{}";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected UserPlan() {}

    public UserPlan(String username, String planJson) {
        this.username = username;
        this.planJson = planJson;
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPlanJson() { return planJson; }
    public void setPlanJson(String planJson) {
        this.planJson = planJson;
        this.updatedAt = Instant.now();
    }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
