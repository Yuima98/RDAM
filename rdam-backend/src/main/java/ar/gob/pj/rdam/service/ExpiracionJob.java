package ar.gob.pj.rdam.service;

import ar.gob.pj.rdam.repository.SolicitudRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Job de expiración automática de solicitudes y certificados.
 *
 * Corre diariamente a medianoche (cron: 0 0 0 * * *).
 *
 * Job 1 — Timeout de pago:
 *   Solicitudes en estado 'pendiente_pago' que superaron el límite de días
 *   sin confirmar pago pasan a 'vencida'.
 *   PRD: 60 días | DEV: 15 días (configurable vía rdam.expiracion.dias-pago)
 *
 * Job 2 — Expiración de certificados:
 *   Solicitudes en estado 'publicada' cuyo certificado superó su vence_at
 *   pasan a 'publicada_vencida'.
 *   El PDF se elimina del servidor para liberar espacio.
 */
@Service
public class ExpiracionJob {

    private static final Logger log = LoggerFactory.getLogger(ExpiracionJob.class);

    private final SolicitudRepository solicitudRepository;
    private final CertificadoService  certificadoService;

    @Value("${rdam.expiracion.dias-pago:60}")
    private int diasPago;

    public ExpiracionJob(SolicitudRepository solicitudRepository,
                         CertificadoService certificadoService) {
        this.solicitudRepository = solicitudRepository;
        this.certificadoService  = certificadoService;
    }

    // ── Job 1: Timeout de pago ─────────────────────────────────────────────────
    // Corre todos los días a medianoche
    @Scheduled(cron = "0 0 0 * * *")
    public void vencerPagosPendientes() {
        log.info("=== JOB EXPIRACIÓN PAGO === Buscando solicitudes pendiente_pago con más de {} días...", diasPago);
        List<Long> ids = solicitudRepository.findIdsPendientesPagoVencidos(diasPago);
        if (ids.isEmpty()) {
            log.info("No hay solicitudes pendientes de pago vencidas.");
            return;
        }
        int count = 0;
        for (Long id : ids) {
            solicitudRepository.updateEstado(id, "vencida");
            count++;
            log.info("Solicitud {} marcada como VENCIDA por timeout de pago.", id);
        }
        log.info("=== JOB EXPIRACIÓN PAGO === {} solicitud(es) marcada(s) como vencida.", count);
    }

    // ── Job 2: Expiración de certificados ──────────────────────────────────────
    // Corre todos los días a medianoche (5 minutos después del job 1)
    @Scheduled(cron = "0 5 0 * * *")
    public void vencerCertificados() {
        log.info("=== JOB EXPIRACIÓN CERTIFICADOS === Buscando certificados vencidos...");
        List<Long> ids = solicitudRepository.findIdsPublicadasConCertificadoVencido();
        if (ids.isEmpty()) {
            log.info("No hay certificados vencidos.");
            return;
        }
        int count = 0;
        for (Long solicitudId : ids) {
            try {
                // Eliminar el PDF del servidor
                certificadoService.eliminarArchivo(solicitudId);
                // Marcar la solicitud como publicada_vencida
                solicitudRepository.updateEstado(solicitudId, "publicada_vencida");
                count++;
                log.info("Solicitud {} marcada como PUBLICADA_VENCIDA. PDF eliminado.", solicitudId);
            } catch (Exception e) {
                log.error("Error al vencer certificado de solicitud {}: {}", solicitudId, e.getMessage());
            }
        }
        log.info("=== JOB EXPIRACIÓN CERTIFICADOS === {} certificado(s) vencido(s).", count);
    }
}