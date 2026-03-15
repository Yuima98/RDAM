/**
 * KpiPage.jsx
 *
 * Panel de KPIs para admin. Muestra métricas de performance del sistema
 * calculadas a partir de GET /interno/solicitudes con distintos filtros.
 *
 * No requiere endpoints nuevos — todo se calcula en el frontend
 * con múltiples llamadas paralelas al mismo endpoint.
 *
 * Métricas:
 *   1. Distribución por estado → detectar cuellos de botella
 *   2. Solicitudes por circunscripción → balanceo de carga entre operadores
 *   3. Tasa de resolución → eficiencia operativa (publicadas / pagadas+publicadas)
 *   4. Solicitudes últimos 30 días → tendencia de uso
 */

import { useEffect, useState } from 'react';
import solicitudService from '../../api/solicitudService';

// ── Helpers ────────────────────────────────────────────────────────────────

function pct(n, total) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

// ── Subcomponentes ─────────────────────────────────────────────────────────

function StatCard({ label, value, sublabel, color = 'var(--primary)' }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius)', padding: '20px 24px',
    }}>
      <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sublabel && (
        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>{sublabel}</div>
      )}
    </div>
  );
}

function BarRow({ label, value, total, color }) {
  const width = pct(value, total);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: 'var(--gray-700)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{value} <span style={{ color: 'var(--gray-300)' }}>({width}%)</span></span>
      </div>
      <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${width}%`,
          background: color, borderRadius: 4,
          transition: 'width .6s ease',
        }} />
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 16 }}>
      {children}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--gray-200)',
      borderRadius: 'var(--radius)', padding: '20px 24px',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── KpiPage ────────────────────────────────────────────────────────────────

const ESTADOS_CONFIG = [
  { key: 'pendiente_pago', label: 'Pendiente de pago', color: 'var(--gray-400)' },
  { key: 'pagada',         label: 'Pagada (sin resolver)', color: 'var(--primary)' },
  { key: 'publicada',      label: 'Publicada',        color: 'var(--success)' },
  { key: 'cancelada',      label: 'Cancelada',        color: 'var(--accent)' },
  { key: 'publicada_vencida', label: 'Vencida',       color: 'var(--warning)' },
];

export default function KpiPage() {
  const [data,      setData]      = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Traer todas las solicitudes (sin filtro de estado) — tamaño grande para tener el total
        const [todas, pagadas, publicadas, recientes] = await Promise.all([
          solicitudService.listarInterno({ page: 1, size: 1 }),
          solicitudService.listarInterno({ estado: 'pagada',    page: 1, size: 1 }),
          solicitudService.listarInterno({ estado: 'publicada', page: 1, size: 1 }),
          solicitudService.listarInterno({ estado: 'pagada',    page: 1, size: 100 }),
        ]);

        // Totales por estado
        const [pendientes, canceladas, vencidas] = await Promise.all([
          solicitudService.listarInterno({ estado: 'pendiente_pago',    page: 1, size: 1 }),
          solicitudService.listarInterno({ estado: 'cancelada',         page: 1, size: 1 }),
          solicitudService.listarInterno({ estado: 'publicada_vencida', page: 1, size: 1 }),
        ]);

        // Solicitudes por circunscripción (de las últimas 100 pagadas)
        const circMap = {};
        recientes.data.forEach((s) => {
          const k = s.circunscripcion;
          circMap[k] = (circMap[k] ?? 0) + 1;
        });
        const circunscripciones = Object.entries(circMap)
          .map(([nombre, total]) => ({ nombre, total }))
          .sort((a, b) => b.total - a.total);

        setData({
          total:        todas.pagination.total,
          pagadas:      pagadas.pagination.total,
          publicadas:   publicadas.pagination.total,
          pendientes:   pendientes.pagination.total,
          canceladas:   canceladas.pagination.total,
          vencidas:     vencidas.pagination.total,
          circunscripciones,
        });
      } catch (err) {
        setError(err.message ?? 'Error al cargar métricas.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>
        <div style={{ height: 24, width: 180, borderRadius: 4, background: 'var(--gray-200)', marginBottom: 32 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {Array(4).fill(0).map((_, i) => (
            <div key={i} style={{ height: 100, borderRadius: 'var(--radius)', background: 'var(--gray-100)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>
        <div style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 'var(--radius)', padding: '16px 20px', fontSize: 14 }}>
          {error}
        </div>
      </div>
    );
  }

  const tasaResolucion = pct(data.publicadas, data.pagadas + data.publicadas);
  const totalEstados   = data.total;

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
          Panel KPI
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          Métricas de performance del sistema — {data.total} solicitudes en total
        </p>
      </div>

      {/* Tarjetas resumen */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16, marginBottom: 28,
      }}>
        <StatCard
          label="Total solicitudes"
          value={data.total}
          sublabel="Desde el inicio del sistema"
          color="var(--gray-800)"
        />
        <StatCard
          label="Sin resolver"
          value={data.pagadas}
          sublabel="Pagadas, esperando operador"
          color="var(--primary)"
        />
        <StatCard
          label="Publicadas"
          value={data.publicadas}
          sublabel="Certificados emitidos"
          color="var(--success)"
        />
        <StatCard
          label="Tasa de resolución"
          value={`${tasaResolucion}%`}
          sublabel="Publicadas sobre total resolubles"
          color={tasaResolucion >= 70 ? 'var(--success)' : tasaResolucion >= 40 ? 'var(--warning)' : 'var(--accent)'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Distribución por estado */}
        <Card>
          <SectionTitle>Distribución por estado</SectionTitle>
          {ESTADOS_CONFIG.map(({ key, label, color }) => {
            const val = {
              pendiente_pago:    data.pendientes,
              pagada:            data.pagadas,
              publicada:         data.publicadas,
              cancelada:         data.canceladas,
              publicada_vencida: data.vencidas,
            }[key] ?? 0;
            return (
              <BarRow key={key} label={label} value={val} total={totalEstados} color={color} />
            );
          })}
        </Card>

        {/* Solicitudes por circunscripción */}
        <Card>
          <SectionTitle>Solicitudes activas por circunscripción</SectionTitle>
          {data.circunscripciones.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>
              No hay solicitudes pagadas actualmente.
            </p>
          ) : (
            data.circunscripciones.map(({ nombre, total }) => (
              <BarRow
                key={nombre}
                label={nombre}
                value={total}
                total={data.pagadas || 1}
                color="var(--primary)"
              />
            ))
          )}
          <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 12 }}>
            Basado en solicitudes en estado "pagada" — las que requieren atención del operador.
          </p>
        </Card>

      </div>

      {/* Indicador de alerta */}
      {data.pagadas > 10 && (
        <div style={{
          background: 'var(--warning-light)', border: '1px solid rgba(180,83,9,.2)',
          borderRadius: 'var(--radius)', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 12, fontSize: 13.5,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
            {data.pagadas} solicitudes sin resolver — considerá revisar la carga de los operadores.
          </span>
        </div>
      )}

    </div>
  );
}