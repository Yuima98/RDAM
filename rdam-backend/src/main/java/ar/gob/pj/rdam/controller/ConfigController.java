package ar.gob.pj.rdam.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class ConfigController {

    @Value("${rdam.recaptcha.enabled:false}")
    private boolean recaptchaEnabled;

    @GetMapping("/api/v1/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        return ResponseEntity.ok(Map.of("recaptchaEnabled", recaptchaEnabled));
    }
}