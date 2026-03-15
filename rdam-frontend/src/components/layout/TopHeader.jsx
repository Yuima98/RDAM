/**
 * TopHeader.jsx
 *
 * Barra superior fija presente en todos los portales (ciudadano e interno).
 * NO aparece en LandingPage ni LoginPage — esas páginas tienen su propio header.
 *
 * Props:
 *   - portalLabel: string  → "Portal Ciudadano" | "Portal Interno"
 *
 * Obtiene user del AuthContext para mostrar el avatar con inicial y el rol.
 * El botón de logout llama a AuthContext.logout() y redirige a /login.
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABEL = {
  citizen:  'Ciudadano',
  operator: 'Operador',
  admin:    'Administrador',
};

export default function TopHeader({ portalLabel = '' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <header style={{
      background:    'var(--primary-dark)',
      color:         '#fff',
      height:        64,
      display:       'flex',
      alignItems:    'center',
      padding:       '0 24px',
      gap:           16,
      position:      'sticky',
      top:           0,
      zIndex:        100,
      boxShadow:     'var(--shadow)',
    }}>
      {/* Logo + badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
        {/* Ícono balanza */}
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
          <circle cx="19" cy="19" r="18" fill="rgba(255,255,255,.12)"
            stroke="rgba(255,255,255,.3)" strokeWidth="1"/>
          <line x1="19" y1="9"  x2="19" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <line x1="9"  y1="12" x2="29" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M9 12 L6 20 H12 Z"  fill="rgba(255,255,255,.8)"/>
          <path d="M29 12 L26 20 H32 Z" fill="rgba(255,255,255,.8)"/>
          <line x1="14" y1="30" x2="24" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Divisor */}
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,.25)' }} />

        {/* Badge RDAM */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,.1)',
          border: '1px solid rgba(255,255,255,.2)',
          borderRadius: 8, padding: '6px 12px',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              RDAM
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.6)' }}>
              Poder Judicial · Santa Fe
            </div>
          </div>
        </div>

        {portalLabel && (
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginLeft: 4 }}>
            {portalLabel}
          </span>
        )}
      </div>

      {/* Usuario + logout */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 13, color: '#fff', flexShrink: 0,
          }}>
            {initial}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>
              {user.email}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>
              {ROLE_LABEL[user.role] ?? user.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              marginLeft: 8, background: 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.2)',
              borderRadius: 'var(--radius-sm)', padding: '6px 12px',
              color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Salir
          </button>
        </div>
      )}
    </header>
  );
}
