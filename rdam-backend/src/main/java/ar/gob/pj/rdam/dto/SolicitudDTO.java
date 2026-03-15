package ar.gob.pj.rdam.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDateTime;
import java.util.List;

public class SolicitudDTO {

    public static class CreateRequest {
        @NotBlank(message = "El CUIL es obligatorio")
        @Pattern(regexp = "^\\d{2}-\\d{8}-\\d{1}$", message = "El CUIL debe tener el formato XX-XXXXXXXX-X")
        private String cuilConsultado;

        @NotNull(message = "La circunscripcion es obligatoria")
        private Integer circunscripcionId;

        @NotBlank(message = "El email de contacto es obligatorio")
        @Email(message = "El email de contacto no es valido")
        private String emailContacto;

        public String getCuilConsultado() { return cuilConsultado; }
        public void setCuilConsultado(String v) { this.cuilConsultado = v; }
        public Integer getCircunscripcionId() { return circunscripcionId; }
        public void setCircunscripcionId(Integer v) { this.circunscripcionId = v; }
        public String getEmailContacto() { return emailContacto; }
        public void setEmailContacto(String v) { this.emailContacto = v; }
    }

    public static class CreateResponse {
        private Long solicitudId;
        private String estado;
        private LocalDateTime createdAt;

        public CreateResponse(Long solicitudId, String estado, LocalDateTime createdAt) {
            this.solicitudId = solicitudId;
            this.estado = estado;
            this.createdAt = createdAt;
        }

        public Long getSolicitudId() { return solicitudId; }
        public String getEstado() { return estado; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }

    public static class ListItem {
        private Long solicitudId;
        private String cuilConsultado;
        private String circunscripcion;
        private String estado;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public ListItem(Long solicitudId, String cuilConsultado, String circunscripcion,
                        String estado, LocalDateTime createdAt, LocalDateTime updatedAt) {
            this.solicitudId = solicitudId;
            this.cuilConsultado = cuilConsultado;
            this.circunscripcion = circunscripcion;
            this.estado = estado;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }

        public Long getSolicitudId() { return solicitudId; }
        public String getCuilConsultado() { return cuilConsultado; }
        public String getCircunscripcion() { return circunscripcion; }
        public String getEstado() { return estado; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public LocalDateTime getUpdatedAt() { return updatedAt; }
    }

    public static class PagedResponse {
        private List<ListItem> data;
        private Pagination pagination;

        public PagedResponse(List<ListItem> data, Pagination pagination) {
            this.data = data;
            this.pagination = pagination;
        }

        public List<ListItem> getData() { return data; }
        public Pagination getPagination() { return pagination; }

        public static class Pagination {
            private int page;
            private int size;
            private long total;

            public Pagination(int page, int size, long total) {
                this.page = page;
                this.size = size;
                this.total = total;
            }

            public int getPage() { return page; }
            public int getSize() { return size; }
            public long getTotal() { return total; }
        }
    }

    public static class DetailResponse {
        private Long solicitudId;
        private String cuilConsultado;
        private String circunscripcion;
        private String emailContacto;
        private String estado;
        private LocalDateTime paymentConfirmedAt;
        private LocalDateTime createdAt;

        public DetailResponse(Long solicitudId, String cuilConsultado, String circunscripcion,
                              String emailContacto, String estado,
                              LocalDateTime paymentConfirmedAt, LocalDateTime createdAt) {
            this.solicitudId = solicitudId;
            this.cuilConsultado = cuilConsultado;
            this.circunscripcion = circunscripcion;
            this.emailContacto = emailContacto;
            this.estado = estado;
            this.paymentConfirmedAt = paymentConfirmedAt;
            this.createdAt = createdAt;
        }

        public Long getSolicitudId() { return solicitudId; }
        public String getCuilConsultado() { return cuilConsultado; }
        public String getCircunscripcion() { return circunscripcion; }
        public String getEmailContacto() { return emailContacto; }
        public String getEstado() { return estado; }
        public LocalDateTime getPaymentConfirmedAt() { return paymentConfirmedAt; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }
}
