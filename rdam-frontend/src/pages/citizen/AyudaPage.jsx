/**
 * AyudaPage.jsx
 *
 * Centro de ayuda estático para el portal ciudadano.
 * Cubre el flujo completo: qué es el RDAM, cómo solicitar,
 * cómo pagar, cómo descargar el certificado y preguntas frecuentes.
 */

import { useState } from 'react';

// ── Acordeón ───────────────────────────────────────────────────────────────

function Accordion({ pregunta, respuesta }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)',
      marginBottom: 8, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '14px 18px',
          background: open ? 'var(--primary-xlight)' : '#fff',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600,
          color: open ? 'var(--primary)' : 'var(--gray-800)',
          transition: 'background .15s',
        }}
      >
        {pregunta}
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          style={{ flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div style={{
          padding: '12px 18px 16px',
          fontSize: 13.5, color: 'var(--gray-600)', lineHeight: 1.7,
          borderTop: '1px solid var(--gray-100)',
        }}>
          {respuesta}
        </div>
      )}
    </div>
  );
}

// ── Paso del flujo ─────────────────────────────────────────────────────────

function Paso({ numero, titulo, descripcion }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: 'var(--primary)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 14,
      }}>
        {numero}
      </div>
      <div style={{ paddingTop: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
          {titulo}
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--gray-600)', lineHeight: 1.6 }}>
          {descripcion}
        </div>
      </div>
    </div>
  );
}

// ── AyudaPage ──────────────────────────────────────────────────────────────

const FAQS = [
  {
    pregunta: '¿Qué es el RDAM?',
    respuesta: 'El Registro de Deudores Alimentarios Morosos (RDAM) es un sistema del Poder Judicial de la Provincia de Santa Fe que permite consultar si una persona figura como deudora alimentaria. El certificado de libre deuda acredita que la persona consultada no está registrada como morosa.',
  },
  {
    pregunta: '¿Para qué sirve el certificado?',
    respuesta: 'El certificado de libre deuda alimentaria es requerido en distintos trámites administrativos y legales, como licitaciones públicas, concursos de cargos, adopciones, entre otros. Es emitido por el Poder Judicial de Santa Fe y tiene validez oficial.',
  },
  {
    pregunta: '¿Cuánto tarda en emitirse el certificado?',
    respuesta: 'Una vez confirmado el pago, el operador judicial de la circunscripción correspondiente revisará tu solicitud y emitirá el certificado. El tiempo estimado es de 1 a 3 días hábiles. Recibirás una notificación por email cuando esté disponible.',
  },
  {
    pregunta: '¿Cuánto cuesta el trámite?',
    respuesta: 'El arancel es de $1.500 por consulta, pagadero a través de la pasarela de pago PlusPagos con tarjeta de crédito o débito.',
  },
  {
    pregunta: '¿Qué pasa si el pago falla?',
    respuesta: 'Si el pago no se completa o es rechazado, la solicitud pasa al estado "Cancelada" y no puede recuperarse. Deberás iniciar una nueva solicitud desde "Nueva solicitud".',
  },
  {
    pregunta: '¿El certificado tiene fecha de vencimiento?',
    respuesta: 'Sí, el certificado tiene una validez determinada. Cuando vence, el estado de la solicitud cambia a "Vencida". Si necesitás un certificado vigente, deberás iniciar una nueva solicitud.',
  },
  {
    pregunta: '¿Puedo consultar el CUIL de cualquier persona?',
    respuesta: 'Sí, podés consultar el CUIL de cualquier persona física o jurídica. El certificado indica si esa persona figura o no en el Registro de Deudores Alimentarios Morosos de la circunscripción seleccionada.',
  },
  {
    pregunta: '¿Qué es la circunscripción?',
    respuesta: 'La Provincia de Santa Fe está dividida en circunscripciones judiciales. Debés seleccionar la circunscripción correspondiente al domicilio de la persona consultada o donde se tramitó la causa de alimentos.',
  },
  {
    pregunta: '¿Dónde puedo descargar el certificado?',
    respuesta: 'Una vez publicado, el certificado está disponible en "Mis trámites" → detalle de la solicitud → botón "Descargar PDF". También recibirás el certificado por email a la dirección que indicaste al crear la solicitud.',
  },
];

export default function AyudaPage() {
  return (
    <div style={{ padding: 32, maxWidth: 760, margin: '0 auto' }}>

      {/* Encabezado */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
          Centro de ayuda
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          Todo lo que necesitás saber para gestionar tu certificado de libre deuda.
        </p>
      </div>

      {/* Cómo funciona */}
      <div style={{
        background: '#fff', border: '1px solid var(--gray-200)',
        borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: 24,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 20 }}>
          ¿Cómo funciona el trámite?
        </div>
        <Paso
          numero={1}
          titulo="Completá el formulario"
          descripcion="Ingresá el CUIL de la persona que querés consultar, seleccioná la circunscripción y confirmá tu email de contacto."
        />
        <Paso
          numero={2}
          titulo="Abonás el arancel"
          descripcion="Serás redirigido a PlusPagos para abonar $1.500 con tarjeta de crédito o débito. El pago es seguro y encriptado."
        />
        <Paso
          numero={3}
          titulo="El operador procesa tu solicitud"
          descripcion="Un operador judicial de la circunscripción seleccionada revisará tu solicitud y emitirá el certificado en 1 a 3 días hábiles."
        />
        <Paso
          numero={4}
          titulo="Descargá el certificado"
          descripcion="Cuando el certificado esté listo, podrás descargarlo desde 'Mis trámites' y lo recibirás por email."
        />
      </div>

      {/* FAQ */}
      <div style={{
        background: '#fff', border: '1px solid var(--gray-200)',
        borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: 24,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 16 }}>
          Preguntas frecuentes
        </div>
        {FAQS.map((faq) => (
          <Accordion key={faq.pregunta} pregunta={faq.pregunta} respuesta={faq.respuesta} />
        ))}
      </div>

      {/* Contacto */}
      <div style={{
        background: 'var(--primary-xlight)', border: '1px solid rgba(26,91,166,.2)',
        borderRadius: 'var(--radius)', padding: '20px 24px',
        display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="var(--primary)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.22 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
        </svg>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
            ¿Necesitás más ayuda?
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--gray-600)', lineHeight: 1.6 }}>
            Podés comunicarte con la Mesa de Entradas del Poder Judicial de Santa Fe en el horario de atención al público.
          </div>
        </div>
      </div>

    </div>
  );
}