package ar.gob.pj.rdam.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationCitizenMs;
    private final long expirationOperatorMs;

    public JwtService(
        @Value("${rdam.jwt.secret}") String secret,
        @Value("${rdam.jwt.expiration-citizen-ms}") long expirationCitizenMs,
        @Value("${rdam.jwt.expiration-operator-ms}") long expirationOperatorMs
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationCitizenMs = expirationCitizenMs;
        this.expirationOperatorMs = expirationOperatorMs;
    }

    public String generateToken(Long userId, String email, String role, Integer circunscripcionId) {
        long expMs = "citizen".equals(role) ? expirationCitizenMs : expirationOperatorMs;
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expMs);
        var builder = Jwts.builder()
            .subject(userId.toString())
            .claim("email", email)
            .claim("role", role)
            .issuedAt(now)
            .expiration(expiry);
        if (circunscripcionId != null) {
            builder.claim("circunscripcionId", circunscripcionId);
        }
        return builder.signWith(key).compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser().verifyWith(key).build()
            .parseSignedClaims(token).getPayload();
    }

    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Long getUserId(String token) {
        return Long.parseLong(parseToken(token).getSubject());
    }

    public String getRole(String token) {
        return parseToken(token).get("role", String.class);
    }

    public Integer getCircunscripcionId(String token) {
        return parseToken(token).get("circunscripcionId", Integer.class);
    }

    public LocalDateTime getExpiration(String token) {
        Date exp = parseToken(token).getExpiration();
        return exp.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
    }
}
