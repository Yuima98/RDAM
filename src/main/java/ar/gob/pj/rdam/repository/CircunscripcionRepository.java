package ar.gob.pj.rdam.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class CircunscripcionRepository {

    private final JdbcTemplate jdbc;

    public CircunscripcionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean existsActiva(Integer id) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM circunscripciones WHERE id = ? AND is_active = 1",
            Integer.class, id);
        return count != null && count > 0;
    }
}
