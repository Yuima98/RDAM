/**
 * pagoService.js
 *
 * Encapsula la llamada a POST /pagos/iniciar/:solicitudId
 *
 * Response (IniciarPagoResponse):
 *   pasarelaUrl         → URL del form POST destino (PlusPagos)
 *   comercio            → merchantGuid ya encriptado
 *   transaccionComercioId
 *   monto               → encriptado en Base64
 *   callbackSuccess     → encriptado
 *   callbackCancel      → encriptado
 *   urlSuccess          → encriptado
 *   urlError            → encriptado
 *   informacion         → encriptado
 *
 * El frontend recibe los campos ya encriptados por el backend (AES-256-CBC).
 * Solo construye el form POST con esos valores — no encripta nada en el cliente.
 */

import axiosClient from './axiosClient';

const pagoService = {
  iniciarPago: (solicitudId) =>
    axiosClient.post(`/pagos/iniciar/${solicitudId}`).then((r) => r.data),
};

export default pagoService;