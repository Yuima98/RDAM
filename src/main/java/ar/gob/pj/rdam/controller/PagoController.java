package ar.gob.pj.rdam.controller;

import ar.gob.pj.rdam.dto.PagoDTO;
import ar.gob.pj.rdam.service.PagoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;



@RestController
@RequestMapping("/api/v1")
public class PagoController {

    private final PagoService pagoService;

    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    // POST /api/v1/pagos/iniciar/{solicitudId}
    @PostMapping("/pagos/iniciar/{solicitudId}")
    public ResponseEntity<PagoDTO.IniciarPagoResponse> iniciarPago(
        @PathVariable Long solicitudId,
        Authentication auth
    ) {
        Long ciudadanoId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(pagoService.iniciarPago(solicitudId, ciudadanoId));
    }

    // POST /api/v1/pagos/webhook (público — llamado por PlusPagos)
    @PostMapping("/pagos/webhook")
    public ResponseEntity<Void> webhook(
            @RequestBody(required = false) PagoDTO.WebhookRequest webhook) {
        if (webhook == null) {
            return ResponseEntity.badRequest().build();
        }
        pagoService.procesarWebhook(webhook);
        return ResponseEntity.ok().build();
    }

}
