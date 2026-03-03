package ar.gob.pj.rdam.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public class AdminDTO {

    // ── POST /admin/usuarios ──────────────────────────────────────────────────

    public static class CreateUserRequest {
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no es valido")
        @Pattern(regexp = ".*@santafe\\.gov\\.ar$", message = "El email debe ser del dominio @santafe.gov.ar")
        private String email;

        @NotBlank(message = "La password es obligatoria")
        @Size(min = 8, message = "La password debe tener al menos 8 caracteres")
        private String password;

        @NotBlank(message = "El rol es obligatorio")
        @Pattern(regexp = "^(operator|admin)$", message = "El rol debe ser 'operator' o 'admin'")
        private String role;

        private Integer circunscripcionId; // Obligatorio para operator, null para admin

        public String getEmail() { return email; }
        public void setEmail(String v) { this.email = v; }
        public String getPassword() { return password; }
        public void setPassword(String v) { this.password = v; }
        public String getRole() { return role; }
        public void setRole(String v) { this.role = v; }
        public Integer getCircunscripcionId() { return circunscripcionId; }
        public void setCircunscripcionId(Integer v) { this.circunscripcionId = v; }
    }

    // ── PATCH /admin/usuarios/{id}/estado ─────────────────────────────────────

    public static class UpdateEstadoRequest {
        @NotNull(message = "El campo activo es obligatorio")
        private Boolean activo;

        public Boolean getActivo() { return activo; }
        public void setActivo(Boolean v) { this.activo = v; }
    }

    // ── Response ──────────────────────────────────────────────────────────────

    public static class UserResponse {
        private Long id;
        private String email;
        private String role;
        private Integer circunscripcionId;
        private boolean activo;
        private LocalDateTime createdAt;

        public UserResponse(Long id, String email, String role,
                            Integer circunscripcionId, boolean activo,
                            LocalDateTime createdAt) {
            this.id = id;
            this.email = email;
            this.role = role;
            this.circunscripcionId = circunscripcionId;
            this.activo = activo;
            this.createdAt = createdAt;
        }

        public Long getId() { return id; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
        public Integer getCircunscripcionId() { return circunscripcionId; }
        public boolean isActivo() { return activo; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }
}
