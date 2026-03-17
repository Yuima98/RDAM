package ar.gob.pj.rdam.service;

import ar.gob.pj.rdam.exception.BusinessException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Valida tokens reCAPTCHA v2 contra la API de Google.
 * En perfil dev puede deshabilitarse con rdam.recaptcha.enabled=false.
 */
@Service
public class RecaptchaService {

    private static final Logger log = LoggerFactory.getLogger(RecaptchaService.class);
    private static final String VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

    @Value("${rdam.recaptcha.secret-key:6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe}")
    private String secretKey;

    @Value("${rdam.recaptcha.enabled:true}")
    private boolean enabled;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public void validar(String token) {
        if (!enabled) {
            log.debug("reCAPTCHA deshabilitado en perfil dev — saltando validación.");
            return;
        }
        if (token == null || token.isBlank()) {
            throw new BusinessException("Token reCAPTCHA requerido.", 400);
        }
        try {
            String body = "secret=" + secretKey + "&response=" + token;
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(VERIFY_URL))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode json = mapper.readTree(response.body());
            if (!json.path("success").asBoolean()) {
                log.warn("reCAPTCHA inválido. Error codes: {}", json.path("error-codes"));
                throw new BusinessException("Verificación de reCAPTCHA fallida. Intentá de nuevo.", 400);
            }
            log.debug("reCAPTCHA validado correctamente.");
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error al contactar API de reCAPTCHA: {}", e.getMessage());
            throw new BusinessException("No se pudo verificar el reCAPTCHA. Intentá de nuevo.", 500);
        }
    }
}