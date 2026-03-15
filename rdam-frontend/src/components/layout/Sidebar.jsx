/**
 * Sidebar.jsx
 *
 * Barra lateral de navegación. Recibe `portal` ('citizen' | 'internal').
 * Para el portal interno, renderiza condicionalmente la sección
 * "Administración" y el link a KPI solo cuando role === 'admin'.
 *
 * Usa NavLink de React Router para aplicar la clase `active` automáticamente
 * según la ruta actual — reemplaza el sistema manual de data-view de la maqueta.
 */

import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ── Estilos inline reutilizables ───────────────────────────────────────────

const sectionLabel = {
  fontSize: 10, fontWeight: 700, letterSpacing: '.1em',
  textTransform: 'uppercase', color: 'var(--gray-400)',
  padding: '8px 20px 6px', marginTop: 8, display: 'block',
};

function navStyle({ isActive }) {
  return {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 20px',
    color:       isActive ? 'var(--primary)'  : 'var(--gray-600)',
    background:  isActive ? 'var(--primary-xlight)' : 'transparent',
    borderLeft:  isActive ? '3px solid var(--primary)' : '3px solid transparent',
    fontWeight:  isActive ? 600 : 500,
    fontSize:    13.5,
    cursor:      'pointer',
    textDecoration: 'none',
    transition:  'all .12s',
  };
}

// ── Íconos SVG inline (los mismos de la maqueta) ──────────────────────────

const Icon = ({ d, extra }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: .8 }}>
    <path d={d} {...extra}/>
  </svg>
);

const HomeIcon    = () => <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" extra={{ strokeLinejoin:'round' }}/>;
const FileAddIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <line x1="12" y1="18" x2="12" y2="12"/>
    <line x1="9"  y1="15" x2="15" y2="15"/>
  </svg>
);
const ListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const HelpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const DashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3"  y="3"  width="7" height="7"/>
    <rect x="14" y="3"  width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3"  y="14" width="7" height="7"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const KpiIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
  </svg>
);
const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

// ── Sidebar ciudadano ──────────────────────────────────────────────────────

function CitizenSidebar() {
  return (
    <>
      <span style={sectionLabel}>Mi cuenta</span>
      <NavLink to="/ciudadano"          style={navStyle} end><HomeIcon />Inicio</NavLink>
      <NavLink to="/ciudadano/nueva"    style={navStyle}><FileAddIcon />Nueva solicitud</NavLink>
      <NavLink to="/ciudadano/tramites" style={navStyle}><ListIcon />Mis trámites</NavLink>
      <span style={sectionLabel}>Soporte</span>
      <NavLink to="/ciudadano/ayuda"    style={navStyle}><HelpIcon />Centro de ayuda</NavLink>
    </>
  );
}

// ── Sidebar interno (operador + admin) ─────────────────────────────────────

function InternalSidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <span style={sectionLabel}>Operaciones</span>
      <NavLink to="/interno/dashboard"   style={navStyle}><DashIcon />Dashboard</NavLink>
      <NavLink to="/interno/solicitudes" style={navStyle}><ClockIcon />Solicitudes activas</NavLink>
      <NavLink to="/interno/historial"   style={navStyle}><ListIcon />Historial</NavLink>

      {isAdmin && (
        <>
          <span style={sectionLabel}>Análisis</span>
          <NavLink to="/interno/kpi" style={navStyle}><KpiIcon />Panel KPI</NavLink>
          <span style={sectionLabel}>Administración</span>
          <NavLink to="/admin/usuarios" style={navStyle}><UsersIcon />Gestión de usuarios</NavLink>
        </>
      )}
    </>
  );
}

// ── Sidebar principal ──────────────────────────────────────────────────────

export default function Sidebar({ portal }) {
  return (
    <aside style={{
      width: 240, background: '#fff',
      borderRight: '1px solid var(--gray-200)',
      flexShrink: 0, padding: '20px 0',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 64,
      height: 'calc(100vh - 64px)', overflowY: 'auto',
    }}>
      {portal === 'citizen' ? <CitizenSidebar /> : <InternalSidebar />}
    </aside>
  );
}
