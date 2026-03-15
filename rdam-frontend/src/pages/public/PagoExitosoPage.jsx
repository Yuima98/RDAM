/**
 * PagoExitosoPage.jsx / PagoErrorPage.jsx
 *
 * Páginas de aterrizaje después del redirect de Pluspagos.
 *
 * Pluspagos redirige al frontend a:
 *   /pago/exitoso?solicitudId=X  → pago confirmado (webhook ya procesó)
 *   /pago/error?solicitudId=X    → pago cancelado o fallido
 *
 * Estas páginas son públicas (sin autenticación requerida) porque el
 * redirect viene de una pasarela externa que no conoce el JWT del usuario.
 * Sin embargo, ofrecen un link a /ciudadano/tramites para usuarios logueados.
 *
 * NOTA: El estado real de la solicitud lo actualizó el webhook del backend.
 * Estas páginas son solo UI de feedback — no hacen requests al backend.
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ResultPage({ type }) {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const solicitudId = params.get('solicitudId');

  const isOk = type === 'exitoso';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isOk ? 'var(--success-light)' : 'var(--accent-light)',
      padding: 32,
    }}>
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)', border: `1px solid ${isOk ? 'rgba(13,122,78,.2)' : 'rgba(200,16,46,.2)'}`,
        maxWidth: 420, width: '100%', padding: 40, textAlign: 'center',
      }}>
        {/* Ícono */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: isOk ? 'var(--success-light)' : 'var(--accent-light)',
          border: `2px solid ${isOk ? 'var(--success)' : 'var(--accent)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          {isOk ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="var(--success)" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="var(--accent)" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
          )}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8,
          color: isOk ? 'var(--success)' : 'var(--accent)' }}>
          {isOk ? 'Pago confirmado' : 'Pago no completado'}
        </h2>

        <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 20, lineHeight: 1.6 }}>
          {isOk
            ? 'Tu pago fue procesado correctamente. El operador recibirá tu solicitud y publicará el certificado en las próximas horas.'
            : 'El pago fue cancelado o no pudo procesarse. Podés intentarlo nuevamente desde tu historial de trámites.'}
        </p>

        {solicitudId && (
          <div style={{
            background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)',
            padding: '8px 14px', fontSize: 12.5, color: 'var(--gray-500)',
            fontFamily: 'var(--mono)', marginBottom: 24,
          }}>
            Solicitud #{solicitudId}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {user?.role === 'citizen' && (
            <button
              onClick={() => navigate('/ciudadano/tramites')}
              style={{
                padding: '10px 18px', borderRadius: 'var(--radius-sm)',
                background: isOk ? 'var(--success)' : 'var(--primary)',
                color: '#fff', border: 'none', fontFamily: 'var(--font)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Ver mis trámites
            </button>
          )}
          <button
            onClick={() => navigate(user ? '/ciudadano' : '/login')}
            style={{
              padding: '10px 18px', borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: 'var(--gray-500)', border: '1px solid var(--gray-200)',
              fontFamily: 'var(--font)', fontSize: 14, cursor: 'pointer',
            }}
          >
            {user ? 'Volver al inicio' : 'Ir al portal'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PagoExitosoPage() { return <ResultPage type="exitoso" />; }
export function PagoErrorPage()   { return <ResultPage type="error" />; }
export default PagoExitosoPage;
