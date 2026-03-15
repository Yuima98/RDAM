/**
 * GestionUsuariosPage.jsx
 *
 * Solo visible para admin. Gestión de usuarios internos (operator/admin).
 *
 * Funcionalidades:
 *   - Tabla de usuarios internos con estado activo/inactivo
 *   - Formulario inline para crear nuevo usuario
 *   - Toggle activo/inactivo con PATCH /admin/usuarios/:id/estado
 *
 * Endpoints:
 *   GET  /admin/usuarios             → UserResponse[]
 *   POST /admin/usuarios             → UserResponse
 *   PATCH /admin/usuarios/:id/estado → 204
 *
 * Reglas del backend:
 *   - operator → circunscripcionId obligatorio
 *   - admin    → circunscripcionId debe ser null/omitido
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../api/adminService';
import solicitudService from '../../api/solicitudService';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

const ROLE_LABEL = { operator: 'Operador', admin: 'Admin' };

const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid var(--gray-300)', borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font)', fontSize: 13.5, outline: 'none',
};
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 5 };

export default function GestionUsuariosPage() {
  const { user } = useAuth();
  const [usuarios,          setUsuarios]          = useState([]);
  const [circunscripciones, setCircunscripciones] = useState([]);
  const [isLoading,         setIsLoading]         = useState(true);
  const [error,             setError]             = useState('');
  const [showForm,          setShowForm]          = useState(false);
  const [toggling,          setToggling]          = useState(null); // id del usuario en toggle

  const [form, setForm] = useState({ email: '', password: '', role: 'operator', circunscripcionId: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');

  const loadUsuarios = () => {
    adminService.listarUsuarios()
      .then(setUsuarios)
      .catch((err) => setError(err.message ?? 'Error al cargar usuarios.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadUsuarios();
    solicitudService.listarCircunscripciones().then(setCircunscripciones);
  }, []);

  const handleToggle = async (usuario) => {
    setToggling(usuario.id);
    try {
      await adminService.actualizarEstado(usuario.id, !usuario.activo);
      setUsuarios((prev) =>
        prev.map((u) => u.id === usuario.id ? { ...u, activo: !u.activo } : u)
      );
    } catch (err) {
      alert(err.message ?? 'Error al actualizar estado.');
    } finally {
      setToggling(null);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.email || !form.password || !form.role) {
      setFormError('Completá todos los campos obligatorios.');
      return;
    }
    if (form.role === 'operator' && !form.circunscripcionId) {
      setFormError('Los operadores deben tener una circunscripción asignada.');
      return;
    }

    setFormLoading(true);
    try {
      const nuevo = await adminService.crearUsuario({
        email:            form.email.trim().toLowerCase(),
        password:         form.password,
        role:             form.role,
        circunscripcionId: form.role === 'admin' ? null : Number(form.circunscripcionId),
      });
      setUsuarios((prev) => [nuevo, ...prev]);
      setForm({ email: '', password: '', role: 'operator', circunscripcionId: '' });
      setFormSuccess(`Usuario ${nuevo.email} creado correctamente.`);
      setShowForm(false);
    } catch (err) {
      setFormError(err.message ?? 'Error al crear el usuario.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 4 }}>
            Gestión de usuarios
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} interno{usuarios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(''); setFormSuccess(''); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 'var(--radius-sm)',
            background: showForm ? 'var(--gray-100)' : 'var(--primary)',
            color: showForm ? 'var(--gray-600)' : '#fff',
            border: 'none', fontFamily: 'var(--font)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancelar' : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nuevo usuario
            </>
          )}
        </button>
      </div>

      {/* Mensaje de éxito */}
      {formSuccess && (
        <div style={{ background: 'var(--success-light)', color: 'var(--success)', border: '1px solid rgba(13,122,78,.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
          {formSuccess}
        </div>
      )}

      {/* Formulario de creación */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 20 }}>
            Crear usuario interno
          </div>

          <form onSubmit={handleCrear}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Email institucional *</label>
                <input
                  type="email" placeholder="usuario@santafe.gov.ar"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  style={inputStyle} required
                />
              </div>
              <div>
                <label style={labelStyle}>Contraseña *</label>
                <input
                  type="password" placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  style={inputStyle} required minLength={8}
                />
              </div>
              <div>
                <label style={labelStyle}>Rol *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value, circunscripcionId: '' }))}
                  style={inputStyle}
                >
                  <option value="operator">Operador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {form.role === 'operator' && (
                <div>
                  <label style={labelStyle}>Circunscripción *</label>
                  <select
                    value={form.circunscripcionId}
                    onChange={(e) => setForm((f) => ({ ...f, circunscripcionId: e.target.value }))}
                    style={inputStyle} required
                  >
                    <option value="">Seleccioná una circunscripción</option>
                    {circunscripciones.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {formError && (
              <div style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid rgba(200,16,46,.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '9px 18px', borderRadius: 'var(--radius-sm)', background: '#fff', color: 'var(--gray-500)', border: '1px solid var(--gray-300)', fontFamily: 'var(--font)', fontSize: 13.5, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={formLoading}
                style={{ padding: '9px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: '#fff', border: 'none', fontFamily: 'var(--font)', fontSize: 13.5, fontWeight: 600, cursor: formLoading ? 'default' : 'pointer', opacity: formLoading ? .7 : 1 }}>
                {formLoading ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)', overflow: 'auto' }}>
        {error ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--accent)', fontSize: 13 }}>{error}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                {['Email', 'Rol', 'Circunscripción', 'Estado', 'Creado', 'Acción'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--gray-100)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                    Cargando...
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                    No hay usuarios internos registrados.
                  </td>
                </tr>
              ) : (
                usuarios.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < usuarios.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--gray-800)' }}>{u.email}</td>
                                        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                        background: u.role === 'admin' ? 'var(--accent-light)' : 'var(--primary-xlight)',
                        color:      u.role === 'admin' ? 'var(--accent)'       : 'var(--primary)',
                      }}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--gray-600)' }}>
                      {u.circunscripcionId
                        ? (circunscripciones.find((c) => c.id === u.circunscripcionId)?.nombre ?? `#${u.circunscripcionId}`)
                        : <span style={{ color: 'var(--gray-400)' }}>Global</span>}
                    </td>
                                        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                        background: u.activo ? 'var(--success-light)' : 'var(--gray-100)',
                        color:      u.activo ? 'var(--success)'       : 'var(--gray-500)',
                      }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12.5, color: 'var(--gray-500)' }}>
                      {formatDate(u.createdAt)}
                    </td>
                                        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      {u.id === user?.id ? (
                        <span style={{ fontSize: 12, color: 'var(--gray-400)', fontStyle: 'italic' }}>
                          Tu cuenta
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggle(u)}
                          disabled={toggling === u.id}
                          style={{
                            padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12.5, fontWeight: 600,
                            whiteSpace: 'nowrap',
                            cursor: toggling === u.id ? 'default' : 'pointer',
                            border: `1px solid ${u.activo ? 'var(--accent)' : 'var(--success)'}`,
                            background: 'transparent',
                            color: u.activo ? 'var(--accent)' : 'var(--success)',
                            opacity: toggling === u.id ? .6 : 1,
                          }}
                        >
                          {toggling === u.id ? '...' : u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}