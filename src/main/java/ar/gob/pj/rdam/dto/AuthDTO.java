package ar.gob.pj.rdam.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class AuthDTO {

    // ── POST /auth/register ───────────────────────────────────────────────────

    public static class RegisterRequest {
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no es valido")
        private String email;

        public String getEmail() { return email; }
        public void setEmail(String v) { this.email = v; }
    }

    // ── POST /auth/verify-otp ─────────────────────────────────────────────────

    public static class VerifyOtpRequest {
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no es valido")
        private String email;

        @NotBlank(message = "El codigo OTP es obligatorio")
        private String otpCode;

        public String getEmail() { return email; }
        public void setEmail(String v) { this.email = v; }
        public String getOtpCode() { return otpCode; }
        public void setOtpCode(String v) { this.otpCode = v; }
    }

    // ── POST /auth/login ──────────────────────────────────────────────────────

    public static class LoginRequest {
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no es valido")
        @Pattern(regexp = ".*@santafe\\.gov\\.ar$", message = "El email debe ser del dominio @santafe.gov.ar")
        private String email;

        @NotBlank(message = "La password es obligatoria")
        @Size(min = 8, message = "La password debe tener al menos 8 caracteres")
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String v) { this.email = v; }
        public String getPassword() { return password; }
        public void setPassword(String v) { this.password = v; }
    }

    // ── Response JWT (verify-otp y login) ────────────────────────────────────

    public static class TokenResponse {
        private String accessToken;
        private LocalDateTime expiresAt;
        private String role;

        public TokenResponse(String accessToken, LocalDateTime expiresAt, String role) {
            this.accessToken = accessToken;
            this.expiresAt = expiresAt;
            this.role = role;
        }

        public String getAccessToken() { return accessToken; }
        public LocalDateTime getExpiresAt() { return expiresAt; }
        public String getRole() { return role; }
    }
}
