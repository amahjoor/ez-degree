package com.twentysixprojects.patriotassist.patriotassist_gmu.Accounts.Authentication;

public class AuthModel {
    private String username;
    private String password;

    public AuthModel() {}
    public AuthModel(String username, String password) {
        this.username = username;
        this.password = password;
    }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
