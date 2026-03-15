package ar.gob.pj.rdam.service;

import ar.gob.pj.rdam.dto.PagoDTO;
import ar.gob.pj.rdam.exception.BusinessException;
import ar.gob.pj.rdam.exception.ResourceNotFoundException;
import ar.gob.pj.rdam.model.Solicitud;
import ar.gob.pj.rdam.repository.SolicitudRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class PagoService {

    private static final Logger log = LoggerFactory.getLogger(PagoService.class);

    private final SolicitudRepository solicitudRepository;

    @Value("${rdam.pluspagos.url}")
    private String pasarelaUrl;

    @Value("${rdam.pluspagos.merchant-guid}")
    private String merchantGuid;

    @Value("${rdam.pluspagos.secret-key}")
    private String secretKey;

    @Value("${rdam.pluspagos.callback-url}")
    private String callbackUrl;

    @Value("${rdam.pluspagos.url-success}")
    private String urlSuccess;

    @Value("${rdam.pluspagos.url-error}")
    private String urlError;

    @Value("${rdam.pluspagos.monto-centavos}")
    private String montoCentavos;

    public PagoService(SolicitudRepository solicitudRepository) {
        this.solicitudRepository = solicitudRepository;
    }

    // ── Iniciar pago ──────────────────────────────────────────────────────────

    public PagoDTO.IniciarPagoResponse iniciarPago(Long solicitudId, Long ciudadanoId) {
        Solicitud solicitud = solicitudRepository.findById(solicitudId)
            .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada: " + solicitudId));

        if (!solicitud.getCiudadanoId().equals(ciudadanoId)) {
            throw new BusinessException("No tenés permiso para pagar esta solicitud", 403);
        }

        if (!"pendiente_pago".equals(solicitud.getEstado())) {
            throw new BusinessException("La solicitud no está en estado pendiente_pago", 400);
        }

        String transaccionId = "TXN-" + solicitudId + "-" + System.currentTimeMillis();

        String cbSuccess = callbackUrl + "?status=success&txn=" + transaccionId;
        String cbCancel  = callbackUrl + "?status=cancel&txn=" + transaccionId;

        String informacion = "{\"solicitudId\":" + solicitudId + ",\"ciudadanoId\":" + ciudadanoId + "}";

        return new PagoDTO.IniciarPagoResponse(
            pasarelaUrl,
            merchantGuid,
            transaccionId,
            encrypt(montoCentavos),
            encrypt(cbSuccess),
            encrypt(cbCancel),
            encrypt(urlSuccess + "?solicitudId=" + solicitudId),
            encrypt(urlError   + "?solicitudId=" + solicitudId),
            encrypt(informacion)
        );
    }

    // ── Procesar webhook ──────────────────────────────────────────────────────

    public void procesarWebhook(PagoDTO.WebhookRequest webhook) {
        log.info("=== WEBHOOK PLUSPAGOS === Tipo:{} TxnComercio:{} Estado:{}",
            webhook.getTipo(), webhook.getTransaccionComercioId(), webhook.getEstado());

        if (!"PAGO".equals(webhook.getTipo())) {
            log.info("Webhook ignorado: tipo {} no es PAGO", webhook.getTipo());
            return;
        }

        // Extraer solicitudId del TransaccionComercioId (formato: TXN-{solicitudId}-{timestamp})
        String txnId = webhook.getTransaccionComercioId();
        Long solicitudId = parseSolicitudId(txnId);
        if (solicitudId == null) {
            log.warn("No se pudo extraer solicitudId de: {}", txnId);
            return;
        }

        Solicitud solicitud = solicitudRepository.findById(solicitudId).orElse(null);
        if (solicitud == null) {
            log.warn("Solicitud no encontrada: {}", solicitudId);
            return;
        }

        // Idempotencia: si ya fue procesada no hacer nada
        if (!"pendiente_pago".equals(solicitud.getEstado())) {
            log.info("Solicitud {} ya procesada, estado actual: {}", solicitudId, solicitud.getEstado());
            return;
        }

        if ("REALIZADA".equals(webhook.getEstado()) || "3".equals(webhook.getEstadoId())) {
            // Pago aprobado → marcar como pagada
            solicitudRepository.updateEstado(solicitudId, "pagada",
                webhook.getTransaccionPlataformaId(), LocalDateTime.now());
            log.info("Solicitud {} marcada como PAGADA. TxnPlataforma: {}",
                solicitudId, webhook.getTransaccionPlataformaId());
        } else {
            // Pago rechazado → marcar como cancelada
            solicitudRepository.updateEstado(solicitudId, "cancelada");
            log.info("Solicitud {} marcada como CANCELADA por pago rechazado. Estado webhook: {}",
                solicitudId, webhook.getEstado());
        }
    }

    // ── Encriptación AES-256-CBC (compatible con crypto.js de PlusPagos) ─────

    private String encrypt(String plainText) {
        try {
            // SHA-256 de la clave (igual que CryptoJS.SHA256)
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(secretKey.getBytes(StandardCharsets.UTF_8));

            // IV aleatorio de 16 bytes
            byte[] iv = new byte[16];
            new SecureRandom().nextBytes(iv);

            SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);

            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // Combinar IV + ciphertext y codificar en Base64 (igual que CryptoJS)
            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Error al encriptar para PlusPagos", e);
        }
    }

    private Long parseSolicitudId(String txnId) {
        try {
            // Formato: TXN-{solicitudId}-{timestamp}
            String[] parts = txnId.split("-");
            if (parts.length >= 2) {
                return Long.parseLong(parts[1]);
            }
        } catch (NumberFormatException e) {
            log.warn("Error parseando solicitudId de txnId: {}", txnId);
        }
        return null;
    }
}