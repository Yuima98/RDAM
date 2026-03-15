/**
 * adminService.js
 *
 * Encapsula las llamadas HTTP del portal interno.
 *
 * listarUsuarios():
 *   GET /admin/usuarios
 *   Devuelve UserResponse[]: { id, email, role, circunscripcionId, activo, createdAt }
 *
 * crearUsuario():
 *   POST /admin/usuarios
 *   Body: { email, password, role, circunscripcionId? }
 *   Reglas del backend:
 *     - operator → circunscripcionId obligatorio
 *     - admin    → circunscripcionId debe ser null
 *
 * actualizarEstado():
 *   PATCH /admin/usuarios/:id/estado
 *   Body: { activo: boolean }
 *   Devuelve 204 sin body
 */

// @ts-nocheck

import axiosClient from './axiosClient';

const adminService = {
  listarUsuarios: () =>
    axiosClient.get('/admin/usuarios').then((r) => r.data),

  crearUsuario: ({ email, password, role, circunscripcionId }) =>
    axiosClient.post('/admin/usuarios', { email, password, role, circunscripcionId }).then((r) => r.data),

  actualizarEstado: (userId, activo) =>
    axiosClient.patch(`/admin/usuarios/${userId}/estado`, { activo }),
};

export default adminService;