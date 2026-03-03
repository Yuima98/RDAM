package ar.gob.pj.rdam.controller;

import ar.gob.pj.rdam.dto.AuthDTO;
import ar.gob.pj.rdam.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST /api/v1/auth/register
    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody AuthDTO.RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // POST /api/v1/auth/verify-otp
    @PostMapping("/verify-otp")
    public ResponseEntity<AuthDTO.TokenResponse> verifyOtp(
        @Valid @RequestBody AuthDTO.VerifyOtpRequest req
    ) {
        return ResponseEntity.ok(authService.verifyOtp(req));
    }

    // POST /api/v1/auth/login
    @PostMapping("/login")
    public ResponseEntity<AuthDTO.TokenResponse> login(
        @Valid @RequestBody AuthDTO.LoginRequest req
    ) {
        return ResponseEntity.ok(authService.login(req));
    }

    // POST /api/v1/auth/logout
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Sin invalidación server-side (limitación conocida del proyecto).
        // El cliente debe descartar el token localmente.
        return ResponseEntity.noContent().build();
    }
}
