/**
 * guards.jsx
 *
 * Componentes de guardia para React Router v6.
 *
 * ProtectedRoute:
 *   Envuelve rutas que requieren autenticación.
 *   Si no hay token → redirige a /login preservando la URL original
 *   en `state.from` para poder volver después del login.
 *   Mientras isLoading=true muestra null (evita flash de redirección).
 *
 * RoleRoute:
 *   Envuelve rutas que requieren un rol específico.
 *   Recibe `allowedRoles` (array de strings).
 *   Si el rol del usuario no está en la lista → redirige a /no-autorizado.
 *
 * EJEMPLO DE USO en AppRouter.jsx:
 *
 *   <Route element={<ProtectedRoute />}>
 *     <Route element={<RoleRoute allowedRoles={['citizen']} />}>
 *       <Route path="/ciudadano" element={<CitizenHomePage />} />
 *     </Route>
 *   </Route>
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── ProtectedRoute ─────────────────────────────────────────────────────────

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Esperamos hidratación antes de decidir
  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// ── RoleRoute ──────────────────────────────────────────────────────────────

export function RoleRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return <Outlet />;
}
