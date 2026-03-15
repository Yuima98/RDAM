/**
 * AppRouter.jsx
 *
 * Define la estructura de rutas completa de la aplicación.
 *
 * ESTRUCTURA:
 * ───────────
 * /                          → LandingPage         (público)
 * /login                     → LoginPage           (público)
 * /pago/exitoso              → PagoExitosoPage     (público — redirect desde Pluspagos)
 * /pago/error                → PagoErrorPage       (público — redirect desde Pluspagos)
 * /no-autorizado             → página informativa
 *
 * [ProtectedRoute]
 *   [RoleRoute: citizen]
 *     /ciudadano             → CitizenHomePage
 *     /ciudadano/nueva       → NuevaSolicitudPage
 *     /ciudadano/tramites    → HistorialPage
 *     /ciudadano/tramites/:id → DetalleSolicitudPage
 *     /ciudadano/ayuda       → AyudaPage
 *
 *   [RoleRoute: operator, admin]
 *     /interno/dashboard     → DashboardPage
 *     /interno/solicitudes   → SolicitudesActivasPage
 *     /interno/historial     → HistorialInternoPage
 *     /interno/historial/:id → DetalleInternoPage
 *
 *   [RoleRoute: admin]
 *     /interno/kpi           → KpiPage
 *     /admin/usuarios        → GestionUsuariosPage
 *
 * NOTA SOBRE LAYOUTS:
 * Los layouts (AppLayout con sidebar) se aplican como wrappers dentro
 * de cada grupo de rutas usando <Outlet /> de React Router v6.
 * Esto evita re-montar el layout al navegar entre páginas del mismo portal.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleRoute } from './guards';

// Layouts
import CitizenLayout  from '../components/layout/CitizenLayout';
import InternalLayout from '../components/layout/InternalLayout';

// Páginas públicas
import LandingPage    from '../pages/public/LandingPage';
import LoginPage      from '../pages/public/LoginPage';
import PagoExitosoPage from '../pages/public/PagoExitosoPage';
import PagoErrorPage   from '../pages/public/PagoErrorPage';

// Páginas ciudadano
import CitizenHomePage       from '../pages/citizen/CitizenHomePage';
import NuevaSolicitudPage    from '../pages/citizen/NuevaSolicitudPage';
import HistorialPage         from '../pages/citizen/HistorialPage';
import DetalleSolicitudPage  from '../pages/citizen/DetalleSolicitudPage';
import AyudaPage             from '../pages/citizen/AyudaPage';

// Páginas internas
import DashboardPage         from '../pages/internal/DashboardPage';
import SolicitudesActivasPage from '../pages/internal/SolicitudesActivasPage';
import HistorialInternoPage  from '../pages/internal/HistorialInternoPage';
import DetalleInternoPage    from '../pages/internal/DetalleInternoPage';
import KpiPage               from '../pages/internal/KpiPage';
import GestionUsuariosPage   from '../pages/internal/GestionUsuariosPage';

// Página genérica de error de autorización
function NoAutorizadoPage() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        Acceso no autorizado
      </h2>
      <p style={{ color: 'var(--gray-500)' }}>
        No tenés permisos para acceder a esta página.
      </p>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Rutas públicas ─────────────────────────────────────────── */}
        <Route path="/"              element={<LandingPage />} />
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/pago/exitoso"  element={<PagoExitosoPage />} />
        <Route path="/pago/error"    element={<PagoErrorPage />} />
        <Route path="/no-autorizado" element={<NoAutorizadoPage />} />

        {/* ── Rutas protegidas ───────────────────────────────────────── */}
        <Route element={<ProtectedRoute />}>

          {/* Portal ciudadano */}
          <Route element={<RoleRoute allowedRoles={['citizen']} />}>
            <Route element={<CitizenLayout />}>
              <Route path="/ciudadano"           element={<CitizenHomePage />} />
              <Route path="/ciudadano/nueva"     element={<NuevaSolicitudPage />} />
              <Route path="/ciudadano/tramites"  element={<HistorialPage />} />
              <Route path="/ciudadano/tramites/:id" element={<DetalleSolicitudPage />} />
              <Route path="/ciudadano/ayuda"     element={<AyudaPage />} />
            </Route>
          </Route>

          {/* Portal interno: operador y admin */}
          <Route element={<RoleRoute allowedRoles={['operator', 'admin']} />}>
            <Route element={<InternalLayout />}>
              <Route path="/interno/dashboard"      element={<DashboardPage />} />
              <Route path="/interno/solicitudes"    element={<SolicitudesActivasPage />} />
              <Route path="/interno/historial"      element={<HistorialInternoPage />} />
              <Route path="/interno/historial/:id"  element={<DetalleInternoPage />} />

              {/* Solo admin */}
              <Route element={<RoleRoute allowedRoles={['admin']} />}>
                <Route path="/interno/kpi"     element={<KpiPage />} />
                <Route path="/admin/usuarios"  element={<GestionUsuariosPage />} />
              </Route>
            </Route>
          </Route>

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}