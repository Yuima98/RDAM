/**
 * LandingPage.jsx
 *
 * Página de inicio pública. Replica view-landing de la maqueta.
 * Si el usuario ya tiene sesión activa lo redirige directamente
 * a su portal correspondiente (no tiene sentido mostrar el landing
 * a alguien que ya está autenticado).
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PORTAL_BY_ROLE = {
  citizen:  '/ciudadano',
  operator: '/interno/dashboard',
  admin:    '/interno/dashboard',
};

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate(PORTAL_BY_ROLE[user.role] ?? '/login', { replace: true });
    }
  }, [user, isLoading]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Header mínimo */}
      <header style={{
        background: 'var(--primary-dark)', color: '#fff', height: 64,
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
      }}>
        <svg width="32" height="32" viewBox="0 0 38 38" fill="none">
          <circle cx="19" cy="19" r="18" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.3)" strokeWidth="1"/>
          <line x1="19" y1="9"  x2="19" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <line x1="9"  y1="12" x2="29" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M9 12 L6 20 H12 Z"  fill="rgba(255,255,255,.8)"/>
          <path d="M29 12 L26 20 H32 Z" fill="rgba(255,255,255,.8)"/>
          <line x1="14" y1="30" x2="24" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 13, fontWeight: 600, opacity: .85 }}>
          Poder Judicial · Provincia de Santa Fe
        </span>
      </header>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary-dark), var(--primary) 60%, var(--primary-light))',
        padding: '64px 32px', textAlign: 'center', color: '#fff',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decoraciones de fondo */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,.05)', pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute', bottom: -80, left: -40,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(200,16,46,.12)', pointerEvents: 'none',
        }}/>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)',
            borderRadius: 20, padding: '6px 14px',
            fontSize: 12, fontWeight: 600, letterSpacing: '.05em',
            textTransform: 'uppercase', marginBottom: 20,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Trámite 100% digital
          </div>

          <h1 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1.15, marginBottom: 16 }}>
            Registro de Deudores<br/>Alimentarios Morosos
          </h1>

          <p style={{ fontSize: 16, opacity: .8, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Solicitá el certificado de libre deuda alimentaria de forma digital,
            segura y desde cualquier dispositivo.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 'var(--radius-sm)',
                background: '#fff', color: 'var(--primary)',
                border: 'none', fontFamily: 'var(--font)',
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Iniciar sesión
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 20, padding: '40px 32px', maxWidth: 900, margin: '0 auto', width: '100%',
      }}>
        {[
          {
            icon: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>,
            title: 'Solicitud en línea',
            desc:  'Completá el formulario con el CUIL de la persona y la circunscripción de consulta.',
          },
          {
            icon: <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>,
            title: 'Pago seguro',
            desc:  'Abonás el arancel a través de PlusPagos con múltiples medios de pago.',
          },
          {
            icon: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
            title: 'Certificado digital',
            desc:  'Recibís el certificado en tu email y podés descargarlo desde el portal.',
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{ textAlign: 'center', padding: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'var(--primary-xlight)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="var(--primary)" strokeWidth="2">
                {icon}
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 6 }}>
              {title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6 }}>
              {desc}
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        background: 'var(--primary-dark)', color: 'rgba(255,255,255,.6)',
        padding: '20px 32px', textAlign: 'center', fontSize: 12,
      }}>
        Poder Judicial de la Provincia de Santa Fe · RDAM v1.0
      </footer>
    </div>
  );
}
