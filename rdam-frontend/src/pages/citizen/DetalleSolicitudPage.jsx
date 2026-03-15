/**
 * DetalleSolicitudPage.jsx
 *
 * Detalle completo de una solicitud del ciudadano.
 *
 * Muestra:
 *   - Datos de la solicitud: CUIL, circunscripción, email, estado, fechas
 *   - Timeline del estado actual
 *   - Botón de descarga del certificado PDF (solo si estado === 'publicada')
 *   - Botón de ir a pagar (solo si estado === 'pendiente_pago')
 *
 * Endpoints:
 *   GET /api/v1/solicitudes/:id
 *   GET /api/v1/solicitudes/:id/certificado  → PDF binario
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import solicitudService from '../../api/solicitudService';
import pagoService from '../../api/pagoService';
import { submitFormPost } from '../../utils/formPost';
import Badge from '../../components/ui/Badge';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Timeline ───────────────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { estado: 'pendiente_pago', label: 'Solicitud creada',    desc: 'Tu solicitud fue registrada. Pendiente de pago.' },
  { estado: 'pagada',         label: 'Pago confirmado',     desc: 'El pago fue procesado. Un operador revisará tu solicitud.' },
  { estado: 'publicada',      label: 'Certificado emitido', desc: 'El certificado está disponible para descargar.' },
];

const ESTADO_ORDER = { pendiente_pago: 0, pagada: 1, publicada: 2 };

function Timeline({ estado }) {
  const isTerminal = estado === 'cancelada' || estado === 'publicada_vencida';
  const currentIdx = ESTADO_ORDER[estado] ?? 0;

  if (isTerminal) {
    const isCancelada = estado === 'cancelada';
    return (
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '16px 20px',
        background: isCancelada ? 'var(--accent-light)' : 'var(--warning-light)',
        borderRadius: 'var(--radius)',
        border: `1px solid ${isCancelada ? 'rgba(200,16,46,.2)' : 'rgba(180,83,9,.2)'}`,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: isCancelada ? 'var(--accent)' : 'var(--warning)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6"  y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, color: isCancelada ? 'var(--accent)' : 'var(--warning)', marginBottom: 2 }}>
            {isCancelada ? 'Solicitud cancelada' : 'Certificado vencido'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
            {isCancelada
              ? 'Tu solicitud fue cancelada. Podés iniciar una nueva si lo necesitás.'
              : 'El certificado venció. Podés solicitar uno nuevo.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {TIMELINE_STEPS.map((step, i) => {
        const done    = i <= currentIdx;
        const current = i === currentIdx;
        const last    = i === TIMELINE_STEPS.length - 1;

        return (
          <div key={step.estado} style={{ display: 'flex', gap: 16, position: 'relative' }}>
            {!last && (
              <div style={{
                position: 'absolute', left: 15, top: 32,
                width: 2, height: 'calc(100% - 8px)',
                background: done && i < currentIdx ? 'var(--primary)' : 'var(--gray-200)',
              }} />
            )}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0, zIndex: 1,
              background: done ? 'var(--primary)' : '#fff',
              border: `2px solid ${done ? 'var(--primary)' : 'var(--gray-300)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {done ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gray-300)' }} />
              )}
            </div>
            <div style={{ paddingBottom: last ? 0 : 24, paddingTop: 4 }}>
              <div style={{
                fontSize: 14, fontWeight: current ? 700 : 600,
                color: done ? 'var(--gray-900)' : 'var(--gray-400)', marginBottom: 2,
              }}>
                {step.label}
                {current && (
                  <span style={{
                    marginLeft: 8, fontSize: 11, fontWeight: 700,
                    background: 'var(--primary-xlight)', color: 'var(--primary)',
                    padding: '2px 8px', borderRadius: 10,
                  }}>
                    Actual
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: done ? 'var(--gray-500)' : 'var(--gray-300)' }}>
                {step.desc}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── DetalleSolicitudPage ───────────────────────────────────────────────────

export default function DetalleSolicitudPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { token }  = useAuth();

  const [solicitud,   setSolicitud]   = useState(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState('');
  const [downloading, setDownloading] = useState(false);
  const [paying,      setPaying]      = useState(false);

  useEffect(() => {
    solicitudService.getById(id)
      .then(setSolicitud)
      .catch((err) => setError(err.message ?? 'Error al cargar la solicitud.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleDescargar = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/v1/solicitudes/${id}/certificado`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo descargar el certificado.');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `certificado_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handlePagar = async () => {
    setPaying(true);
    try {
      const pago = await pagoService.iniciarPago(id);
      submitFormPost(pago.pasarelaUrl, {
        Comercio:              pago.comercio,
        TransaccionComercioId: pago.transaccionComercioId,
        Monto:                 pago.monto,
        CallbackSuccess:       pago.callbackSuccess,
        CallbackCancel:        pago.callbackCancel,
        UrlSuccess:            pago.urlSuccess,
        UrlError:              pago.urlError,
        Informacion:           pago.informacion,
      });
    } catch (err) {
      alert(err.message);
      setPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: 32, maxWidth: 720, margin: '0 auto' }}>
        <div style={{ height: 24, width: 200, borderRadius: 4, background: 'var(--gray-200)', marginBottom: 32 }} />
        <div style={{ height: 200, borderRadius: 'var(--radius)', background: 'var(--gray-100)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, maxWidth: 720, margin: '0 auto' }}>
        <div style={{
          background: 'var(--accent-light)', color: 'var(--accent)',
          border: '1px solid rgba(200,16,46,.2)',
          borderRadius: 'var(--radius)', padding: '16px 20px', fontSize: 14,
        }}>
          {error}
        </div>
      </div>
    );
  }

  const row = (label, value, mono = false) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid var(--gray-100)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 500 }}>{label}</span>
      <span style={{
        fontSize: 13.5, color: 'var(--gray-800)', fontWeight: 600,
        fontFamily: mono ? 'var(--mono)' : 'var(--font)', textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );

  return (
    <div style={{ padding: 32, maxWidth: 720, margin: '0 auto' }}>

      <button
        onClick={() => navigate('/ciudadano/tramites')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: 'var(--gray-500)',
          fontSize: 13, cursor: 'pointer', marginBottom: 24, padding: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Mis trámites
      </button>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 28, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
            Solicitud #{solicitud.solicitudId}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--gray-500)' }}>
            Creada el {formatDate(solicitud.createdAt)}
          </p>
        </div>
        <Badge estado={solicitud.estado} />
      </div>

      {/* Datos */}
      <div style={{
        background: '#fff', border: '1px solid var(--gray-200)',
        borderRadius: 'var(--radius)', padding: '4px 20px', marginBottom: 24,
      }}>
        {row('CUIL consultado',   solicitud.cuilConsultado, true)}
        {row('Circunscripción',   solicitud.circunscripcion)}
        {row('Email de contacto', solicitud.emailContacto)}
        {row('Estado',            <Badge estado={solicitud.estado} />)}
        {solicitud.paymentConfirmedAt && row('Pago confirmado', formatDate(solicitud.paymentConfirmedAt))}
      </div>

      {/* Timeline */}
      <div style={{
        background: '#fff', border: '1px solid var(--gray-200)',
        borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 24,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 20 }}>
          Estado del trámite
        </div>
        <Timeline estado={solicitud.estado} />
      </div>

      {/* CTA según estado */}
      {solicitud.estado === 'pendiente_pago' && (
        <div style={{
          background: 'var(--primary-xlight)', border: '1px solid rgba(26,91,166,.2)',
          borderRadius: 'var(--radius)', padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
              Pago pendiente
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
              Completá el pago para que el operador procese tu solicitud.
            </div>
          </div>
          <button
            onClick={handlePagar}
            disabled={paying}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 'var(--radius-sm)',
              background: 'var(--primary)', color: '#fff', border: 'none',
              fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600,
              cursor: paying ? 'default' : 'pointer', opacity: paying ? .7 : 1,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            {paying ? 'Redirigiendo...' : 'Ir a pagar'}
          </button>
        </div>
      )}

      {solicitud.estado === 'publicada' && (
        <div style={{
          background: 'var(--success-light)', border: '1px solid rgba(13,122,78,.2)',
          borderRadius: 'var(--radius)', padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>
              Certificado disponible
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
              Tu certificado de libre deuda está listo para descargar.
            </div>
          </div>
          <button
            onClick={handleDescargar}
            disabled={downloading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 'var(--radius-sm)',
              background: 'var(--success)', color: '#fff', border: 'none',
              fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600,
              cursor: downloading ? 'default' : 'pointer', opacity: downloading ? .7 : 1,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {downloading ? 'Descargando...' : 'Descargar PDF'}
          </button>
        </div>
      )}

    </div>
  );
}