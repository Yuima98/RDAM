package ar.gob.pj.rdam.service;

import ar.gob.pj.rdam.dto.AuthDTO;
import ar.gob.pj.rdam.exception.BusinessException;
import ar.gob.pj.rdam.model.User;
import ar.gob.pj.rdam.repository.UserRepository;
import ar.gob.pj.rdam.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final int OTP_EXPIRATION_MINUTES = 10;

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom random = new SecureRandom();

    // TODO [TESTING] — En producción eliminar esta variable y la condición en register().
    @Value("${spring.profiles.active:prod}")
    private String activeProfile;

    public AuthService(UserRepository userRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    // ── Register (ciudadano) ──────────────────────────────────────────────────

    // TODO [TESTING] — En producción este método debe retornar void.
    // Retorna el OTP generado para que el controller pueda exponerlo
    // en el response cuando el perfil activo es "dev".
    public String register(AuthDTO.RegisterRequest req) {
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

        // TODO [TESTING] — En producción eliminar la condición y dejar solo emailService.enviarOtp(email, otp)
        if (!"dev".equals(activeProfile)) {
            emailService.enviarOtp(email, otp);
        }

        // TODO [TESTING] — En producción reemplazar por: return; (void)
        return otp;
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