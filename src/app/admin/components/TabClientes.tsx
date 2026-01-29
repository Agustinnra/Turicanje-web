'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  codigo_qr: string;
  saldo_puntos: number;
  puntos_totales_ganados: number;
  puntos_totales_canjeados: number;
  suscripcion_activa: boolean;
  suscripcion_fecha_inicio: string;
  suscripcion_fecha_vencimiento: string;
  is_active: boolean;
  created_at: string;
  total_favoritos?: number;
  total_siguiendo?: number;
  total_transacciones?: number;
}

interface Transaccion {
  id: number;
  tipo: string;
  puntos: number;
  descripcion: string;
  comercio_nombre?: string;
  created_at: string;
}

interface Estadisticas {
  usuarios: {
    total_usuarios: number;
    usuarios_activos: number;
    usuarios_vencidos: number;
    usuarios_desactivados: number;
    puntos_circulando: number;
    puntos_totales_emitidos: number;
    puntos_totales_canjeados: number;
  };
  transacciones: {
    total_acumulaciones: number;
    total_canjes: number;
    total_penalidades: number;
    transacciones_mes: number;
  };
}

export default function TabClientes() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [buscar, setBuscar] = useState('');
  const [filtroSuscripcion, setFiltroSuscripcion] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [orden, setOrden] = useState('reciente');
  
  // Modal de detalle
  const [modalDetalle, setModalDetalle] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Modal de ajuste de puntos
  const [modalAjuste, setModalAjuste] = useState(false);
  const [ajustePuntos, setAjustePuntos] = useState({ puntos: '', descripcion: '', tipo: 'ajuste' });

  // Modal de penalidad
  const [modalPenalidad, setModalPenalidad] = useState(false);
  const [penalidad, setPenalidad] = useState({ porcentaje: '10', descripcion: '' });

  const [mensaje, setMensaje] = useState<{ tipo: string; texto: string } | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [filtroSuscripcion, filtroActivo, orden]);

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      // Cargar estadísticas
      const statsRes = await fetch(`${API_URL}/api/loyalty-users/estadisticas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setEstadisticas(stats);
      }

      // Cargar usuarios
      let url = `${API_URL}/api/loyalty-users?orden=${orden}`;
      if (filtroSuscripcion) url += `&suscripcion=${filtroSuscripcion}`;
      if (filtroActivo) url += `&activo=${filtroActivo}`;

      const usersRes = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const users = await usersRes.json();
        setUsuarios(users);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarUsuarios = async () => {
    if (!buscar.trim()) {
      cargarDatos();
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/loyalty-users?buscar=${encodeURIComponent(buscar)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const users = await res.json();
        setUsuarios(users);
      }
    } catch (error) {
      console.error('Error buscando:', error);
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalDetalle(true);
    setLoadingDetalle(true);

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/loyalty-users/${usuario.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarioSeleccionado(data.usuario);
        setTransacciones(data.transacciones || []);
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const toggleActivo = async (usuario: Usuario) => {
    const accion = usuario.is_active ? 'desactivar' : 'activar';
    if (!confirm(`¿Seguro que quieres ${accion} a ${usuario.nombre || usuario.email}?`)) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/loyalty-users/${usuario.id}/toggle-activo`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activo: !usuario.is_active })
      });

      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: `Usuario ${accion}do` });
        cargarDatos();
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar usuario' });
    }
  };

  const guardarAjustePuntos = async () => {
    if (!usuarioSeleccionado || !ajustePuntos.puntos || !ajustePuntos.descripcion) {
      setMensaje({ tipo: 'error', texto: 'Completa todos los campos' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/loyalty-users/${usuarioSeleccionado.id}/ajustar-puntos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ajustePuntos)
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: data.mensaje });
        setModalAjuste(false);
        setAjustePuntos({ puntos: '', descripcion: '', tipo: 'ajuste' });
        verDetalle(usuarioSeleccionado);
        cargarDatos();
      } else {
        setMensaje({ tipo: 'error', texto: data.error });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al ajustar puntos' });
    }
  };

  const aplicarPenalidad = async () => {
    if (!usuarioSeleccionado || !penalidad.porcentaje) {
      setMensaje({ tipo: 'error', texto: 'Indica el porcentaje' });
      return;
    }

    if (!confirm(`¿Aplicar penalidad de ${penalidad.porcentaje}% a ${usuarioSeleccionado.nombre}?`)) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/loyalty-users/${usuarioSeleccionado.id}/penalidad`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(penalidad)
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: data.mensaje });
        setModalPenalidad(false);
        setPenalidad({ porcentaje: '10', descripcion: '' });
        verDetalle(usuarioSeleccionado);
        cargarDatos();
      } else {
        setMensaje({ tipo: 'error', texto: data.error });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al aplicar penalidad' });
    }
  };

  const congelarPuntos = async () => {
    if (!usuarioSeleccionado) return;
    if (!confirm(`¿Congelar los puntos de ${usuarioSeleccionado.nombre}? Sus puntos quedarán en 0 hasta que renueve.`)) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/loyalty-users/${usuarioSeleccionado.id}/congelar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ congelar: true })
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: data.mensaje });
        verDetalle(usuarioSeleccionado);
        cargarDatos();
      } else {
        setMensaje({ tipo: 'error', texto: data.error || data.mensaje });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al congelar puntos' });
    }
  };

  const renovarSuscripcion = async () => {
    if (!usuarioSeleccionado) return;
    const meses = prompt('¿Cuántos meses renovar? (default: 12)', '12');
    if (!meses) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/loyalty-users/${usuarioSeleccionado.id}/renovar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ meses: parseInt(meses) })
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: data.mensaje });
        verDetalle(usuarioSeleccionado);
        cargarDatos();
      } else {
        setMensaje({ tipo: 'error', texto: data.error });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al renovar' });
    }
  };

  const exportarCSV = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    window.open(`${API_URL}/api/loyalty-users/exportar?token=${token}`, '_blank');
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX');
  };

  const formatPuntos = (puntos: number) => {
    return (puntos || 0).toLocaleString('es-MX');
  };

  // Auto-limpiar mensaje
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  return (
    <div className="tab-clientes">
      {/* Mensaje */}
      {mensaje && (
        <div className={`mensaje ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Estadísticas */}
      {estadisticas && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{estadisticas.usuarios.total_usuarios}</span>
            <span className="stat-label">Total Usuarios</span>
          </div>
          <div className="stat-card verde">
            <span className="stat-number">{estadisticas.usuarios.usuarios_activos}</span>
            <span className="stat-label">Suscripciones Activas</span>
          </div>
          <div className="stat-card rojo">
            <span className="stat-number">{estadisticas.usuarios.usuarios_vencidos}</span>
            <span className="stat-label">Suscripciones Vencidas</span>
          </div>
          <div className="stat-card morado">
            <span className="stat-number">{formatPuntos(estadisticas.usuarios.puntos_circulando)}</span>
            <span className="stat-label">Puntos Circulando</span>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filtros-bar">
        <div className="buscar-box">
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarUsuarios()}
          />
          <button onClick={buscarUsuarios}>🔍</button>
        </div>

        <select value={filtroSuscripcion} onChange={(e) => setFiltroSuscripcion(e.target.value)}>
          <option value="">Todas las suscripciones</option>
          <option value="activa">✅ Activas</option>
          <option value="vencida">❌ Vencidas</option>
        </select>

        <select value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value)}>
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Desactivados</option>
        </select>

        <select value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="reciente">Más recientes</option>
          <option value="puntos">Más puntos</option>
          <option value="nombre">Alfabético</option>
        </select>

        <button className="btn-exportar" onClick={exportarCSV}>
          📥 Exportar CSV
        </button>
      </div>

      {/* Tabla de usuarios */}
      {loading ? (
        <div className="loading">Cargando usuarios...</div>
      ) : usuarios.length === 0 ? (
        <div className="empty">No hay usuarios registrados</div>
      ) : (
        <table className="tabla-usuarios">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Contacto</th>
              <th>Puntos</th>
              <th>Suscripción</th>
              <th>Social</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(usuario => (
              <tr key={usuario.id} className={!usuario.is_active ? 'desactivado' : ''} style={{ backgroundColor: 'white' }}>
                <td style={{ color: '#333' }}>
                  <div className="usuario-info">
                    <strong style={{ color: '#1a1a1a', fontSize: '1rem', display: 'block' }}>{usuario.nombre || 'Sin nombre'}</strong>
                    <small style={{ color: '#666', fontSize: '0.8rem', display: 'block' }}>ID: {usuario.id}</small>
                  </div>
                </td>
                <td style={{ color: '#333' }}>
                  <div className="contacto-info">
                    <span style={{ color: '#1a1a1a', fontSize: '0.85rem', display: 'block' }}>📧 {usuario.email || '-'}</span>
                    <span style={{ color: '#1a1a1a', fontSize: '0.85rem', display: 'block' }}>📱 {usuario.telefono || '-'}</span>
                  </div>
                </td>
                <td style={{ color: '#333' }}>
                  <div className="puntos-info">
                    <strong style={{ color: '#6b3fa0', fontSize: '1.1rem', display: 'block' }}>{formatPuntos(usuario.saldo_puntos)} pts</strong>
                    <small style={{ color: '#666', fontSize: '0.8rem', display: 'block' }}>+{formatPuntos(usuario.puntos_totales_ganados)} / -{formatPuntos(usuario.puntos_totales_canjeados)}</small>
                  </div>
                </td>
                <td>
                  <span className={`badge ${usuario.suscripcion_activa ? 'activa' : 'vencida'}`}>
                    {usuario.suscripcion_activa ? '✅ Activa' : '❌ Vencida'}
                  </span>
                  <small style={{ display: 'block', color: '#666', fontSize: '0.8rem', marginTop: '4px' }}>Vence: {formatFecha(usuario.suscripcion_fecha_vencimiento)}</small>
                </td>
                <td>
                  <div className="social-info" style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ color: '#1a1a1a' }}>❤️ {usuario.total_favoritos || 0}</span>
                    <span style={{ color: '#1a1a1a' }}>👤 {usuario.total_siguiendo || 0}</span>
                  </div>
                </td>
                <td>
                  <div className="acciones-btns">
                    <button className="btn-ver" onClick={() => verDetalle(usuario)} title="Ver detalle">
                      👁️
                    </button>
                    <button 
                      className={`btn-toggle ${usuario.is_active ? 'activo' : 'inactivo'}`}
                      onClick={() => toggleActivo(usuario)}
                      title={usuario.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {usuario.is_active ? '🔓' : '🔒'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal de detalle */}
      {modalDetalle && usuarioSeleccionado && (
        <div className="modal-overlay" onClick={() => setModalDetalle(false)}>
          <div className="modal-detalle" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalDetalle(false)}>✕</button>
            
            <h2>👤 {usuarioSeleccionado.nombre || 'Usuario'}</h2>
            
            {loadingDetalle ? (
              <div className="loading">Cargando...</div>
            ) : (
              <>
                {/* Info principal */}
                <div className="detalle-grid">
                  <div className="detalle-card">
                    <h4>📋 Información</h4>
                    <p><strong>Email:</strong> {usuarioSeleccionado.email || '-'}</p>
                    <p><strong>Teléfono:</strong> {usuarioSeleccionado.telefono || '-'}</p>
                    <p><strong>Código QR:</strong> {usuarioSeleccionado.codigo_qr}</p>
                    <p><strong>Registro:</strong> {formatFecha(usuarioSeleccionado.created_at)}</p>
                  </div>
                  
                  <div className="detalle-card">
                    <h4>💰 Puntos</h4>
                    <p className="puntos-grande">{formatPuntos(usuarioSeleccionado.saldo_puntos)}</p>
                    <p><strong>Ganados:</strong> +{formatPuntos(usuarioSeleccionado.puntos_totales_ganados)}</p>
                    <p><strong>Canjeados:</strong> -{formatPuntos(usuarioSeleccionado.puntos_totales_canjeados)}</p>
                  </div>
                  
                  <div className="detalle-card">
                    <h4>📅 Suscripción</h4>
                    <span className={`badge grande ${usuarioSeleccionado.suscripcion_activa ? 'activa' : 'vencida'}`}>
                      {usuarioSeleccionado.suscripcion_activa ? '✅ Activa' : '❌ Vencida'}
                    </span>
                    <p><strong>Inicio:</strong> {formatFecha(usuarioSeleccionado.suscripcion_fecha_inicio)}</p>
                    <p><strong>Vencimiento:</strong> {formatFecha(usuarioSeleccionado.suscripcion_fecha_vencimiento)}</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="acciones-detalle">
                  <button className="btn-accion verde" onClick={() => setModalAjuste(true)}>
                    ➕ Ajustar Puntos
                  </button>
                  <button className="btn-accion rojo" onClick={() => setModalPenalidad(true)}>
                    ⚠️ Aplicar Penalidad
                  </button>
                  <button className="btn-accion naranja" onClick={congelarPuntos}>
                    🧊 Congelar Puntos
                  </button>
                  <button className="btn-accion azul" onClick={renovarSuscripcion}>
                    🔄 Renovar Suscripción
                  </button>
                </div>

                {/* Historial de transacciones */}
                <h4>📜 Últimas Transacciones</h4>
                {transacciones.length === 0 ? (
                  <p className="empty-small">Sin transacciones</p>
                ) : (
                  <table className="tabla-transacciones">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Puntos</th>
                        <th>Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transacciones.map(t => (
                        <tr key={t.id}>
                          <td>{formatFecha(t.created_at)}</td>
                          <td>
                            <span className={`tipo-badge ${t.tipo}`}>
                              {t.tipo === 'acumulacion' && '💰'}
                              {t.tipo === 'canje' && '🎁'}
                              {t.tipo === 'penalidad' && '⚠️'}
                              {t.tipo === 'ajuste' && '✏️'}
                              {t.tipo === 'congelacion' && '🧊'}
                              {' '}{t.tipo}
                            </span>
                          </td>
                          <td className={t.puntos >= 0 ? 'positivo' : 'negativo'}>
                            {t.puntos >= 0 ? '+' : ''}{formatPuntos(t.puntos)}
                          </td>
                          <td>{t.descripcion || t.comercio_nombre || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de ajuste de puntos */}
      {modalAjuste && (
        <div className="modal-overlay" onClick={() => setModalAjuste(false)}>
          <div className="modal-ajuste" onClick={(e) => e.stopPropagation()}>
            <h3>➕ Ajustar Puntos</h3>
            <p>Usuario: <strong>{usuarioSeleccionado?.nombre}</strong></p>
            <p>Saldo actual: <strong>{formatPuntos(usuarioSeleccionado?.saldo_puntos || 0)} pts</strong></p>
            
            <label>Tipo de ajuste:</label>
            <select 
              value={ajustePuntos.tipo}
              onChange={(e) => setAjustePuntos({...ajustePuntos, tipo: e.target.value})}
            >
              <option value="ajuste">Ajuste manual</option>
              <option value="bonus">Bonus / Promoción</option>
              <option value="correccion">Corrección</option>
            </select>

            <label>Puntos (positivo para agregar, negativo para quitar):</label>
            <input
              type="number"
              placeholder="Ej: 100 o -50"
              value={ajustePuntos.puntos}
              onChange={(e) => setAjustePuntos({...ajustePuntos, puntos: e.target.value})}
            />

            <label>Descripción (requerida):</label>
            <textarea
              placeholder="Motivo del ajuste..."
              value={ajustePuntos.descripcion}
              onChange={(e) => setAjustePuntos({...ajustePuntos, descripcion: e.target.value})}
            />

            <div className="modal-buttons">
              <button className="btn-cancelar" onClick={() => setModalAjuste(false)}>Cancelar</button>
              <button className="btn-guardar" onClick={guardarAjustePuntos}>Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de penalidad */}
      {modalPenalidad && (
        <div className="modal-overlay" onClick={() => setModalPenalidad(false)}>
          <div className="modal-ajuste" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Aplicar Penalidad</h3>
            <p>Usuario: <strong>{usuarioSeleccionado?.nombre}</strong></p>
            <p>Saldo actual: <strong>{formatPuntos(usuarioSeleccionado?.saldo_puntos || 0)} pts</strong></p>
            
            <label>Porcentaje de penalidad:</label>
            <select 
              value={penalidad.porcentaje}
              onChange={(e) => setPenalidad({...penalidad, porcentaje: e.target.value})}
            >
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="15">15%</option>
              <option value="20">20%</option>
              <option value="25">25%</option>
              <option value="50">50%</option>
            </select>

            <p className="preview-penalidad">
              Penalidad: <strong>-{formatPuntos(Math.round((usuarioSeleccionado?.saldo_puntos || 0) * (parseInt(penalidad.porcentaje) / 100)))} pts</strong>
            </p>

            <label>Descripción (opcional):</label>
            <textarea
              placeholder="Motivo de la penalidad..."
              value={penalidad.descripcion}
              onChange={(e) => setPenalidad({...penalidad, descripcion: e.target.value})}
            />

            <div className="modal-buttons">
              <button className="btn-cancelar" onClick={() => setModalPenalidad(false)}>Cancelar</button>
              <button className="btn-guardar rojo" onClick={aplicarPenalidad}>Aplicar Penalidad</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .tab-clientes {
          padding: 20px;
        }

        .mensaje {
          padding: 12px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
        }
        .mensaje.exito { background: #d4edda; color: #155724; }
        .mensaje.error { background: #f8d7da; color: #721c24; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .stat-card.verde { border-left: 4px solid #22c55e; }
        .stat-card.rojo { border-left: 4px solid #ef4444; }
        .stat-card.morado { border-left: 4px solid #8b5cf6; }

        .stat-number {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          color: #333;
        }
        .stat-label {
          font-size: 0.85rem;
          color: #666;
        }

        .filtros-bar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          align-items: center;
        }

        .buscar-box {
          display: flex;
          flex: 1;
          min-width: 250px;
        }
        .buscar-box input {
          flex: 1;
          padding: 10px 15px;
          border: 1px solid #ddd;
          border-radius: 8px 0 0 8px;
          font-size: 14px;
        }
        .buscar-box button {
          padding: 10px 15px;
          background: #6b3fa0;
          color: white;
          border: none;
          border-radius: 0 8px 8px 0;
          cursor: pointer;
        }

        .filtros-bar select {
          padding: 10px 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          background: white;
        }

        .btn-exportar {
          padding: 10px 20px;
          background: #22c55e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .loading, .empty {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .tabla-usuarios {
          width: 100%;
          border-collapse: collapse;
          background: white !important;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .tabla-usuarios th {
          background: #f8f9fa !important;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #333 !important;
          border-bottom: 2px solid #eee;
        }

        .tabla-usuarios td {
          padding: 15px;
          border-bottom: 1px solid #eee;
          vertical-align: middle;
          color: #333 !important;
          background: white !important;
        }

        .tabla-usuarios tr {
          background: white !important;
        }

        .tabla-usuarios tr.desactivado {
          opacity: 0.5;
          background: #f5f5f5;
        }

        .usuario-info, .contacto-info, .puntos-info, .social-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .usuario-info strong {
          color: #333;
          font-size: 1rem;
        }
        .usuario-info small {
          color: #888;
          font-size: 0.8rem;
        }
        .contacto-info span {
          font-size: 0.85rem;
          color: #555;
        }
        .puntos-info strong {
          color: #6b3fa0;
          font-size: 1.1rem;
        }
        .puntos-info small {
          color: #888;
          font-size: 0.8rem;
        }
        .social-info {
          flex-direction: row;
          gap: 15px;
        }
        .social-info span {
          font-size: 0.85rem;
          color: #555;
        }

        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        .badge.activa { background: #d4edda; color: #155724; }
        .badge.vencida { background: #f8d7da; color: #721c24; }
        .badge.grande { font-size: 1rem; padding: 8px 15px; }

        .acciones-btns {
          display: flex;
          gap: 8px;
        }
        .acciones-btns button {
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.1rem;
        }
        .btn-ver { background: #e0e7ff; }
        .btn-toggle.activo { background: #fef3c7; }
        .btn-toggle.inactivo { background: #fee2e2; }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-detalle {
          background: white;
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 30px;
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }

        .modal-detalle h2 {
          margin-bottom: 20px;
          color: #333;
        }

        .detalle-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .detalle-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
        }
        .detalle-card h4 {
          margin: 0 0 15px;
          color: #333;
        }
        .detalle-card p {
          margin: 8px 0;
          color: #555;
        }
        .puntos-grande {
          font-size: 2rem;
          font-weight: 700;
          color: #6b3fa0;
        }

        .acciones-detalle {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 25px;
        }
        .btn-accion {
          padding: 10px 18px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          color: white;
        }
        .btn-accion.verde { background: #22c55e; }
        .btn-accion.rojo { background: #ef4444; }
        .btn-accion.naranja { background: #f97316; }
        .btn-accion.azul { background: #3b82f6; }

        .tabla-transacciones {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        .tabla-transacciones th {
          background: #f1f5f9;
          padding: 10px;
          text-align: left;
        }
        .tabla-transacciones td {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        .positivo { color: #22c55e; font-weight: 600; }
        .negativo { color: #ef4444; font-weight: 600; }

        .tipo-badge {
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
        }
        .tipo-badge.acumulacion { background: #d4edda; }
        .tipo-badge.canje { background: #cce5ff; }
        .tipo-badge.penalidad { background: #f8d7da; }
        .tipo-badge.ajuste { background: #fff3cd; }
        .tipo-badge.congelacion { background: #e2e8f0; }

        .empty-small {
          text-align: center;
          color: #888;
          padding: 20px;
        }

        /* Modal ajuste */
        .modal-ajuste {
          background: white;
          border-radius: 16px;
          max-width: 450px;
          width: 100%;
          padding: 30px;
        }
        .modal-ajuste h3 {
          margin: 0 0 15px;
        }
        .modal-ajuste label {
          display: block;
          margin-top: 15px;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }
        .modal-ajuste input,
        .modal-ajuste select,
        .modal-ajuste textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }
        .modal-ajuste textarea {
          min-height: 80px;
          resize: vertical;
        }
        .preview-penalidad {
          background: #fee2e2;
          padding: 10px;
          border-radius: 8px;
          margin-top: 10px;
        }
        .modal-buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .btn-cancelar {
          flex: 1;
          padding: 12px;
          background: #f1f5f9;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn-guardar {
          flex: 1;
          padding: 12px;
          background: #6b3fa0;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-guardar.rojo { background: #ef4444; }

        @media (max-width: 768px) {
          .filtros-bar {
            flex-direction: column;
          }
          .buscar-box {
            width: 100%;
          }
          .tabla-usuarios {
            font-size: 0.85rem;
          }
          .tabla-usuarios th:nth-child(5),
          .tabla-usuarios td:nth-child(5) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}