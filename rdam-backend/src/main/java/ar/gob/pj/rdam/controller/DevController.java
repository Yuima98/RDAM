package ar.gob.pj.rdam.controller;

import ar.gob.pj.rdam.service.ExpiracionJob;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * DevController
 *
 * Endpoints de utilidad solo disponibles en perfil 'dev'.
 * NO incluir en producción — @Profile("dev") lo excluye automáticamente.
 */
@Profile("dev")
@RestController
@RequestMapping("/api/v1/dev")
public class DevController {

    private final ExpiracionJob expiracionJob;

    public DevController(ExpiracionJob expiracionJob) {
        this.expiracionJob = expiracionJob;
    }

    @PostMapping("/jobs/vencer-pagos")
    public ResponseEntity<Map<String, String>> vencerPagos() {
        expiracionJob.vencerPagosPendientes();
        return ResponseEntity.ok(Map.of("message", "Job vencerPagosPendientes ejecutado."));
    }

    @PostMapping("/jobs/vencer-certificados")
    public ResponseEntity<Map<String, String>> vencerCertificados() {
        expiracionJob.vencerCertificados();
        return ResponseEntity.ok(Map.of("message", "Job vencerCertificados ejecutado."));
    }
}