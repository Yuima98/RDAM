/**
 * axiosClient.js
 *
 * Instancia central de Axios para toda la app.
 *
 * DECISIONES DE DISEÑO:
 * ─────────────────────
 * 1. baseURL apunta a http://localhost:8080/api/v1 (puerto por defecto del backend Spring Boot).
 *    En producción se reemplaza por variable de entorno VITE_API_URL.
 *
 * 2. Request interceptor: adjunta el JWT del localStorage a cada request
 *    como "Authorization: Bearer <token>". Si no hay token, la request
 *    sale sin header (los endpoints públicos no lo necesitan).
 *
 * 3. Response interceptor: normaliza los errores del backend al shape
 *    { status, error, message, details } que devuelve GlobalExceptionHandler.java.
 *    Así cada llamada en los servicios puede hacer .catch(e => e.message)
 *    sin conocer la estructura interna del error HTTP.
 *
 * 4. El interceptor de respuesta detecta 401 y dispara un evento global
 *    "auth:expired" para que AuthContext pueda hacer logout sin importar
 *    desde qué servicio vino el error (evita acoplamiento circular).
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: adjuntar JWT ──────────────────────────────────────
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('rdam_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: normalizar errores ───────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status   = error.response?.status;
    const data     = error.response?.data;

    // El backend devuelve { status, error, message, details? }
    // Si no hay response (red caída, timeout), armamos un error genérico.
    const normalized = {
      status:  status  ?? 0,
      message: data?.message ?? 'Error de conexión. Revisá tu red.',
      details: data?.details ?? [],
    };

    // Token expirado o inválido → notificar al AuthContext para logout
    if (status === 401) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    return Promise.reject(normalized);
  }
);

export default axiosClient;
