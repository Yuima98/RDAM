/**
 * Badge.jsx
 *
 * Chip de estado para solicitudes y certificados.
 * Estados del sistema según DDL ENUM en init.sql:
 *   pendiente_pago    → gris    (creada, sin pagar)
 *   pagada            → azul    (pago confirmado, esperando operador)
 *   publicada         → verde   (certificado emitido)
 *   publicada_vencida → naranja (certificado vencido)
 *   cancelada         → rojo    (cancelada)
 */

const CONFIG = {
  pendiente_pago:    { bg: 'var(--gray-100)',       color: 'var(--gray-600)',  label: 'Pendiente de pago' },
  pagada:            { bg: 'var(--primary-xlight)', color: 'var(--primary)',   label: 'Pagada'            },
  publicada:         { bg: 'var(--success-light)',  color: 'var(--success)',   label: 'Publicada'         },
  publicada_vencida: { bg: 'var(--warning-light)',  color: 'var(--warning)',   label: 'Vencida'           },
  cancelada:         { bg: 'var(--accent-light)',   color: 'var(--accent)',    label: 'Cancelada'         },
};

export default function Badge({ estado }) {
  const cfg = CONFIG[estado?.toLowerCase()] ?? {
    bg: 'var(--gray-100)', color: 'var(--gray-500)', label: estado ?? '—',
  };

  return (
    <span style={{
      display:      'inline-block',
      padding:      '3px 10px',
      borderRadius: 20,
      fontSize:     12,
      fontWeight:   600,
      background:   cfg.bg,
      color:        cfg.color,
      whiteSpace:   'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}