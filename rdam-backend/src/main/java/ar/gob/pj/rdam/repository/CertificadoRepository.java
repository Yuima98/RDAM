package ar.gob.pj.rdam.repository;

import ar.gob.pj.rdam.model.Certificado;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class CertificadoRepository {

    private final JdbcTemplate jdbc;

    public CertificadoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Certificado> rowMapper = (rs, rowNum) -> {
        Certificado c = new Certificado();
        c.setId(rs.getLong("id"));
        c.setSolicitudId(rs.getLong("solicitud_id"));
        c.setOperadorId(rs.getLong("operador_id"));
        c.setFilePath(rs.getString("file_path"));
        c.setFileHash(rs.getString("file_hash"));
        c.setEmitidoAt(rs.getTimestamp("emitido_at").toLocalDateTime());
        c.setVenceAt(rs.getTimestamp("vence_at").toLocalDateTime());
        Timestamp ea = rs.getTimestamp("email_enviado_at");
        if (ea != null) c.setEmailEnviadoAt(ea.toLocalDateTime());
        c.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        return c;
    };

    public Long insert(Certificado cert) {
        String sql = "INSERT INTO certificados (solicitud_id, operador_id, file_path, file_hash, emitido_at, vence_at) VALUES (?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, cert.getSolicitudId());
            ps.setLong(2, cert.getOperadorId());
            ps.setString(3, cert.getFilePath());
            ps.setString(4, cert.getFileHash());
            ps.setTimestamp(5, Timestamp.valueOf(cert.getEmitidoAt()));
            ps.setTimestamp(6, Timestamp.valueOf(cert.getVenceAt()));
            return ps;
        }, keyHolder);
        return keyHolder.getKey().longValue();
    }

    public Optional<Certificado> findBySolicitudId(Long solicitudId) {
        List<Certificado> results = jdbc.query(
            "SELECT * FROM certificados WHERE solicitud_id = ?", rowMapper, solicitudId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public boolean existsBySolicitudId(Long solicitudId) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM certificados WHERE solicitud_id = ?", Integer.class, solicitudId);
        return count != null && count > 0;
    }
}
