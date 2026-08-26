package com.twentysixprojects.patriotassist.patriotassist_gmu.postgresql;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.twentysixprojects.patriotassist.patriotassist_gmu.postgresql.models.UserPlan;

public interface UserPlanRepository extends JpaRepository<UserPlan, Long> {
    Optional<UserPlan> findByUsername(String username);
}
