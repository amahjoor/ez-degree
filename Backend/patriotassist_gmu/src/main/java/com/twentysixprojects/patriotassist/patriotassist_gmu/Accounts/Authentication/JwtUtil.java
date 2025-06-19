package com.twentysixprojects.patriotassist.patriotassist_gmu.Accounts.Authentication;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;

import java.util.Date;

public class JwtUtil
{
    @Value("${jwt.secret}")
    private String Secret;

    @Value("${jwt.expiration}")
    private long ExpirationMs;

    public String generateToken(String username)
    {
    Date now = new Date();
    return Jwts.builder()
        .setSubject(username)
        .setIssuedAt(now)
        .setExpiration(new Date(now.getTime() + ExpirationMs))
        .signWith(SignatureAlgorithm.HS256, Secret)
        .compact();
    }

    public String validateTokenAndGetUsername(String token)
    {
    Claims claims = Jwts.parser()
        .setSigningKey(Secret)
        .parseClaimsJws(token)
        .getBody();
    return claims.getSubject();
    }
}