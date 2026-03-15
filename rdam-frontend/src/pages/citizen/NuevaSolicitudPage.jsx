/**
 * NuevaSolicitudPage.jsx
 *
 * Stepper de 3 pasos para crear una solicitud de certificado.
 *
 * PASO 1 — Datos de la consulta:
 *   - CUIL consultado (formato XX-XXXXXXXX-X + dígito verificador)
 *   - Circunscripción (select cargado de GET /circunscripciones)
 *   - Email de contacto (pre-cargado con el email del ciudadano logueado)
 *   Validación local antes de llamar al backend.
 *
 * PASO 2 — Confirmación:
 *   Muestra resumen de los datos ingresados.
 *   Al confirmar → POST /solicitudes → obtiene solicitudId.
 *
 * PASO 3 — Pago:
 *   POST /pagos/iniciar/:solicitudId → obtiene los campos encriptados.
 *   Construye un form POST dinámico y redirige al ciudadano a PlusPagos.
 *   PlusPagos redirige de vuelta a /pago/exitoso o /pago/error.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import solicitudService from '../../api/solicitudService';
import pagoService from '../../api/pagoService';
import { validateCuil } from '../../utils/cuil';
import { submitFormPost } from '../../utils/formPost';

// ── Stepper header ─────────────────────────────────────────────────────────

const STEPS = ['Datos', 'Confirmación', 'Pago'];

function StepperHeader({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
      {STEPS.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        const last    = i === STEPS.length - 1;

        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: last ? 0 : 1 }}>
            {/* Círculo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13,
                background: done || active ? 'var(--primary)' : 'var(--gray-200)',
                color:      done || active ? '#fff'           : 'var(--gray-500)',
                transition: 'all .2s',
              }}>
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : i + 1}
              </div>
              <span style={{
                fontSize: 12, fontWeight: active ? 700 : 500,
                color: active ? 'var(--primary)' : done ? 'var(--gray-600)' : 'var(--gray-400)',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>

            {/* Línea conectora */}
            {!last && (
              <div style={{
                flex: 1, height: 2, margin: '0 8px', marginBottom: 20,
                background: done ? 'var(--primary)' : 'var(--gray-200)',
                transition: 'background .2s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Estilos comunes ────────────────────────────────────────────────────────

const fieldGroup = { marginBottom: 20 };
const fieldLabel = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 };
const fieldInput = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid var(--gray-300)', borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font)', fontSize: 14, color: 'var(--gray-800)',
  outline: 'none', background: '#fff',
};
const fieldError = { fontSize: 12, color: 'var(--accent)', marginTop: 4, display: 'block' };
const btnPrimary = {
  padding: '10px 24px', borderRadius: 'var(--radius-sm)',
  background: 'var(--primary)', color: '#fff', border: 'none',
  fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};
const btnSecondary = {
  padding: '10px 24px', borderRadius: 'var(--radius-sm)',
  background: '#fff', color: 'var(--gray-600)',
  border: '1px solid var(--gray-300)',
  fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

// ── Paso 1: Formulario ─────────────────────────────────────────────────────

function Paso1({ form, setForm, onNext }) {
  const { user } = useAuth();

  const [circunscripciones, setCircunscripciones] = useState([]);
  const [loadingCirc,       setLoadingCirc]       = useState(true);
  const [errors,            setErrors]            = useState({});

  useEffect(() => {
    solicitudService.listarCircunscripciones()
      .then(setCircunscripciones)
      .finally(() => setLoadingCirc(false));

    // Pre-cargar email del usuario logueado
    if (!form.emailContacto && user?.email) {
      setForm((f) => ({ ...f, emailContacto: user.email }));
    }
  }, []);

  const validate = () => {
    const errs = {};
    const cuilResult = validateCuil(form.cuilConsultado);
    if (!cuilResult.valid) errs.cuilConsultado = cuilResult.message;
    if (!form.circunscripcionId) errs.circunscripcionId = 'Seleccioná una circunscripción.';
    if (!form.emailContacto) errs.emailContacto = 'El email de contacto es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailContacto))
      errs.emailContacto = 'El email no es válido.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validate()) onNext(); };

  const handleCuil = (e) => {
    // Auto-formato: agrega guiones al escribir
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2)  val = val.slice(0, 2)  + '-' + val.slice(2);
    if (val.length > 11) val = val.slice(0, 11) + '-' + val.slice(11, 12);
    setForm((f) => ({ ...f, cuilConsultado: val }));
  };

  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 20 }}>
        Datos de la consulta
      </h2>

      <div style={fieldGroup}>
        <label style={fieldLabel}>
          CUIL de la persona consultada <span style={{ color: 'var(--accent)' }}>*</span>
        </label>
        <input
          type="text" placeholder="20-12345678-9" maxLength={13}
          value={form.cuilConsultado}
          onChange={handleCuil}
          style={{ ...fieldInput, borderColor: errors.cuilConsultado ? 'var(--accent)' : 'var(--gray-300)', fontFamily: 'var(--mono)' }}
        />
        {errors.cuilConsultado && <span style={fieldError}>{errors.cuilConsultado}</span>}
        <span style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>
          Formato: XX-XXXXXXXX-X
        </span>
      </div>

      <div style={fieldGroup}>
        <label style={fieldLabel}>
          Circunscripción <span style={{ color: 'var(--accent)' }}>*</span>
        </label>
        <select
          value={form.circunscripcionId}
          onChange={(e) => setForm((f) => ({ ...f, circunscripcionId: e.target.value }))}
          disabled={loadingCirc}
          style={{ ...fieldInput, borderColor: errors.circunscripcionId ? 'var(--accent)' : 'var(--gray-300)' }}
        >
          <option value="">{loadingCirc ? 'Cargando...' : 'Seleccioná una circunscripción'}</option>
          {circunscripciones.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        {errors.circunscripcionId && <span style={fieldError}>{errors.circunscripcionId}</span>}
      </div>

      <div style={fieldGroup}>
        <label style={fieldLabel}>
          Email de contacto <span style={{ color: 'var(--accent)' }}>*</span>
        </label>
        <input
          type="email" placeholder="tu@email.com"
          value={form.emailContacto}
          onChange={(e) => setForm((f) => ({ ...f, emailContacto: e.target.value }))}
          style={{ ...fieldInput, borderColor: errors.emailContacto ? 'var(--accent)' : 'var(--gray-300)' }}
        />
        {errors.emailContacto && <span style={fieldError}>{errors.emailContacto}</span>}
        <span style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>
          Aquí recibirás el certificado cuando esté disponible.
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button style={btnPrimary} onClick={handleNext}>
          Continuar →
        </button>
      </div>
    </div>
  );
}

// ── Paso 2: Confirmación ───────────────────────────────────────────────────

function Paso2({ form, circunscripciones, onBack, onConfirm, loading, error }) {
  const circNombre = circunscripciones.find((c) => String(c.id) === String(form.circunscripcionId))?.nombre ?? '—';

  const fila = (label, value, mono = false) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '11px 0', borderBottom: '1px solid var(--gray-100)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--gray-800)', fontFamily: mono ? 'var(--mono)' : 'var(--font)' }}>
        {value}
      </span>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 8 }}>
        Confirmá los datos
      </h2>
      <p style={{ fontSize: 13.5, color: 'var(--gray-500)', marginBottom: 20 }}>
        Revisá los datos antes de continuar al pago.
      </p>

      <div style={{
        background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
        borderRadius: 'var(--radius)', padding: '4px 20px', marginBottom: 20,
      }}>
        {fila('CUIL consultado',  form.cuilConsultado, true)}
        {fila('Circunscripción',  circNombre)}
        {fila('Email de contacto', form.emailContacto)}
        {fila('Arancel',          '$1.500,00')}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
        background: 'var(--primary-xlight)', border: '1px solid rgba(26,91,166,.2)',
        borderRadius: 'var(--radius-sm)', marginBottom: 24, fontSize: 13, color: 'var(--primary)',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Al confirmar serás redirigido a la pasarela de pago PlusPagos.
      </div>

      {error && (
        <div style={{
          background: 'var(--accent-light)', color: 'var(--accent)',
          border: '1px solid rgba(200,16,46,.2)',
          borderRadius: 'var(--radius-sm)', padding: '10px 14px',
          fontSize: 13, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button style={btnSecondary} onClick={onBack} disabled={loading}>
          ← Volver
        </button>
        <button style={{ ...btnPrimary, opacity: loading ? .7 : 1 }} onClick={onConfirm} disabled={loading}>
          {loading ? 'Procesando...' : 'Confirmar y pagar'}
        </button>
      </div>
    </div>
  );
}

// ── Paso 3: Redirigiendo ───────────────────────────────────────────────────

function Paso3() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'var(--primary-xlight)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      </div>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 8 }}>
        Redirigiendo al pago...
      </h2>
      <p style={{ fontSize: 13.5, color: 'var(--gray-500)' }}>
        Serás redirigido a PlusPagos en un momento.
      </p>
    </div>
  );
}

// ── NuevaSolicitudPage ─────────────────────────────────────────────────────

export default function NuevaSolicitudPage() {
  const navigate = useNavigate();

  const [step,             setStep]             = useState(0);
  const [circunscripciones, setCircunscripciones] = useState([]);
  const [form,             setForm]             = useState({
    cuilConsultado:   '',
    circunscripcionId: '',
    emailContacto:    '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Cargamos circunscripciones aquí también para tenerlas en el paso 2
  useEffect(() => {
    solicitudService.listarCircunscripciones().then(setCircunscripciones);
  }, []);

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      // Paso 1: crear la solicitud
      const solicitud = await solicitudService.crear({
        cuilConsultado:    form.cuilConsultado,
        circunscripcionId: Number(form.circunscripcionId),
        emailContacto:     form.emailContacto,
      });

      // Paso 2: iniciar el pago
      const pago = await pagoService.iniciarPago(solicitud.solicitudId);

      // Paso 3: mostrar pantalla de redirección brevemente
      setStep(2);

      // Pequeño delay para que el usuario vea el paso 3 antes del redirect
      setTimeout(() => {
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
      }, 800);

    } catch (err) {
      setError(err.message ?? 'Error al procesar la solicitud.');
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/ciudadano')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: 'var(--gray-500)',
          fontSize: 13, cursor: 'pointer', marginBottom: 28, padding: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Inicio
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 28 }}>
        Nueva solicitud
      </h1>

      <StepperHeader current={step} />

      <div style={{
        background: '#fff', border: '1px solid var(--gray-200)',
        borderRadius: 'var(--radius)', padding: '28px 32px',
      }}>
        {step === 0 && (
          <Paso1
            form={form}
            setForm={setForm}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <Paso2
            form={form}
            circunscripciones={circunscripciones}
            onBack={() => { setError(''); setStep(0); }}
            onConfirm={handleConfirm}
            loading={loading}
            error={error}
          />
        )}
        {step === 2 && <Paso3 />}
      </div>

    </div>
  );
}