package ar.gob.pj.rdam.model;

import java.time.LocalDateTime;

public class Solicitud {
    private Long id;
    private Long ciudadanoId;
    private Integer circunscripcionId;
    private String cuilConsultado;
    private String emailContacto;
    private String estado;
    private String paymentExternalId;
    private LocalDateTime paymentConfirmedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String circunscripcionNombre;

    public Solicitud() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCiudadanoId() { return ciudadanoId; }
    public void setCiudadanoId(Long ciudadanoId) { this.ciudadanoId = ciudadanoId; }
    public Integer getCircunscripcionId() { return circunscripcionId; }
    public void setCircunscripcionId(Integer v) { this.circunscripcionId = v; }
    public String getCuilConsultado() { return cuilConsultado; }
    public void setCuilConsultado(String v) { this.cuilConsultado = v; }
    public String getEmailContacto() { return emailContacto; }
    public void setEmailContacto(String v) { this.emailContacto = v; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getPaymentExternalId() { return paymentExternalId; }
    public void setPaymentExternalId(String v) { this.paymentExternalId = v; }
    public LocalDateTime getPaymentConfirmedAt() { return paymentConfirmedAt; }
    public void setPaymentConfirmedAt(LocalDateTime v) { this.paymentConfirmedAt = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime v) { this.updatedAt = v; }
    public String getCircunscripcionNombre() { return circunscripcionNombre; }
    public void setCircunscripcionNombre(String v) { this.circunscripcionNombre = v; }
}
