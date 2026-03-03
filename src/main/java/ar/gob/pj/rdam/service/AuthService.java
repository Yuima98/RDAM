package ar.gob.pj.rdam.service;

import ar.gob.pj.rdam.dto.AuthDTO;
import ar.gob.pj.rdam.exception.BusinessException;
import ar.gob.pj.rdam.model.User;
import ar.gob.pj.rdam.repository.UserRepository;
import ar.gob.pj.rdam.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final int OTP_EXPIRATION_MINUTES = 10;

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserRepository userRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    // ── Register (ciudadano) ──────────────────────────────────────────────────

    public void register(AuthDTO.RegisterRequest req) {
        String email = req.getEmail().toLowerCase().trim();

        Long userId;
        User existing = userRepository.findByEmail(email).orElse(null);

        if (existing != null) {
            // Usuario ya registrado — verificar que sea ciudadano y que esté activo
            if (!"citizen".equals(existing.getRole())) {
                throw new BusinessException("Este email corresponde a un usuario interno. Usá /auth/login", 400);
            }
            if (!existing.isActive()) {
                throw new BusinessException("La cuenta esta deshabilitada", 403);
            }
            userId = existing.getId();
        } else {
            // Usuario nuevo — crear cuenta ciudadano
            userId = userRepository.insertCitizen(email);
        }

        // Generar y guardar OTP (tanto para nuevos como para existentes)
        String otp = generateOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES);
        userRepository.saveOtp(userId, otp, expiresAt);

        // En producción aquí se enviaría el email.
        log.info("=== OTP PARA {} : {} (expira: {}) ===", email, otp, expiresAt);
    }

    // ── Verify OTP (ciudadano) ────────────────────────────────────────────────

    public AuthDTO.TokenResponse verifyOtp(AuthDTO.VerifyOtpRequest req) {
        String email = req.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("Email no registrado", 401));

        if (!user.isActive()) {
            throw new BusinessException("La cuenta esta deshabilitada", 403);
        }

        if (user.getOtpCode() == null || user.getOtpExpiresAt() == null) {
            throw new BusinessException("No hay un OTP activo para este usuario", 401);
        }

        if (!user.getOtpCode().equals(req.getOtpCode())) {
            throw new BusinessException("OTP invalido", 401);
        }

        if (LocalDateTime.now().isAfter(user.getOtpExpiresAt())) {
            throw new BusinessException("El OTP ha expirado", 401);
        }

        // OTP válido — limpiar y emitir JWT
        userRepository.clearOtp(user.getId());

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getCircunscripcionId());
        LocalDateTime expiresAt = jwtService.getExpiration(token);

        return new AuthDTO.TokenResponse(token, expiresAt, user.getRole());
    }

    // ── Login (operador / admin) ──────────────────────────────────────────────

    public AuthDTO.TokenResponse login(AuthDTO.LoginRequest req) {
        String email = req.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException("Credenciales invalidas", 401));

        if (!user.isActive()) {
            throw new BusinessException("La cuenta esta deshabilitada", 403);
        }

        if (user.getPasswordHash() == null ||
            !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new BusinessException("Credenciales invalidas", 401);
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getCircunscripcionId());
        LocalDateTime expiresAt = jwtService.getExpiration(token);

        return new AuthDTO.TokenResponse(token, expiresAt, user.getRole());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String generateOtp() {
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }
}
