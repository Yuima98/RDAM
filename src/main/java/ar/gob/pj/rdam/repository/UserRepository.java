package ar.gob.pj.rdam.repository;

import ar.gob.pj.rdam.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbc;

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<User> rowMapper = (rs, rowNum) -> {
        User u = new User();
        u.setId(rs.getLong("id"));
        u.setEmail(rs.getString("email"));
        u.setPasswordHash(rs.getString("password_hash"));
        u.setRole(rs.getString("role"));
        int circId = rs.getInt("circunscripcion_id");
        if (!rs.wasNull()) u.setCircunscripcionId(circId);
        u.setActive(rs.getBoolean("is_active"));
        u.setOtpCode(rs.getString("otp_code"));
        Timestamp otpExp = rs.getTimestamp("otp_expires_at");
        if (otpExp != null) u.setOtpExpiresAt(otpExp.toLocalDateTime());
        u.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        u.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        return u;
    };

    public Optional<User> findByEmail(String email) {
        List<User> results = jdbc.query(
            "SELECT * FROM users WHERE email = ?", rowMapper, email);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Optional<User> findById(Long id) {
        List<User> results = jdbc.query(
            "SELECT * FROM users WHERE id = ?", rowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public boolean existsByEmail(String email) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, email);
        return count != null && count > 0;
    }

    public Long insertCitizen(String email) {
        String sql = "INSERT INTO users (email, role, is_active) VALUES (?, 'citizen', 1)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, email);
            return ps;
        }, keyHolder);
        return keyHolder.getKey().longValue();
    }

    public Long insertInternal(String email, String passwordHash, String role, Integer circunscripcionId) {
        String sql = "INSERT INTO users (email, password_hash, role, circunscripcion_id, is_active) VALUES (?, ?, ?, ?, 1)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, email);
            ps.setString(2, passwordHash);
            ps.setString(3, role);
            if (circunscripcionId != null) ps.setInt(4, circunscripcionId);
            else ps.setNull(4, java.sql.Types.TINYINT);
            return ps;
        }, keyHolder);
        return keyHolder.getKey().longValue();
    }

    public void saveOtp(Long userId, String otpCode, LocalDateTime expiresAt) {
        jdbc.update(
            "UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?",
            otpCode, Timestamp.valueOf(expiresAt), userId);
    }

    public void clearOtp(Long userId) {
        jdbc.update(
            "UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?",
            userId);
    }

    // ── Admin: CRUD usuarios internos ─────────────────────────────────────────

    public List<User> findInternalUsers() {
        return jdbc.query(
            "SELECT * FROM users WHERE role IN ('operator', 'admin') ORDER BY created_at DESC",
            rowMapper);
    }

    public void updateActive(Long userId, boolean active) {
        jdbc.update("UPDATE users SET is_active = ? WHERE id = ?", active ? 1 : 0, userId);
    }

    public void updateCircunscripcion(Long userId, Integer circunscripcionId) {
        if (circunscripcionId != null) {
            jdbc.update("UPDATE users SET circunscripcion_id = ? WHERE id = ?", circunscripcionId, userId);
        } else {
            jdbc.update("UPDATE users SET circunscripcion_id = NULL WHERE id = ?", userId);
        }
    }
}
