package com.twentysixprojects.patriotassist.patriotassist_gmu.Accounts.Authentication;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AuthHandler {
    
    @Value("${project.accountdata.path}")
    private String AccountDataPath;

    private final ObjectMapper mapper = new ObjectMapper();
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();


    public List<AuthModel> loadUsers() throws IOException {
        if (!Files.exists(Paths.get(AccountDataPath))) return new ArrayList<>();
        return new ArrayList<>(Arrays.asList(
            mapper.readValue(Paths.get(AccountDataPath).toFile(), AuthModel[].class)
        ));
    }

    private void saveUsers(List<AuthModel> users) throws IOException {
        mapper.writerWithDefaultPrettyPrinter().writeValue(Paths.get(AccountDataPath).toFile(), users);
    }

    public void register(String username, String rawPassword) throws IOException {
        List<AuthModel> users = loadUsers();
        if (users.stream().anyMatch(u -> u.getUsername().equals(username))) {
            throw new IllegalArgumentException("User already exists");
        }
        String hash = encoder.encode(rawPassword);
        users.add(new AuthModel(username, hash));
        saveUsers(users);
    }

    public boolean authenticate(String username, String rawPassword) throws IOException {
        return loadUsers().stream()
            .filter(u -> u.getUsername().equals(username))
            .anyMatch(u -> encoder.matches(rawPassword, u.getPassword()));
    }
}
