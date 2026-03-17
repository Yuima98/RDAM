/**
 * DetalleInternaPage.jsx
 *
 * Detalle de una solicitud desde el portal interno.
 * El operador puede subir el certificado PDF (estado 'pagada')
 * o ver el detalle de una solicitud ya resuelta.
 *
 * Endpoints:
 *   GET  /api/v1/interno/solicitudes/:id
 *   POST /api/v1/interno/solicitudes/:id/certificado  (multipart/form-data, field: "file")
 *     → { certificadoId, solicitudId, message }
 *     → cambia el estado a 'publicada'
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import solicitudService from '../../api/solicitudService';
import Badge from '../../components/ui/Badge';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DetalleInternaPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { token } = useAuth();

  const [solicitud,  setSolicitud]  = useState(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState('');
  const [uploading,  setUploading]  = useState(false);
  const [uploadMsg,  setUploadMsg]  = useState('');
  const [uploadErr,  setUploadErr]  = useState('');
  const [dragOver,   setDragOver]   = useState(false);
  const [fileSelected, setFileSelected] = useState(null);
  const fileRef = useRef(null);

  const loadSolicitud = () => {
    setIsLoading(true);
    solicitudService.getByIdInterno(id)
      .then(setSolicitud)
      .catch((err) => setError(err.message ?? 'Error al cargar la solicitud.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadSolicitud(); }, [id]);

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadErr('Solo se aceptan archivos PDF.');
      return;
    }
    setFileSelected(file);
    setUploadErr('');
  };

  const handleUpload = async () => {
    if (!fileSelected) { setUploadErr('Seleccioná un archivo PDF.'); return; }
    setUploading(true);
    setUploadErr('');
    setUploadMsg('');

    const formData = new FormData();
    formData.append('file', fileSelected);

    try {
      const res = await fetch(`/api/v1/interno/solicitudes/${id}/certificado`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Error al subir el certificado.');
      setUploadMsg(data.message ?? 'Certificado subido. Solicitud publicada.');
      setFileSelected(null);
      // Recargar solicitud para actualizar el estado
      loadSolicitud();
    } catch (err) {
      setUploadErr(err.message);
    } finally {
      setUploading(false);
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
        <div style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid rgba(200,16,46,.2)', borderRadius: 'var(--radius)', padding: '16px 20px', fontSize: 14 }}>
          {error}
        </div>
      </div>
    );
  }

  const row = (label, value, mono = false) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
      <span style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13.5, color: 'var(--gray-800)', fontWeight: 600, fontFamily: mono ? 'var(--mono)' : 'var(--font)', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );

  const canUpload = solicitud.estado === 'pagada';

  return (
    <div style={{ padding: 32, maxWidth: 720, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/interno/historial')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--gray-500)', fontSize: 13, cursor: 'pointer', marginBottom: 24, padding: 0 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Historial
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
            {solicitud.nroTramite}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--gray-500)' }}>
            Creada el {formatDate(solicitud.createdAt)}
          </p>
        </div>
        <Badge estado={solicitud.estado} />
      </div>

      {/* Datos */}
      <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '4px 20px', marginBottom: 24 }}>
        {row('CUIL consultado',   solicitud.cuilConsultado, true)}
        {row('Circunscripción',   solicitud.circunscripcion)}
        {row('Email de contacto', solicitud.emailContacto)}
        {row('Estado',            <Badge estado={solicitud.estado} />)}
        {solicitud.paymentConfirmedAt && row('Pago confirmado', formatDate(solicitud.paymentConfirmedAt))}
      </div>

      {/* Subir certificado (solo si estado = pagada) */}
      {canUpload && (
        <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 16 }}>
            Subir certificado PDF
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--primary)' : fileSelected ? 'var(--success)' : 'var(--gray-300)'}`,
              borderRadius: 'var(--radius)',
              padding: '32px 24px', textAlign: 'center',
              cursor: 'pointer', transition: 'all .15s',
              background: dragOver ? 'var(--primary-xlight)' : fileSelected ? 'var(--success-light)' : 'var(--gray-50)',
              marginBottom: 16,
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke={fileSelected ? 'var(--success)' : 'var(--gray-400)'} strokeWidth="1.5"
              style={{ margin: '0 auto 10px', display: 'block' }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {fileSelected ? (
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--success)' }}>
                {fileSelected.name}
                <span style={{ color: 'var(--gray-400)', fontWeight: 400, marginLeft: 8 }}>
                  ({(fileSelected.size / 1024).toFixed(0)} KB)
                </span>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 }}>
                  Arrastrá el PDF aquí o hacé click para seleccionar
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Solo archivos PDF</div>
              </>
            )}
          </div>

          {uploadErr && (
            <div style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid rgba(200,16,46,.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
              {uploadErr}
            </div>
          )}

          {uploadMsg && (
            <div style={{ background: 'var(--success-light)', color: 'var(--success)', border: '1px solid rgba(13,122,78,.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
              {uploadMsg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            {fileSelected && (
              <button
                onClick={() => { setFileSelected(null); setUploadErr(''); }}
                style={{ padding: '9px 18px', borderRadius: 'var(--radius-sm)', background: '#fff', color: 'var(--gray-500)', border: '1px solid var(--gray-300)', fontFamily: 'var(--font)', fontSize: 13.5, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={uploading || !fileSelected}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 20px', borderRadius: 'var(--radius-sm)',
                background: 'var(--primary)', color: '#fff', border: 'none',
                fontFamily: 'var(--font)', fontSize: 13.5, fontWeight: 600,
                cursor: uploading || !fileSelected ? 'default' : 'pointer',
                opacity: uploading || !fileSelected ? .6 : 1,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {uploading ? 'Subiendo...' : 'Publicar certificado'}
            </button>
          </div>
        </div>
      )}

      {/* Mensaje si ya fue publicada */}
      {solicitud.estado === 'publicada' && (
        <div style={{ background: 'var(--success-light)', border: '1px solid rgba(13,122,78,.2)', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>
            Certificado publicado. El ciudadano puede descargarlo desde su portal.
          </div>
        </div>
      )}

    </div>
  );
}