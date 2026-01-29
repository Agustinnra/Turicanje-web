'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import FormularioCompletoNegocio from '@/components/FormularioCompletoNegocio';
import './editar-negocio.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface UsuarioAsignado {
  id: number;
  nombre_contacto: string;
  email: string;
  telefono: string;
  role: string;
}

interface UsuarioDisponible {
  id: number;
  nombre_contacto: string;
  email: string;
  place_id: string | null;
}

export default function EditarNegocioPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [negocio, setNegocio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<any>(null);
  
  // Estados para gestión de usuario del negocio
  const [usuarioAsignado, setUsuarioAsignado] = useState<UsuarioAsignado | null>(null);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<UsuarioDisponible[]>([]);
  const [modalUsuarioVisible, setModalUsuarioVisible] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number | null>(null);
  const [cambiandoUsuario, setCambiandoUsuario] = useState(false);
  const [mensajeUsuario, setMensajeUsuario] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Verificar que es admin
        const authRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!authRes.ok) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        const authData = await authRes.json();
        if (!['admin', 'super_admin'].includes(authData.usuario.role)) {
          router.push('/comercios/dashboard');
          return;
        }

        setUsuario(authData.usuario);

        // Cargar datos del negocio
        const negocioRes = await fetch(`${API_URL}/api/comercios/admin/negocio/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!negocioRes.ok) {
          if (negocioRes.status === 404) {
            setError('Negocio no encontrado');
          } else {
            setError('Error al cargar el negocio');
          }
          return;
        }

        const negocioData = await negocioRes.json();
        setNegocio(negocioData.negocio);

        // Cargar usuario asignado al negocio
        const usuarioNegocioRes = await fetch(`${API_URL}/api/comercios/admin/negocio/${id}/usuario`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (usuarioNegocioRes.ok) {
          const usuarioData = await usuarioNegocioRes.json();
          setUsuarioAsignado(usuarioData.usuario);
        }

      } catch (err) {
        console.error('Error:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id, router]);

  const handleGuardar = async (datos: any) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await fetch(`${API_URL}/api/comercios/admin/negocio/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al guardar');
    }

    // Recargar datos actualizados
    const negocioRes = await fetch(`${API_URL}/api/comercios/admin/negocio/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (negocioRes.ok) {
      const negocioData = await negocioRes.json();
      setNegocio(negocioData.negocio);
    }
  };

  const handleCancelar = () => {
    router.push('/admin');
  };

  // Funciones para gestión de usuario
  const abrirModalUsuario = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/comercios/admin/usuarios-disponibles?incluir_asignados=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsuariosDisponibles(data.usuarios);
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }

    setUsuarioSeleccionado(usuarioAsignado?.id || null);
    setModalUsuarioVisible(true);
    setMensajeUsuario(null);
  };

  const cambiarUsuario = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setCambiandoUsuario(true);
    setMensajeUsuario(null);

    try {
      const res = await fetch(`${API_URL}/api/comercios/admin/negocio/${id}/usuario`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario_id: usuarioSeleccionado })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al cambiar usuario');
      }

      setMensajeUsuario({ tipo: 'exito', texto: data.message });

      // Actualizar usuario asignado
      if (usuarioSeleccionado) {
        const nuevoUsuario = usuariosDisponibles.find(u => u.id === usuarioSeleccionado);
        setUsuarioAsignado(nuevoUsuario as any);
      } else {
        setUsuarioAsignado(null);
      }

      setTimeout(() => {
        setModalUsuarioVisible(false);
      }, 1500);

    } catch (err: any) {
      setMensajeUsuario({ tipo: 'error', texto: err.message });
    } finally {
      setCambiandoUsuario(false);
    }
  };

  if (loading) {
    return (
      <div className="editar-loading">
        <div className="spinner"></div>
        <p>Cargando negocio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editar-error">
        <div className="error-icon">❌</div>
        <h2>{error}</h2>
        <button onClick={() => router.push('/admin')} className="btn-volver">
          ← Volver al Admin
        </button>
      </div>
    );
  }

  return (
    <div className="editar-negocio-page">
      {/* Header */}
      <header className="editar-header">
        <div className="editar-header-left">
          <button onClick={() => router.push('/admin')} className="btn-back">
            ← Admin
          </button>
          <h1>Editar Negocio</h1>
          <span className="negocio-badge">
            <span className="badge-label">ID:</span>
            <span className="badge-value">{id}</span>
          </span>
        </div>
        <div className="editar-header-right">
          {negocio?.is_active ? (
            <span className="status-activo">✅ Activo</span>
          ) : (
            <span className="status-inactivo">❌ Inactivo</span>
          )}
        </div>
      </header>

      {/* Formulario */}
      <div className="editar-content">
        {/* Sección Usuario Asignado */}
        <div className="usuario-asignado-section">
          <div className="usuario-asignado-header">
            <h3>👤 Usuario Asignado</h3>
            <button className="btn-cambiar-usuario" onClick={abrirModalUsuario}>
              {usuarioAsignado ? '🔄 Cambiar' : '➕ Asignar'}
            </button>
          </div>
          {usuarioAsignado ? (
            <div className="usuario-asignado-info">
              <div className="usuario-avatar">
                {usuarioAsignado.nombre_contacto?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="usuario-datos">
                <strong>{usuarioAsignado.nombre_contacto || 'Sin nombre'}</strong>
                <span>{usuarioAsignado.email}</span>
                {usuarioAsignado.telefono && <span>📞 {usuarioAsignado.telefono}</span>}
              </div>
              <span className={`role-badge role-${usuarioAsignado.role}`}>
                {usuarioAsignado.role}
              </span>
            </div>
          ) : (
            <div className="usuario-asignado-empty">
              <span>⚠️ Sin usuario asignado</span>
              <p>Este negocio no tiene un usuario vinculado para administrarlo.</p>
            </div>
          )}
        </div>

        {negocio && (
          <FormularioCompletoNegocio
            negocio={negocio}
            onGuardar={handleGuardar}
            onCancelar={handleCancelar}
            modoAdmin={true}
          />
        )}
      </div>

      {/* Modal Cambiar Usuario */}
      {modalUsuarioVisible && (
        <div className="modal-overlay" onClick={() => setModalUsuarioVisible(false)}>
          <div className="modal-usuario" onClick={e => e.stopPropagation()}>
            <div className="modal-usuario-header">
              <h2>👤 {usuarioAsignado ? 'Cambiar Usuario' : 'Asignar Usuario'}</h2>
              <button className="modal-close" onClick={() => setModalUsuarioVisible(false)}>✕</button>
            </div>

            <div className="modal-usuario-body">
              {mensajeUsuario && (
                <div className={`mensaje-usuario ${mensajeUsuario.tipo}`}>
                  {mensajeUsuario.tipo === 'exito' ? '✅' : '❌'} {mensajeUsuario.texto}
                </div>
              )}

              <div className="usuario-select-group">
                <label>Seleccionar usuario:</label>
                <select 
                  value={usuarioSeleccionado || ''} 
                  onChange={e => setUsuarioSeleccionado(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">-- Sin usuario (desvincular) --</option>
                  {usuariosDisponibles.map(u => (
                    <option 
                      key={u.id} 
                      value={u.id}
                      disabled={u.place_id && u.place_id !== id}
                    >
                      {u.nombre_contacto || u.email} 
                      {u.place_id && u.place_id !== id ? ` (asignado a ${u.place_id})` : ''}
                      {u.place_id === id ? ' ✓ (actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {usuarioAsignado && usuarioSeleccionado === null && (
                <div className="advertencia-desvincular">
                  ⚠️ Vas a desvincular a <strong>{usuarioAsignado.email}</strong> de este negocio.
                  Su rol cambiará a "usuario" y ya no podrá administrar este negocio.
                </div>
              )}
            </div>

            <div className="modal-usuario-footer">
              <button 
                className="btn-cancelar" 
                onClick={() => setModalUsuarioVisible(false)}
                disabled={cambiandoUsuario}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar"
                onClick={cambiarUsuario}
                disabled={cambiandoUsuario}
              >
                {cambiandoUsuario ? '⏳ Guardando...' : '✓ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}