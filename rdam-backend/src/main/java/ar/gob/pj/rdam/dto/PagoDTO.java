package ar.gob.pj.rdam.dto;

public class PagoDTO {

    // ── Response de iniciar pago ──────────────────────────────────────────────

    public static class IniciarPagoResponse {
        private String pasarelaUrl;
        private String comercio;
        private String transaccionComercioId;
        private String monto;
        private String callbackSuccess;
        private String callbackCancel;
        private String urlSuccess;
        private String urlError;
        private String informacion;

        public IniciarPagoResponse(String pasarelaUrl, String comercio,
                                   String transaccionComercioId, String monto,
                                   String callbackSuccess, String callbackCancel,
                                   String urlSuccess, String urlError,
                                   String informacion) {
            this.pasarelaUrl = pasarelaUrl;
            this.comercio = comercio;
            this.transaccionComercioId = transaccionComercioId;
            this.monto = monto;
            this.callbackSuccess = callbackSuccess;
            this.callbackCancel = callbackCancel;
            this.urlSuccess = urlSuccess;
            this.urlError = urlError;
            this.informacion = informacion;
        }

        public String getPasarelaUrl() { return pasarelaUrl; }
        public String getComercio() { return comercio; }
        public String getTransaccionComercioId() { return transaccionComercioId; }
        public String getMonto() { return monto; }
        public String getCallbackSuccess() { return callbackSuccess; }
        public String getCallbackCancel() { return callbackCancel; }
        public String getUrlSuccess() { return urlSuccess; }
        public String getUrlError() { return urlError; }
        public String getInformacion() { return informacion; }
    }

    // ── Webhook de PlusPagos ──────────────────────────────────────────────────

    public static class WebhookRequest {
        @com.fasterxml.jackson.annotation.JsonProperty("Tipo")
        private String tipo;
        @com.fasterxml.jackson.annotation.JsonProperty("TransaccionPlataformaId")
        private String transaccionPlataformaId;
        @com.fasterxml.jackson.annotation.JsonProperty("TransaccionComercioId")
        private String transaccionComercioId;
        @com.fasterxml.jackson.annotation.JsonProperty("Monto")
        private String monto;
        @com.fasterxml.jackson.annotation.JsonProperty("EstadoId")
        private String estadoId;
        @com.fasterxml.jackson.annotation.JsonProperty("Estado")
        private String estado;
        @com.fasterxml.jackson.annotation.JsonProperty("FechaProcesamiento")
        private String fechaProcesamiento;

        public String getTipo() { return tipo; }
        public void setTipo(String v) { this.tipo = v; }
        public String getTransaccionPlataformaId() { return transaccionPlataformaId; }
        public void setTransaccionPlataformaId(String v) { this.transaccionPlataformaId = v; }
        public String getTransaccionComercioId() { return transaccionComercioId; }
        public void setTransaccionComercioId(String v) { this.transaccionComercioId = v; }
        public String getMonto() { return monto; }
        public void setMonto(String v) { this.monto = v; }
        public String getEstadoId() { return estadoId; }
        public void setEstadoId(String v) { this.estadoId = v; }
        public String getEstado() { return estado; }
        public void setEstado(String v) { this.estado = v; }
        public String getFechaProcesamiento() { return fechaProcesamiento; }
        public void setFechaProcesamiento(String v) { this.fechaProcesamiento = v; }
    }
}