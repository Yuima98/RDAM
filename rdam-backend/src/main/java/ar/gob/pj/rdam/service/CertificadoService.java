package ar.gob.pj.rdam.service;

import ar.gob.pj.rdam.exception.BusinessException;
import ar.gob.pj.rdam.exception.ResourceNotFoundException;
import ar.gob.pj.rdam.model.Certificado;
import ar.gob.pj.rdam.model.Solicitud;
import ar.gob.pj.rdam.repository.CertificadoRepository;
import ar.gob.pj.rdam.repository.SolicitudRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
public class CertificadoService {

    private static final Logger log = LoggerFactory.getLogger(CertificadoService.class);

    private final CertificadoRepository certificadoRepository;
    private final SolicitudRepository solicitudRepository;
    private final Path storagePath;

    public CertificadoService(
        CertificadoRepository certificadoRepository,
        SolicitudRepository solicitudRepository,
        @Value("${rdam.storage.path}") String storagePath
    ) {
        this.certificadoRepository = certificadoRepository;
        this.solicitudRepository = solicitudRepository;
        this.storagePath = Paths.get(storagePath);
    }

    public Long subirCertificado(Long solicitudId, Long operadorId, MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new BusinessException("El archivo debe ser un PDF (application/pdf)", 400);
        }
        Solicitud solicitud = solicitudRepository.findById(solicitudId)
            .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada: " + solicitudId));
        if (!"pagada".equals(solicitud.getEstado())) {
            throw new BusinessException("La solicitud debe estar en estado 'pagada'. Estado actual: " + solicitud.getEstado(), 400);
        }
        if (certificadoRepository.existsBySolicitudId(solicitudId)) {
            throw new BusinessException("Ya existe un certificado para esta solicitud", 400);
        }
        String fileName = "cert_" + solicitudId + "_" + System.currentTimeMillis() + ".pdf";
        Path destDir  = storagePath.resolve(String.valueOf(solicitudId));
        Path destFile = destDir.resolve(fileName);
        try {
            Files.createDirectories(destDir);
            Files.copy(file.getInputStream(), destFile);
        } catch (IOException e) {
            throw new BusinessException("Error al guardar el archivo: " + e.getMessage(), 500);
        }
        String hash;
        try (InputStream is = Files.newInputStream(destFile)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) digest.update(buffer, 0, bytesRead);
            hash = HexFormat.of().formatHex(digest.digest());
        } catch (Exception e) {
            throw new BusinessException("Error al calcular hash del archivo", 500);
        }
        LocalDateTime now = LocalDateTime.now();
        Certificado cert = new Certificado();
        cert.setSolicitudId(solicitudId);
        cert.setOperadorId(operadorId);
        cert.setFilePath(destFile.toAbsolutePath().toString());
        cert.setFileHash(hash);
        cert.setEmitidoAt(now);
        cert.setVenceAt(now.plusDays(65));
        Long certId = certificadoRepository.insert(cert);
        solicitudRepository.updateEstado(solicitudId, "publicada");
        return certId;
    }

    public Path descargarCertificado(Long solicitudId, Long ciudadanoId) {
        Solicitud solicitud = solicitudRepository.findById(solicitudId)
            .orElseThrow(() -> new ResourceNotFoundException("Solicitud no encontrada: " + solicitudId));
        if (!solicitud.getCiudadanoId().equals(ciudadanoId)) {
            throw new BusinessException("No tenes acceso a esta solicitud", 403);
        }
        if ("publicada_vencida".equals(solicitud.getEstado())) {
            throw new BusinessException("El certificado ha vencido y ya no es valido", 400);
        }
        if (!"publicada".equals(solicitud.getEstado())) {
            throw new BusinessException("El certificado no esta disponible. Estado actual: " + solicitud.getEstado(), 400);
        }
        Certificado cert = certificadoRepository.findBySolicitudId(solicitudId)
            .orElseThrow(() -> new ResourceNotFoundException("Certificado no encontrado para solicitud: " + solicitudId));
        Path filePath = Paths.get(cert.getFilePath());
        if (!Files.exists(filePath)) {
            throw new BusinessException("El archivo no fue encontrado en el servidor", 500);
        }
        return filePath;
    }

    /**
     * Elimina el PDF del servidor cuando un certificado vence.
     * Llamado por ExpiracionJob al procesar certificados vencidos.
     * No lanza excepción si el archivo no existe — puede haber sido eliminado manualmente.
     */
    public void eliminarArchivo(Long solicitudId) {
        certificadoRepository.findBySolicitudId(solicitudId).ifPresent(cert -> {
            Path filePath = Paths.get(cert.getFilePath());
            try {
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    log.info("PDF eliminado: {}", filePath);
                    // Intentar eliminar el directorio si quedó vacío
                    Path dir = filePath.getParent();
                    if (dir != null && Files.isDirectory(dir)) {
                        try (var stream = Files.list(dir)) {
                            if (stream.findAny().isEmpty()) Files.delete(dir);
                        }
                    }
                }
            } catch (IOException e) {
                log.warn("No se pudo eliminar el PDF de solicitud {}: {}", solicitudId, e.getMessage());
            }
        });
    }
}