package ar.gob.pj.rdam.controller;

import ar.gob.pj.rdam.service.CertificadoService;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.Map;

@RestController
public class CertificadoController {

    private final CertificadoService certificadoService;

    public CertificadoController(CertificadoService certificadoService) {
        this.certificadoService = certificadoService;
    }

    @PostMapping("/api/v1/interno/solicitudes/{solicitudId}/certificado")
    public ResponseEntity<Map<String, Object>> subir(
        @PathVariable Long solicitudId,
        @RequestParam("file") MultipartFile file,
        Authentication auth
    ) {
        Long operadorId = (Long) auth.getPrincipal();
        Long certId = certificadoService.subirCertificado(solicitudId, operadorId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "certificadoId", certId,
            "solicitudId", solicitudId,
            "message", "Certificado subido correctamente. Solicitud publicada."
        ));
    }

    @GetMapping("/api/v1/solicitudes/{solicitudId}/certificado")
    public ResponseEntity<Resource> descargar(
        @PathVariable Long solicitudId,
        Authentication auth
    ) {
        Long ciudadanoId = (Long) auth.getPrincipal();
        Path filePath = certificadoService.descargarCertificado(solicitudId, ciudadanoId);
        Resource resource = new PathResource(filePath);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"certificado_" + solicitudId + ".pdf\"")
            .body(resource);
    }
}
