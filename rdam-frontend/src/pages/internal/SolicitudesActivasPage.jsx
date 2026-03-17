/**
 * SolicitudesActivasPage.jsx
 *
 * Lista de solicitudes en estado 'pagada' — las que el operador debe resolver.
 * Por defecto filtra estado=pagada. Permite buscar por CUIL.
 *
 * Endpoint: GET /api/v1/interno/solicitudes?estado=pagada&cuil=&page=1&size=20
 * El backend filtra automáticamente por la circunscripción del operador (vía JWT).
 * Para admin muestra todas las circunscripciones.
 *
 * Click en fila → /interno/historial/:id (DetalleInternaPage)
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import solicitudService from '../../api/solicitudService';
import Badge from '../../components/ui/Badge';

const PAGE_SIZE = 20;

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function SkeletonRow() {
  const s = {
    background: 'var(--gray-100)', borderRadius: 4, height: 14,
    backgroundImage: 'linear-gradient(90deg, var(--gray-100) 25%, var(--gray-200) 50%, var(--gray-100) 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.2s infinite',
  };
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

export default function SolicitudesActivasPage() {
  const navigate = useNavigate();

  const [solicitudes,  setSolicitudes]  = useState([]);
  const [pagination,   setPagination]   = useState({ page: 1, size: PAGE_SIZE, total: 0 });
  const [cuil,         setCuil]         = useState('');
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState('');
  const searchRef = useRef(null);

  const fetchData = (page, cuilFiltro) => {
    setIsLoading(true);
    setError('');
    solicitudService.listarInterno({ estado: 'pagada', cuil: cuilFiltro || undefined, page, size: PAGE_SIZE })
      .then((data) => {
        setSolicitudes(data.data);
        setPagination(data.pagination);
      })
      .catch((err) => setError(err.message ?? 'Error al cargar solicitudes.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchData(1, ''); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData(1, cuil);
  };

  const handlePage = (newPage) => fetchData(newPage, cuil);

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
          Solicitudes activas
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          {pagination.total > 0
            ? `${pagination.total} solicitud${pagination.total !== 1 ? 'es' : ''} pendiente${pagination.total !== 1 ? 's' : ''} de resolución`
            : 'Solicitudes en estado pagada'}
        </p>
      </div>

      {/* Buscador por CUIL */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          ref={searchRef}
          type="text"
          placeholder="Buscar por CUIL (XX-XXXXXXXX-X)"
          value={cuil}
          onChange={(e) => setCuil(e.target.value)}
          style={{
            flex: 1, padding: '9px 14px',
            border: '1.5px solid var(--gray-300)', borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--mono)', fontSize: 13.5, outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '9px 20px', borderRadius: 'var(--radius-sm)',
            background: 'var(--primary)', color: '#fff', border: 'none',
            fontFamily: 'var(--font)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Buscar
        </button>
        {cuil && (
          <button
            type="button"
            onClick={() => { setCuil(''); fetchData(1, ''); }}
            style={{
              padding: '9px 16px', borderRadius: 'var(--radius-sm)',
              background: '#fff', color: 'var(--gray-500)',
              border: '1px solid var(--gray-300)',
              fontFamily: 'var(--font)', fontSize: 13.5, cursor: 'pointer',
            }}
          >
            Limpiar
          </button>
        )}
      </form>

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
                {['N° Trámite', 'CUIL consultado', 'Circunscripción', 'Estado', 'Fecha pago'].map((h) => (
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
                  <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-600)' }}>
                      {cuil ? `No se encontraron solicitudes para CUIL "${cuil}"` : 'No hay solicitudes activas.'}
                    </div>
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