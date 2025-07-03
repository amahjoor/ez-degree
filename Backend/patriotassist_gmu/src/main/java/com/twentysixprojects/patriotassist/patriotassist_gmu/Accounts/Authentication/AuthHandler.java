package com.twentysixprojects.patriotassist.patriotassist_gmu.Accounts.Authentication;


import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.twentysixprojects.patriotassist.patriotassist_gmu.postgresql.models.User;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthHandler {
    private final UserRepository userRepo;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthHandler(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @Transactional(readOnly = true)
    public boolean authenticate(String username, String rawPassword) {
        return userRepo.findByUsername(username)
                       .map(user -> encoder.matches(rawPassword, user.getPassword()))
                       .orElse(false);
    }

    @Transactional
    public void register(String username, String rawPassword) {
        if (userRepo.existsByUsername(username)) {
            throw new IllegalArgumentException("User already exists");
        }
        String hash = encoder.encode(rawPassword);
        userRepo.save(new User(username, hash));
    }
}


interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
}