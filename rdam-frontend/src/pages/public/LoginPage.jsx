/**
 * LoginPage.jsx
 *
 * Página de login unificada. Replica view-login de la maqueta con dos paneles:
 *   - panel-citizen:  flujo OTP en dos pasos (email → código de 6 dígitos)
 *   - panel-internal: email + password para operadores/admins
 *
 * FLUJO CIUDADANO (dos pasos):
 * ────────────────────────────
 * Paso 1 — Email:
 *   POST /auth/register → { message, otpCode? }
 *   El backend crea el usuario si no existe y envía el OTP por email.
 *   En perfil dev, el otpCode llega en el response y se auto-completa
 *   en los inputs para facilitar el testing.
 *
 * Paso 2 — OTP:
 *   POST /auth/verify-otp → { accessToken, expiresAt, role }
 *   Al éxito: AuthContext.login(accessToken) y navigate a /ciudadano.
 *
 * FLUJO INTERNO:
 * ──────────────
 * POST /auth/login → { accessToken, expiresAt, role }
 * Al éxito: AuthContext.login(accessToken) y navigate según rol:
 *   operator → /interno/dashboard
 *   admin    → /interno/dashboard
 *
 * MANEJO DE ERRORES:
 * ──────────────────
 * Los errores del backend llegan normalizados del interceptor de Axios
 * como { status, message, details }. Se muestran inline bajo el formulario.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../api/authService';
import OtpInput from '../../components/otp/OtpInput';

const PORTAL_BY_ROLE = {
  operator: '/interno/dashboard',
  admin:    '/interno/dashboard',
  citizen:  '/ciudadano',
};

// ── Estilos comunes ────────────────────────────────────────────────────────

const formGroup   = { marginBottom: 20 };
const label       = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 };
const input       = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid var(--gray-300)', borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font)', fontSize: 14, color: 'var(--gray-800)',
  outline: 'none', transition: 'border-color .15s',
};
const btnPrimary  = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  width: '100%', padding: '10px 18px',
  borderRadius: 'var(--radius-sm)', border: 'none',
  background: 'var(--primary)', color: '#fff',
  fontFamily: 'var(--font)', fontSize: 13.5, fontWeight: 600,
  cursor: 'pointer',
};
const errorBox = {
  background: 'var(--accent-light)', color: 'var(--accent)',
  border: '1px solid rgba(200,16,46,.2)',
  borderRadius: 'var(--radius-sm)', padding: '10px 14px',
  fontSize: 13, marginBottom: 16,
};
const alertInfo = {
  display: 'flex', gap: 10, padding: '12px 14px',
  background: 'var(--primary-xlight)', color: 'var(--primary)',
  border: '1px solid rgba(26,91,166,.2)',
  borderRadius: 'var(--radius-sm)', fontSize: 12.5, marginBottom: 16,
};

// ── Panel ciudadano ────────────────────────────────────────────────────────

function CitizenPanel({ onSwitchToInternal }) {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [step,     setStep]     = useState('email'); // 'email' | 'otp'
  const [email,    setEmail]    = useState('');
  const [otp,      setOtp]      = useState(Array(6).fill(''));
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [devOtp,   setDevOtp]   = useState(''); // Solo en dev

  // Paso 1: enviar email → solicitar OTP
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Ingresá tu email.'); return; }
    setLoading(true);
    try {
      const data = await authService.register(email.trim().toLowerCase());
      // En perfil dev el backend devuelve el OTP — auto-completamos
      if (data?.otpCode) {
        setDevOtp(data.otpCode);
        setOtp(data.otpCode.split(''));
      }
      setStep('otp');
    } catch (err) {
      setError(err.message ?? 'Error al enviar el código.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: verificar OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length < 6) { setError('Ingresá el código completo de 6 dígitos.'); return; }
    setLoading(true);
    try {
      const data = await authService.verifyOtp(email.trim().toLowerCase(), code);
      login(data.accessToken);
      navigate(PORTAL_BY_ROLE[data.role] ?? '/ciudadano', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Código inválido o expirado.');
      setOtp(Array(6).fill(''));
    } finally {
      setLoading(false);
    }
  };

  const handleReenviar = () => {
    setStep('email');
    setOtp(Array(6).fill(''));
    setError('');
    setDevOtp('');
  };

  return (
    <div>
      {step === 'email' ? (
        <form onSubmit={handleSendEmail}>
          <div style={alertInfo}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Sin contraseña. Ingresás con un código de 6 dígitos enviado a tu email.</span>
          </div>

          {error && <div style={errorBox}>{error}</div>}

          <div style={formGroup}>
            <label style={label}>Email <span style={{ color: 'var(--accent)' }}>*</span></label>
            <input
              type="email" value={email} placeholder="tu@email.com"
              onChange={(e) => setEmail(e.target.value)}
              style={input} required
            />
          </div>

          <button type="submit" style={btnPrimary} disabled={loading}>
            {loading ? 'Enviando...' : 'Continuar →'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
            <button type="button" onClick={onSwitchToInternal}
              style={{ background: 'none', border: 'none', color: 'var(--gray-500)', fontSize: 12.5, cursor: 'pointer' }}>
              Acceso operadores →
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <button type="button" onClick={handleReenviar}
              style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Volver
            </button>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>
              Verificar código
            </div>
          </div>

          <p style={{ fontSize: 13.5, color: 'var(--gray-600)', marginBottom: 8 }}>
            Ingresá el código de 6 dígitos enviado a <strong>{email}</strong>
          </p>

          {devOtp && (
            <div style={{ ...alertInfo, marginBottom: 8, fontSize: 12 }}>
              <span>🛠 Dev: OTP auto-completado ({devOtp})</span>
            </div>
          )}

          {error && <div style={errorBox}>{error}</div>}

          <OtpInput value={otp} onChange={setOtp} disabled={loading} />

          <button type="submit" style={{ ...btnPrimary, marginTop: 8 }} disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--gray-400)', marginTop: 16 }}>
            ¿No recibiste el código?{' '}
            <button type="button" onClick={handleReenviar}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>
              Reenviar
            </button>
          </p>
        </form>
      )}
    </div>
  );
}

// ── Panel interno ──────────────────────────────────────────────────────────

function InternalPanel({ onSwitchToCitizen }) {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login(email.trim().toLowerCase(), password);
      login(data.accessToken);
      navigate(PORTAL_BY_ROLE[data.role] ?? '/interno/dashboard', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button type="button" onClick={onSwitchToCitizen}
          style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </button>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>
          Acceso operadores
        </div>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={formGroup}>
          <label style={label}>Email institucional <span style={{ color: 'var(--accent)' }}>*</span></label>
          <input
            type="email" value={email} placeholder="usuario@santafe.gov.ar"
            onChange={(e) => setEmail(e.target.value)}
            style={input} required
          />
        </div>
        <div style={formGroup}>
          <label style={label}>Contraseña <span style={{ color: 'var(--accent)' }}>*</span></label>
          <input
            type="password" value={password} placeholder="Mínimo 8 caracteres"
            onChange={(e) => setPassword(e.target.value)}
            style={input} required
          />
        </div>
        <button type="submit" style={btnPrimary} disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}

// ── LoginPage ──────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [activePanel, setActivePanel] = useState('citizen'); // 'citizen' | 'internal'

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 32,
      background: 'linear-gradient(160deg, var(--gray-50), var(--primary-xlight))',
    }}>
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--gray-200)',
        width: '100%', maxWidth: 420, overflow: 'hidden',
      }}>
        {/* Header de la caja */}
        <div style={{
          background: 'var(--primary-dark)', padding: 28, textAlign: 'center',
        }}>
          <svg width="36" height="36" viewBox="0 0 38 38" fill="none" style={{ marginBottom: 8 }}>
            <circle cx="19" cy="19" r="18" fill="rgba(255,255,255,.15)" stroke="rgba(255,255,255,.4)" strokeWidth="1.5"/>
            <line x1="19" y1="9"  x2="19" y2="30" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="9"  y1="12" x2="29" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M9 12 L6 20 H12 Z"  fill="white"/>
            <path d="M29 12 L26 20 H32 Z" fill="white"/>
            <line x1="14" y1="30" x2="24" y2="30" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>RDAM</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>
            Poder Judicial · Provincia de Santa Fe
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 32 }}>
          {activePanel === 'citizen' ? (
            <CitizenPanel onSwitchToInternal={() => setActivePanel('internal')} />
          ) : (
            <InternalPanel onSwitchToCitizen={() => setActivePanel('citizen')} />
          )}
        </div>
      </div>
    </div>
  );
}
