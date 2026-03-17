package ar.gob.pj.rdam.service;

import ar.gob.pj.rdam.dto.SolicitudDTO;
import ar.gob.pj.rdam.exception.BusinessException;
import ar.gob.pj.rdam.exception.ResourceNotFoundException;
import ar.gob.pj.rdam.model.Solicitud;
import ar.gob.pj.rdam.repository.CircunscripcionRepository;
import ar.gob.pj.rdam.repository.SolicitudRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class SolicitudService {

    private final SolicitudRepository solicitudRepository;
    private final CircunscripcionRepository circunscripcionRepository;
    private final RecaptchaService recaptchaService;

    public SolicitudService(SolicitudRepository solicitudRepository,
                            CircunscripcionRepository circunscripcionRepository,
                            RecaptchaService recaptchaService) {
        this.solicitudRepository = solicitudRepository;
        this.circunscripcionRepository = circunscripcionRepository;
        this.recaptchaService = recaptchaService;
    }

    public List<Map<String, Object>> listarCircunscripciones() {
        return solicitudRepository.findAllCircunscripciones();
    }

    public SolicitudDTO.CreateResponse crear(SolicitudDTO.CreateRequest req, Long ciudadanoId) {
        recaptchaService.validar(req.getRecaptchaToken());
        if (!circunscripcionRepository.existsActiva(req.getCircunscripcionId())) {
            throw new BusinessException("La circunscripcion no existe o no esta activa", 400);
        }

        // Validación de duplicados: no permitir nueva solicitud si ya existe una activa
        // para el mismo ciudadano + CUIL + circunscripción
        if (solicitudRepository.existeSolicitudActiva(ciudadanoId, req.getCuilConsultado())) {
            throw new BusinessException(
                "Ya existe una solicitud activa para ese CUIL y circunscripción. " +
                "Podés consultarla desde 'Mis trámites'.", 409);
        }

        Solicitud s = new Solicitud();
        s.setCiudadanoId(ciudadanoId);
        s.setCircunscripcionId(req.getCircunscripcionId());
        s.setCuilConsultado(req.getCuilConsultado());
        s.setEmailContacto(req.getEmailContacto());
        Long id = solicitudRepository.insert(s);
        Solicitud created = solicitudRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Error al recuperar la solicitud creada"));
        return new SolicitudDTO.CreateResponse(created.getId(), created.getEstado(), created.getCreatedAt());
    }

    public SolicitudDTO.PagedResponse listarPorCiudadano(Long ciudadanoId, String estado, String cuil, int page, int size) {
        if (page < 1) page = 1;
        if (size > 50) size = 50;
        int offset = (page - 1) * size;
        List<Solicitud> solicitudes = solicitudRepository.findByCiudadano(ciudadanoId, estado, cuil, offset, size);
        long total = solicitudRepository.countByCiudadano(ciudadanoId, estado, cuil);
        List<SolicitudDTO.ListItem> items = solicitudes.stream()
            .map(s -> new SolicitudDTO.ListItem(s.getId(), s.getCuilConsultado(),
                s.getCircunscripcionNombre(), s.getEstado(), s.getPaymentConfirmedAt(),
                s.getCreatedAt(), s.getUpdatedAt()))
            .toList();
        return new SolicitudDTO.PagedResponse(items, new SolicitudDTO.PagedResponse.Pagination(page, size, total));
    }

    public SolicitudDTO.PagedResponse listarTodas(String estado, Integer circunscripcionId, String cuil, String sort, int page, int size) {
        if (page < 1) page = 1;
        if (size > 100) size = 100;
        int offset = (page - 1) * size;
        String estadoFiltro = (estado == null || estado.isBlank()) ? null : estado;
        List<Solicitud> solicitudes = solicitudRepository.findAll(estadoFiltro, circunscripcionId, cuil, sort, offset, size);
        long total = solicitudRepository.countAll(estadoFiltro, circunscripcionId, cuil);
        List<SolicitudDTO.ListItem> items = solicitudes.stream()
            .map(s -> new SolicitudDTO.ListItem(s.getId(), s.getCuilConsultado(),
                s.getCircunscripcionNombre(), s.getEstado(), s.getPaymentConfirmedAt(),
                s.getCreatedAt(), s.getUpdatedAt()))
            .toList();
        return new SolicitudDTO.PagedResponse(items, new SolicitudDTO.PagedResponse.Pagination(page, size, total));
    }

    public SolicitudDTO.DetailResponse obtenerDetalle(Long solicitudId, Long userId, String role) {
        Solicitud s = solicitudRepository.findById(solicitudId)
            .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada: " + solicitudId));
        if ("citizen".equals(role) && !s.getCiudadanoId().equals(userId)) {
            throw new BusinessException("No tenes acceso a esta solicitud", 403);
        }
        return new SolicitudDTO.DetailResponse(s.getId(), s.getCuilConsultado(),
            s.getCircunscripcionNombre(), s.getEmailContacto(), s.getEstado(),
            s.getPaymentConfirmedAt(), s.getCreatedAt());
    }

    public Solicitud obtenerYValidarPropietario(Long solicitudId, Long userId) {
        Solicitud s = solicitudRepository.findById(solicitudId)
            .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada: " + solicitudId));
        if (!s.getCiudadanoId().equals(userId)) {
            throw new BusinessException("No tenes acceso a esta solicitud", 403);
        }
        return s;
    }
}