/**
 * AuthContext.jsx
 *
 * Estado global de autenticación. Provee a toda la app:
 *   - user      → { id, email, role } extraído del JWT
 *   - token     → string JWT crudo
 *   - isLoading → true mientras se hidrata desde localStorage
 *   - login()   → guarda token, actualiza estado
 *   - logout()  → limpia token local, redirige a /login
 *
 * DECISIONES DE DISEÑO:
 * ─────────────────────
 * 1. Persistencia en localStorage bajo la clave "rdam_token".
 *    Al montar, si hay token guardado, lo decodificamos para
 *    reconstruir el estado sin necesidad de un request al backend.
 *    (El JWT contiene email, role, sub=userId — ver JwtService.java)
 *
 * 2. Decodificación manual del JWT (sin librería).
 *    El payload del JWT es Base64url → JSON. Lo decodificamos con
 *    atob() nativo. No necesitamos verificar la firma en el cliente
 *    (eso lo hace el backend en cada request).
 *
 * 3. Escucha el evento global "auth:expired" que dispara axiosClient
 *    cuando recibe un 401. Así el logout automático no requiere
 *    que cada servicio llame a logout() manualmente.
 *
 * 4. isLoading evita que el router renderice rutas protegidas antes
 *    de que termine la hidratación del token (evita flash de /login).
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../api/authService';

const AuthContext = createContext(null);

// ── Helpers ────────────────────────────────────────────────────────────────

/** Decodifica el payload de un JWT sin verificar firma. */
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    // Base64url → Base64 estándar → JSON
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Construye el objeto user a partir del payload del JWT. */
function userFromToken(token) {
  const payload = decodeJwt(token);
  if (!payload) return null;
  return {
    id:               Number(payload.sub),
    email:            payload.email,
    role:             payload.role,
    circunscripcionId: payload.circunscripcionId ?? null,
  };
}

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [token,     setToken]     = useState(null);
  const [user,      setUser]      = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hidratar desde localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem('rdam_token');
    if (saved) {
      const decoded = userFromToken(saved);
      if (decoded) {
        setToken(saved);
        setUser(decoded);
      } else {
        // Token corrupto → limpiar
        localStorage.removeItem('rdam_token');
      }
    }
    setIsLoading(false);
  }, []);

  // Escuchar evento auth:expired disparado por axiosClient
  useEffect(() => {
    const handleExpired = () => logout();
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  /**
   * Guarda el token recibido del backend y actualiza el estado.
   * Lo llaman LoginPage y el paso de verify-otp.
   * @param {string} accessToken
   */
  const login = useCallback((accessToken) => {
    localStorage.setItem('rdam_token', accessToken);
    setToken(accessToken);
    setUser(userFromToken(accessToken));
  }, []);

  /**
   * Limpia el estado local. El backend no invalida el token (limitación conocida).
   * Intentamos llamar a /auth/logout de todas formas, pero no bloqueamos en error.
   */
  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* ignorar */ }
    localStorage.removeItem('rdam_token');
    setToken(null);
    setUser(null);
  }, []);

  const value = { user, token, isLoading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * useAuth()
 * Acceso al contexto de autenticación desde cualquier componente.
 * Lanza error si se usa fuera de <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
