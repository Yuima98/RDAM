// SolicitudRepository.java
package ar.gob.pj.rdam.repository;

import ar.gob.pj.rdam.model.Solicitud;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class SolicitudRepository {

    private final JdbcTemplate jdbc;

    public SolicitudRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Solicitud> rowMapper = (rs, rowNum) -> {
        Solicitud s = new Solicitud();
        s.setId(rs.getLong("id"));
        s.setCiudadanoId(rs.getLong("ciudadano_id"));
        s.setCircunscripcionId(rs.getInt("circunscripcion_id"));
        s.setCuilConsultado(rs.getString("cuil_consultado"));
        s.setEmailContacto(rs.getString("email_contacto"));
        s.setEstado(rs.getString("estado"));
        s.setPaymentExternalId(rs.getString("payment_external_id"));
        Timestamp pca = rs.getTimestamp("payment_confirmed_at");
        if (pca != null) s.setPaymentConfirmedAt(pca.toLocalDateTime());
        s.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        s.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        try { s.setCircunscripcionNombre(rs.getString("circunscripcion_nombre")); }
        catch (Exception ignored) {}
        return s;
    };

    public Long insert(Solicitud s) {
        String sql = "INSERT INTO solicitudes (ciudadano_id, circunscripcion_id, cuil_consultado, email_contacto, estado) VALUES (?, ?, ?, ?, 'pendiente_pago')";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, s.getCiudadanoId());
            ps.setInt(2, s.getCircunscripcionId());
            ps.setString(3, s.getCuilConsultado());
            ps.setString(4, s.getEmailContacto());
            return ps;
        }, keyHolder);
        return keyHolder.getKey().longValue();
    }

    public Optional<Solicitud> findById(Long id) {
        String sql = "SELECT s.*, c.nombre AS circunscripcion_nombre FROM solicitudes s JOIN circunscripciones c ON c.id = s.circunscripcion_id WHERE s.id = ?";
        List<Solicitud> results = jdbc.query(sql, rowMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<Solicitud> findByCiudadano(Long ciudadanoId, String estado, int offset, int size) {
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("SELECT s.*, c.nombre AS circunscripcion_nombre FROM solicitudes s JOIN circunscripciones c ON c.id = s.circunscripcion_id WHERE s.ciudadano_id = ?");
        params.add(ciudadanoId);
        if (estado != null && !estado.isBlank()) { sql.append(" AND s.estado = ?"); params.add(estado); }
        sql.append(" ORDER BY s.created_at DESC LIMIT ? OFFSET ?");
        params.add(size); params.add(offset);
        return jdbc.query(sql.toString(), rowMapper, params.toArray());
    }

    public long countByCiudadano(Long ciudadanoId, String estado) {
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM solicitudes WHERE ciudadano_id = ?");
        params.add(ciudadanoId);
        if (estado != null && !estado.isBlank()) { sql.append(" AND estado = ?"); params.add(estado); }
        Long count = jdbc.queryForObject(sql.toString(), Long.class, params.toArray());
        return count != null ? count : 0L;
    }

    public List<Solicitud> findAll(String estado, Integer circunscripcionId, String cuil, int offset, int size) {
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("SELECT s.*, c.nombre AS circunscripcion_nombre FROM solicitudes s JOIN circunscripciones c ON c.id = s.circunscripcion_id WHERE 1=1");
        if (estado != null && !estado.isBlank()) { sql.append(" AND s.estado = ?"); params.add(estado); }
        if (circunscripcionId != null) { sql.append(" AND s.circunscripcion_id = ?"); params.add(circunscripcionId); }
        if (cuil != null && !cuil.isBlank()) { sql.append(" AND s.cuil_consultado = ?"); params.add(cuil); }
        sql.append(" ORDER BY s.created_at DESC LIMIT ? OFFSET ?");
        params.add(size); params.add(offset);
        return jdbc.query(sql.toString(), rowMapper, params.toArray());
    }

    public long countAll(String estado, Integer circunscripcionId, String cuil) {
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM solicitudes WHERE 1=1");
        if (estado != null && !estado.isBlank()) { sql.append(" AND estado = ?"); params.add(estado); }
        if (circunscripcionId != null) { sql.append(" AND circunscripcion_id = ?"); params.add(circunscripcionId); }
        if (cuil != null && !cuil.isBlank()) { sql.append(" AND cuil_consultado = ?"); params.add(cuil); }
        Long count = jdbc.queryForObject(sql.toString(), Long.class, params.toArray());
        return count != null ? count : 0L;
    }

    public int updateEstado(Long id, String nuevoEstado) {
        return jdbc.update("UPDATE solicitudes SET estado = ? WHERE id = ?", nuevoEstado, id);
    }

    public int updateEstado(Long id, String nuevoEstado, String paymentExternalId, java.time.LocalDateTime paymentConfirmedAt) {
        return jdbc.update(
            "UPDATE solicitudes SET estado = ?, payment_external_id = ?, payment_confirmed_at = ? WHERE id = ?",
            nuevoEstado,
            paymentExternalId,
            Timestamp.valueOf(paymentConfirmedAt),
            id
        );
    }

    public List<Map<String, Object>> findAllCircunscripciones() {
        return jdbc.queryForList("SELECT id, nombre FROM circunscripciones WHERE is_active = 1 ORDER BY id");
    }
}