/**
 * solicitudService.js
 *
 * Encapsula todas las llamadas HTTP relacionadas a solicitudes.
 *
 * Portal ciudadano:
 *   listar()                 GET /solicitudes
 *   getById()                GET /solicitudes/:id
 *   crear()                  POST /solicitudes
 *   listarCircunscripciones() GET /circunscripciones
 *
 * Portal interno (operador/admin):
 *   listarInterno()          GET /interno/solicitudes
 *   getByIdInterno()         GET /interno/solicitudes/:id
 */

import axiosClient from './axiosClient';

const solicitudService = {

  // ── Ciudadano ──────────────────────────────────────────────────────────

  listar: ({ estado, page = 1, size = 10 } = {}) => {
    const params = { page, size };
    if (estado) params.estado = estado;
    return axiosClient.get('/solicitudes', { params }).then((r) => r.data);
  },

  getById: (solicitudId) =>
    axiosClient.get(`/solicitudes/${solicitudId}`).then((r) => r.data),

  crear: ({ cuilConsultado, circunscripcionId, emailContacto }) =>
    axiosClient
      .post('/solicitudes', { cuilConsultado, circunscripcionId, emailContacto })
      .then((r) => r.data),

  listarCircunscripciones: () =>
    axiosClient.get('/circunscripciones').then((r) => r.data),

  // ── Interno ────────────────────────────────────────────────────────────

  listarInterno: ({ estado, cuil, page = 1, size = 20 } = {}) => {
    const params = { page, size };
    if (estado) params.estado = estado;
    if (cuil)   params.cuil   = cuil;
    return axiosClient.get('/interno/solicitudes', { params }).then((r) => r.data);
  },

  getByIdInterno: (solicitudId) =>
    axiosClient.get(`/interno/solicitudes/${solicitudId}`).then((r) => r.data),

};

export default solicitudService;