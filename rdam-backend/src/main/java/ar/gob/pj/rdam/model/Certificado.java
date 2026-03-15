package ar.gob.pj.rdam.model;

import java.time.LocalDateTime;

public class Certificado {
    private Long id;
    private Long solicitudId;
    private Long operadorId;
    private String filePath;
    private String fileHash;
    private LocalDateTime emitidoAt;
    private LocalDateTime venceAt;
    private LocalDateTime emailEnviadoAt;
    private LocalDateTime createdAt;

    public Certificado() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSolicitudId() { return solicitudId; }
    public void setSolicitudId(Long v) { this.solicitudId = v; }
    public Long getOperadorId() { return operadorId; }
    public void setOperadorId(Long v) { this.operadorId = v; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String v) { this.filePath = v; }
    public String getFileHash() { return fileHash; }
    public void setFileHash(String v) { this.fileHash = v; }
    public LocalDateTime getEmitidoAt() { return emitidoAt; }
    public void setEmitidoAt(LocalDateTime v) { this.emitidoAt = v; }
    public LocalDateTime getVenceAt() { return venceAt; }
    public void setVenceAt(LocalDateTime v) { this.venceAt = v; }
    public LocalDateTime getEmailEnviadoAt() { return emailEnviadoAt; }
    public void setEmailEnviadoAt(LocalDateTime v) { this.emailEnviadoAt = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
}
