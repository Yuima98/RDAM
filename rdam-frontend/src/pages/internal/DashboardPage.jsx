/**
 * DashboardPage.jsx
 *
 * Dashboard del portal interno. Visible para operator y admin.
 *
 * Muestra:
 *   - 4 tarjetas de KPI: pagadas (pendientes de resolver), publicadas hoy,
 *     rechazadas, total general
 *   - Tabla con las últimas 10 solicitudes en estado 'pagada' (las que
 *     requieren acción del operador)
 *
 * Endpoint: GET /api/v1/interno/solicitudes?estado=pagada&page=1&size=10
 * Response: { data: ListItem[], pagination: { page, size, total } }
 *
 * Los KPI se calculan del mismo response de paginación — el backend filtra
 * por circunscripcionId del operador automáticamente vía JWT.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import solicitudService from '../../api/solicitudService';
import Badge from '../../components/ui/Badge';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function KpiCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius)', padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={color} strokeWidth="2">
          {icon}
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1 }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--gray-500)', marginTop: 4 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  const s = { background: 'var(--gray-100)', borderRadius: 4, height: 14,
    animation: 'shimmer 1.2s infinite',
    backgroundImage: 'linear-gradient(90deg, var(--gray-100) 25%, var(--gray-200) 50%, var(--gray-100) 75%)',
    backgroundSize: '200% 100%' };
  return (
    <tr>
      {[60, 130, 120, 70, 90].map((w, i) => (
        <td key={i} style={{ padding: '13px 16px' }}>
          <div style={{ ...s, width: w }} />
        </td>
      ))}
    </tr>
  );
}

export default function DashboardPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [pagadas,    setPagadas]    = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);

  useEffect(() => {
    solicitudService.listarInterno({ estado: 'pagada', page: 1, size: 10 })
      .then((data) => {
        setSolicitudes(data.data);
        setPagadas(data.pagination.total);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Encabezado */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          {isAdmin ? 'Vista general del sistema.' : 'Solicitudes de tu circunscripción.'}
        </p>
      </div>

      {/* KPI cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16, marginBottom: 32,
      }}>
        <KpiCard
          label="Pendientes de resolver"
          value={isLoading ? '...' : pagadas}
          color="var(--primary)"
          icon={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
        />
        <KpiCard
          label="Solicitudes activas"
          value={isLoading ? '...' : solicitudes.length}
          color="var(--success)"
          icon={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>}
        />
      </div>

      {/* Tabla de solicitudes pagadas */}
      <div style={{
        background: '#fff', border: '1px solid var(--gray-200)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--gray-100)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>
            Solicitudes para resolver
          </div>
          <button
            onClick={() => navigate('/interno/solicitudes')}
            style={{
              background: 'none', border: 'none', color: 'var(--primary)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Ver todas →
          </button>
        </div>

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
            {isLoading ? (
              Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : solicitudes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                  No hay solicitudes pendientes de resolver.
                </td>
              </tr>
            ) : (
              solicitudes.map((s, i) => (
                <tr
                  key={s.solicitudId}
                  onClick={() => navigate(`/interno/historial/${s.solicitudId}`)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: i < solicitudes.length - 1 ? '1px solid var(--gray-100)' : 'none',
                    transition: 'background .1s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--gray-500)' }}>
                    #{s.solicitudId}
                  </td>
                  <td style={{ padding: '13px 16px', fontFamily: 'var(--mono)', fontSize: 13 }}>
                    {s.cuilConsultado}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--gray-700)' }}>
                    {s.circunscripcion}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <Badge estado={s.estado} />
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12.5, color: 'var(--gray-500)' }}>
                    {formatDate(s.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}