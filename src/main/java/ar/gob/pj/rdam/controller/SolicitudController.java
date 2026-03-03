package ar.gob.pj.rdam.controller;

import ar.gob.pj.rdam.dto.SolicitudDTO;
import ar.gob.pj.rdam.repository.SolicitudRepository;
import ar.gob.pj.rdam.service.SolicitudService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class SolicitudController {

    private final SolicitudService solicitudService;
    private final SolicitudRepository solicitudRepository;

    public SolicitudController(SolicitudService solicitudService,
                               SolicitudRepository solicitudRepository) {
        this.solicitudService = solicitudService;
        this.solicitudRepository = solicitudRepository;
    }

    @GetMapping("/api/v1/circunscripciones")
    public ResponseEntity<List<Map<String, Object>>> listarCircunscripciones() {
        return ResponseEntity.ok(solicitudRepository.findAllCircunscripciones());
    }

    @PostMapping("/api/v1/solicitudes")
    public ResponseEntity<SolicitudDTO.CreateResponse> crear(
        @Valid @RequestBody SolicitudDTO.CreateRequest req,
        Authentication auth
    ) {
        Long ciudadanoId = (Long) auth.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(solicitudService.crear(req, ciudadanoId));
    }

    @GetMapping("/api/v1/solicitudes")
    public ResponseEntity<SolicitudDTO.PagedResponse> listar(
        @RequestParam(required = false) String estado,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size,
        Authentication auth
    ) {
        Long ciudadanoId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(solicitudService.listarPorCiudadano(ciudadanoId, estado, page, size));
    }

    @GetMapping("/api/v1/solicitudes/{solicitudId}")
    public ResponseEntity<SolicitudDTO.DetailResponse> detalle(
        @PathVariable Long solicitudId,
        Authentication auth
    ) {
        Long userId = (Long) auth.getPrincipal();
        String role = auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "").toLowerCase();
        return ResponseEntity.ok(solicitudService.obtenerDetalle(solicitudId, userId, role));
    }

    @GetMapping("/api/v1/interno/solicitudes/{solicitudId}")
    public ResponseEntity<SolicitudDTO.DetailResponse> detalleInterno(
        @PathVariable Long solicitudId
    ) {
        return ResponseEntity.ok(solicitudService.obtenerDetalle(solicitudId, null, "operator"));
    }

    @GetMapping("/api/v1/interno/solicitudes")
    public ResponseEntity<SolicitudDTO.PagedResponse> listarInterno(
        @RequestParam(required = false) String estado,
        @RequestParam(required = false) String cuil,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int size,
        HttpServletRequest request,
        Authentication auth
    ) {
        Integer circunscripcionId = (Integer) request.getAttribute("circunscripcionId");
        return ResponseEntity.ok(solicitudService.listarTodas(estado, circunscripcionId, cuil, page, size));
    }
}