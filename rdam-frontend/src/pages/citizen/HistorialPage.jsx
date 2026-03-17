/**
 * HistorialPage.jsx
 *
 * Lista paginada de todas las solicitudes del ciudadano autenticado.
 *
 * Funcionalidades:
 *   - Filtro por estado (todos / pendiente_pago / pagada / publicada / cancelada)
 *   - Paginación con controles anterior/siguiente
 *   - Click en fila → navega a /ciudadano/tramites/:id
 *   - Skeleton de carga y empty state
 *
 * Endpoint: GET /api/v1/solicitudes?estado=&page=1&size=10
 * Response:  { data: ListItem[], pagination: { page, size, total } }
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import solicitudService from '../../api/solicitudService';
import Badge from '../../components/ui/Badge';

const ESTADOS = [
  { value: '',               label: 'Todos'             },
  { value: 'pendiente_pago', label: 'Pendiente de pago' },
  { value: 'pagada',         label: 'Pagada'            },
  { value: 'publicada',      label: 'Publicada'         },
  { value: 'publicada_vencida', label: 'Publicado vencido' },
  { value: 'vencida',        label: 'Pago expirado'     },
  { value: 'cancelada',      label: 'Cancelada'         },
];

const PAGE_SIZE = 10;

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
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
      {[60, 130, 120, 70, 90, 90].map((w, i) => (
        <td key={i} style={{ padding: '13px 16px' }}>
          <div style={{ ...shimmer, width: w }} />
        </td>
      ))}
    </tr>
  );
}

export default function HistorialPage() {
  const navigate = useNavigate();

  const [solicitudes,  setSolicitudes]  = useState([]);
  const [pagination,   setPagination]   = useState({ page: 1, size: PAGE_SIZE, total: 0 });
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState('');

  const fetchData = (page, estado) => {
    setIsLoading(true);
    setError('');
    solicitudService.listar({ page, size: PAGE_SIZE, estado: estado || undefined })
      .then((data) => {
        setSolicitudes(data.data);
        setPagination(data.pagination);
      })
      .catch((err) => setError(err.message ?? 'Error al cargar trámites.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchData(1, ''); }, []);

  const handleFiltro = (estado) => {
    setEstadoFiltro(estado);
    fetchData(1, estado);
  };

  const handlePage = (newPage) => fetchData(newPage, estadoFiltro);

  const totalPages = Math.ceil(pagination.total / PAGE_SIZE) || 1;

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Encabezado */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
          Mis trámites
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          {pagination.total > 0
            ? `${pagination.total} trámite${pagination.total !== 1 ? 's' : ''} en total`
            : 'Historial de solicitudes'}
        </p>
      </div>

      {/* Filtros por estado */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {ESTADOS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleFiltro(value)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all .12s',
              background: estadoFiltro === value ? 'var(--primary)' : 'var(--gray-100)',
              color:      estadoFiltro === value ? '#fff'           : 'var(--gray-600)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div style={{
        background: '#fff', border: '1px solid var(--gray-200)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
      }}>
        {error ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--accent)', fontSize: 13 }}>
            {error}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                {['N° Trámite', 'CUIL consultado', 'Circunscripción', 'Estado', 'Creada', 'Actualizada'].map((h) => (
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
                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
              ) : solicitudes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6 }}>
                      No hay trámites{estadoFiltro
                        ? ` con estado "${ESTADOS.find(e => e.value === estadoFiltro)?.label}"`
                        : ''}
                    </div>
                    {!estadoFiltro && (
                      <button
                        onClick={() => navigate('/ciudadano/nueva')}
                        style={{
                          marginTop: 12, padding: '8px 18px',
                          background: 'var(--primary)', color: '#fff',
                          border: 'none', borderRadius: 'var(--radius-sm)',
                          fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Nueva solicitud
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                solicitudes.map((s, i) => (
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
                    <td style={{ padding: '13px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--gray-500)' }}>
                      {s.nroTramite}
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
                    <td style={{ padding: '13px 16px', fontSize: 12.5, color: 'var(--gray-500)' }}>
                      {formatDate(s.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {!isLoading && !error && pagination.total > PAGE_SIZE && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 16, fontSize: 13, color: 'var(--gray-500)',
        }}>
          <span>Página {pagination.page} de {totalPages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handlePage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
                border: '1px solid var(--gray-200)', cursor: pagination.page <= 1 ? 'default' : 'pointer',
                background: pagination.page <= 1 ? 'var(--gray-100)' : '#fff',
                color:      pagination.page <= 1 ? 'var(--gray-400)' : 'var(--gray-700)',
              }}
            >
              ← Anterior
            </button>
            <button
              onClick={() => handlePage(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
                border: '1px solid var(--gray-200)', cursor: pagination.page >= totalPages ? 'default' : 'pointer',
                background: pagination.page >= totalPages ? 'var(--gray-100)' : '#fff',
                color:      pagination.page >= totalPages ? 'var(--gray-400)' : 'var(--gray-700)',
              }}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

    </div>
  );
}