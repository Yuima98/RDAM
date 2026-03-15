/**
 * CitizenHomePage.jsx
 *
 * Pantalla de inicio del portal ciudadano.
 *
 * Muestra:
 *   1. Saludo personalizado con el email del usuario (del AuthContext).
 *   2. Tres tarjetas de acción rápida: Nueva solicitud, Mis trámites, Ayuda.
 *   3. Tabla con las últimas 5 solicitudes del ciudadano.
 *      Si no tiene solicitudes aún, muestra un empty state con CTA.
 *
 * Datos:
 *   GET /api/v1/solicitudes?page=1&size=5
 *   Response: { data: ListItem[], pagination: { page, size, total } }
 *
 * Estados de carga:
 *   - isLoading → skeleton de 3 filas
 *   - error     → mensaje inline sin romper la página
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import solicitudService from '../../api/solicitudService';
import Badge from '../../components/ui/Badge';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ── Subcomponentes ─────────────────────────────────────────────────────────

function QuickCard({ icon, title, desc, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        background:    '#fff',
        border:        `1px solid ${accent ? 'rgba(26,91,166,.25)' : 'var(--gray-200)'}`,
        borderRadius:  'var(--radius)',
        padding:       '20px 22px',
        textAlign:     'left',
        cursor:        'pointer',
        transition:    'box-shadow .15s, transform .15s',
        display:       'flex',
        flexDirection: 'column',
        gap:           10,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: accent ? 'var(--primary-xlight)' : 'var(--gray-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 3 }}>
          {title}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--gray-500)', lineHeight: 1.5 }}>
          {desc}
        </div>
      </div>
    </button>
  );
}

function SkeletonRow() {
  const shimmer = {
    background: 'linear-gradient(90deg, var(--gray-100) 25%, var(--gray-200) 50%, var(--gray-100) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s infinite',
    borderRadius: 4, height: 14,
  };
  return (
    <tr>
      {[80, 120, 110, 70, 90].map((w, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div style={{ ...shimmer, width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ── CitizenHomePage ────────────────────────────────────────────────────────

export default function CitizenHomePage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [solicitudes, setSolicitudes] = useState([]);
  const [total,       setTotal]       = useState(0);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => {
    solicitudService.listar({ page: 1, size: 5 })
      .then((data) => {
        setSolicitudes(data.data);
        setTotal(data.pagination.total);
      })
      .catch((err) => setError(err.message ?? 'Error al cargar solicitudes.'))
      .finally(() => setIsLoading(false));
  }, []);

  const nombreVisible = user?.email?.split('@')[0] ?? 'ciudadano';

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>

      {/* Animación shimmer */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Saludo */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
          Bienvenido, {nombreVisible}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          Desde acá podés gestionar tus certificados de libre deuda alimentaria.
        </p>
      </div>

      {/* Acciones rápidas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 32,
      }}>
        <QuickCard
          accent
          onClick={() => navigate('/ciudadano/nueva')}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="var(--primary)" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9"  y1="15" x2="15" y2="15"/>
            </svg>
          }
          title="Nueva solicitud"
          desc="Solicitá un certificado de libre deuda."
        />
        <QuickCard
          onClick={() => navigate('/ciudadano/tramites')}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="var(--gray-600)" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          }
          title="Mis trámites"
          desc={total > 0 ? `Tenés ${total} trámite${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}.` : 'Consultá el estado de tus solicitudes.'}
        />
        <QuickCard
          onClick={() => navigate('/ciudadano/ayuda')}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="var(--gray-600)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
          title="Centro de ayuda"
          desc="Preguntas frecuentes y guías."
        />
      </div>

      {/* Últimas solicitudes */}
      <div style={{
        background: '#fff', border: '1px solid var(--gray-200)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
      }}>
        {/* Header de la tabla */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--gray-100)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>
            Últimas solicitudes
          </div>
          {total > 5 && (
            <button
              onClick={() => navigate('/ciudadano/tramites')}
              style={{
                background: 'none', border: 'none', color: 'var(--primary)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Ver todas →
            </button>
          )}
        </div>

        {/* Tabla */}
        {isLoading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <SkeletonRow /><SkeletonRow /><SkeletonRow />
            </tbody>
          </table>
        ) : error ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--accent)', fontSize: 13 }}>
            {error}
          </div>
        ) : solicitudes.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'var(--gray-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="var(--gray-400)" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9"  y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>
              Todavía no tenés solicitudes
            </div>
            <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 18 }}>
              Iniciá tu primer trámite de certificado de libre deuda.
            </p>
            <button
              onClick={() => navigate('/ciudadano/nueva')}
              style={{
                padding: '9px 20px', borderRadius: 'var(--radius-sm)',
                background: 'var(--primary)', color: '#fff', border: 'none',
                fontFamily: 'var(--font)', fontSize: 13.5, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Nueva solicitud
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                {['#', 'CUIL consultado', 'Circunscripción', 'Estado', 'Fecha'].map((h) => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 11.5, fontWeight: 700, color: 'var(--gray-500)',
                    textTransform: 'uppercase', letterSpacing: '.05em',
                    borderBottom: '1px solid var(--gray-100)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s, i) => (
                <tr
                  key={s.solicitudId}
                  onClick={() => navigate(`/ciudadano/tramites/${s.solicitudId}`)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: i < solicitudes.length - 1 ? '1px solid var(--gray-100)' : 'none',
                    transition: 'background .1s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--gray-500)' }}>
                    #{s.solicitudId}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 13 }}>
                    {s.cuilConsultado}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--gray-700)' }}>
                    {s.circunscripcion}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge estado={s.estado} />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12.5, color: 'var(--gray-500)' }}>
                    {formatDate(s.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}