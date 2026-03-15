package ar.gob.pj.rdam.controller;

import ar.gob.pj.rdam.dto.AdminDTO;
import ar.gob.pj.rdam.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // GET /api/v1/admin/usuarios
    @GetMapping("/usuarios")
    public ResponseEntity<List<AdminDTO.UserResponse>> listar() {
        return ResponseEntity.ok(adminService.listarUsuariosInternos());
    }

    // POST /api/v1/admin/usuarios
    @PostMapping("/usuarios")
    public ResponseEntity<AdminDTO.UserResponse> crear(
        @Valid @RequestBody AdminDTO.CreateUserRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.crearUsuarioInterno(req));
    }

    // PATCH /api/v1/admin/usuarios/{id}/estado
    @PatchMapping("/usuarios/{id}/estado")
    public ResponseEntity<Void> actualizarEstado(
        @PathVariable Long id,
        @Valid @RequestBody AdminDTO.UpdateEstadoRequest req
    ) {
        adminService.actualizarEstado(id, req.getActivo());
        return ResponseEntity.noContent().build();
    }
}
