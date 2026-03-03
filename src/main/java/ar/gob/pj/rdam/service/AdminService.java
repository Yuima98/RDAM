package ar.gob.pj.rdam.service;

import ar.gob.pj.rdam.dto.AdminDTO;
import ar.gob.pj.rdam.exception.BusinessException;
import ar.gob.pj.rdam.exception.ResourceNotFoundException;
import ar.gob.pj.rdam.model.User;
import ar.gob.pj.rdam.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<AdminDTO.UserResponse> listarUsuariosInternos() {
        return userRepository.findInternalUsers().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public AdminDTO.UserResponse crearUsuarioInterno(AdminDTO.CreateUserRequest req) {
        String email = req.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("El email ya esta registrado", 409);
        }

        if ("operator".equals(req.getRole()) && req.getCircunscripcionId() == null) {
            throw new BusinessException("Los operadores deben tener una circunscripcion asignada", 400);
        }

        if ("admin".equals(req.getRole()) && req.getCircunscripcionId() != null) {
            throw new BusinessException("Los admins tienen acceso global, no se asigna circunscripcion", 400);
        }

        String hash = passwordEncoder.encode(req.getPassword());
        Long userId = userRepository.insertInternal(email, hash, req.getRole(), req.getCircunscripcionId());

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("Error al crear el usuario", 500));

        return toResponse(user);
    }

    public void actualizarEstado(Long userId, boolean activo) {
        userRepository.findById(userId)
            .filter(u -> "operator".equals(u.getRole()) || "admin".equals(u.getRole()))
            .orElseThrow(() -> new ResourceNotFoundException("Usuario interno no encontrado con id: " + userId));

        userRepository.updateActive(userId, activo);
    }

    private AdminDTO.UserResponse toResponse(User u) {
        return new AdminDTO.UserResponse(
            u.getId(),
            u.getEmail(),
            u.getRole(),
            u.getCircunscripcionId(),
            u.isActive(),
            u.getCreatedAt()
        );
    }
}
