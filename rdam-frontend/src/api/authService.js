/**
 * authService.js
 *
 * Encapsula todas las llamadas HTTP relacionadas a autenticación.
 *
 * DECISIONES DE DISEÑO:
 * ─────────────────────
 * Cada función retorna directamente response.data para que los
 * componentes trabajen con el payload del backend sin capas extra.
 *
 * register():
 *   - Llama a POST /auth/register
 *   - Con perfil dev el backend devuelve { message, otpCode }
 *   - Con perfil prod devuelve 201 vacío
 *   - Retornamos response.data para que LoginPage pueda leer otpCode
 *     en desarrollo y auto-completar el input OTP.
 *
 * verifyOtp():
 *   - Llama a POST /auth/verify-otp
 *   - Devuelve { accessToken, expiresAt, role }
 *
 * login():
 *   - Llama a POST /auth/login (solo operadores/admins)
 *   - Devuelve { accessToken, expiresAt, role }
 *
 * logout():
 *   - Llama a POST /auth/logout
 *   - El backend devuelve 204 sin body (el token no se invalida server-side,
 *     la app descarta el token localmente desde AuthContext)
 */

import axiosClient from './axiosClient';

const authService = {
  /**
   * Registra un ciudadano nuevo O reenvía OTP si ya existe.
   * @param {string} email
   * @returns {Promise<{ message: string, otpCode?: string }>}
   */
  register: (email) =>
    axiosClient.post('/auth/register', { email }).then((r) => r.data),

  /**
   * Valida el OTP y retorna el JWT de sesión.
   * @param {string} email
   * @param {string} otpCode
   * @returns {Promise<{ accessToken: string, expiresAt: string, role: string }>}
   */
  verifyOtp: (email, otpCode) =>
    axiosClient.post('/auth/verify-otp', { email, otpCode }).then((r) => r.data),

  /**
   * Login con email + password (solo operadores y admins).
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ accessToken: string, expiresAt: string, role: string }>}
   */
  login: (email, password) =>
    axiosClient.post('/auth/login', { email, password }).then((r) => r.data),

  /**
   * Cierra la sesión en el servidor (204 sin body).
   * El token se descarta localmente desde AuthContext.
   */
  logout: () =>
    axiosClient.post('/auth/logout'),
};

export default authService;
