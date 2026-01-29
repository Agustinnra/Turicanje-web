'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import './solicitudes.css';

interface Solicitud {
  invitacion_id: number;
  codigo: string;
  place_id: string;
  nombre_negocio: string;
  categoria: string;
  direccion: string;
  telefono_negocio: string;
  telefono_invitado: string;
  email: string;
  nombre_invitado: string;
  preferencia_contacto: string;
  fecha_solicitud: string;
  foto: string | null;
  horario: string | null;
  productos: string[] | null;
  colonia: string | null;
  ciudad: string | null;
  estado: string | null;
  latitud: number | null;
  longitud: number | null;
}

interface SolicitudesPendientesProps {
  token: string;
  apiUrl: string;
  onMensaje: (texto: string, tipo: 'success' | 'error') => void;
  onRefresh?: () => void;
}

export default function SolicitudesPendientes({ 
  token, 
  apiUrl, 
  onMensaje,
  onRefresh 
}: SolicitudesPendientesProps) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [modalSolicitud, setModalSolicitud] = useState<Solicitud | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showRechazoModal, setShowRechazoModal] = useState(false);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/comercios/admin/solicitudes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al cargar solicitudes');

      const data = await res.json();
      setSolicitudes(data.solicitudes || []);
    } catch (error) {
      console.error('Error:', error);
      onMensaje('Error al cargar solicitudes pendientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const aprobarSolicitud = async (invitacionId: number) => {
    if (!confirm('¿Aprobar esta solicitud? El negocio quedará activo y se enviará el código de acceso.')) return;

    try {
      setProcesando(invitacionId);
      const res = await fetch(`${apiUrl}/api/comercios/admin/solicitud/${invitacionId}/aprobar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al aprobar');

      onMensaje(`✅ Solicitud aprobada: ${data.negocio?.nombre || 'Negocio'}
${data.envio?.success ? `📨 Código enviado por ${data.envio.method} a ${data.envio.to}` : '⚠️ Código no enviado automáticamente'}
🔗 Link: ${data.link_registro || ''}
🎫 Código: ${data.invitacion?.codigo}`, 'success');
      
      setSolicitudes(prev => prev.filter(s => s.invitacion_id !== invitacionId));
      setModalSolicitud(null);
      if (onRefresh) onRefresh();
    } catch (error: any) {
      onMensaje(error.message || 'Error al aprobar solicitud', 'error');
    } finally {
      setProcesando(null);
    }
  };

  const rechazarSolicitud = async (invitacionId: number) => {
    try {
      setProcesando(invitacionId);
      const res = await fetch(`${apiUrl}/api/comercios/admin/solicitud/${invitacionId}/rechazar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoRechazo })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al rechazar');

      onMensaje(`Solicitud rechazada`, 'success');
      setSolicitudes(prev => prev.filter(s => s.invitacion_id !== invitacionId));
      setModalSolicitud(null);
      setShowRechazoModal(false);
      setMotivoRechazo('');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      onMensaje(error.message || 'Error al rechazar solicitud', 'error');
    } finally {
      setProcesando(null);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatProductos = (productos: string[] | null) => {
    if (!productos || productos.length === 0) return 'No especificados';
    return productos.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');
  };

  if (loading) {
    return (
      <div className="solicitudes-loading">
        <div className="loading-spinner"></div>
        <p>Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="solicitudes-container">
      <div className="solicitudes-header">
        <h2>📋 Solicitudes de Afiliación Pendientes</h2>
        <button onClick={cargarSolicitudes} className="btn-refresh">🔄 Actualizar</button>
      </div>

      {solicitudes.length === 0 ? (
        <div className="solicitudes-empty">
          <span className="empty-icon">✅</span>
          <p>No hay solicitudes pendientes</p>
          <span className="empty-sub">Las nuevas solicitudes aparecerán aquí</span>
        </div>
      ) : (
        <div className="solicitudes-grid">
          {solicitudes.map((sol) => (
            <div key={sol.invitacion_id} className="solicitud-card">
              <div className="solicitud-imagen">
                {sol.foto ? (
                  <Image src={sol.foto} alt={sol.nombre_negocio} fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="solicitud-no-imagen">🏪</div>
                )}
                <span className="solicitud-categoria">{sol.categoria}</span>
              </div>
              
              <div className="solicitud-info">
                <h3 className="solicitud-nombre">{sol.nombre_negocio}</h3>
                <p className="solicitud-direccion">📍 {sol.direccion}</p>
                <p className="solicitud-contacto">👤 {sol.nombre_invitado}</p>
                <p className="solicitud-contacto">
                  {sol.preferencia_contacto === 'email' ? '📧' : '📱'} 
                  {sol.preferencia_contacto === 'email' ? sol.email : sol.telefono_invitado}
                </p>
                <p className="solicitud-fecha">🕐 {formatFecha(sol.fecha_solicitud)}</p>
              </div>

              <div className="solicitud-acciones">
                <button className="btn-ver" onClick={() => setModalSolicitud(sol)}>
                  👁️ Ver detalle
                </button>
                <button className="btn-aprobar" onClick={() => aprobarSolicitud(sol.invitacion_id)}
                  disabled={procesando === sol.invitacion_id}>
                  {procesando === sol.invitacion_id ? '⏳' : '✅'} Aprobar
                </button>
                <button className="btn-rechazar" onClick={() => { setModalSolicitud(sol); setShowRechazoModal(true); }}
                  disabled={procesando === sol.invitacion_id}>
                  ❌ Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detalle Completo */}
      {modalSolicitud && !showRechazoModal && (
        <div className="solicitud-modal-overlay" onClick={() => setModalSolicitud(null)}>
          <div className="solicitud-modal detalle-completo" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalSolicitud(null)}>✕</button>
            
            <div className="modal-header-detalle">
              <h2>📋 Detalle de Solicitud</h2>
              <span className="modal-fecha">Recibida: {formatFecha(modalSolicitud.fecha_solicitud)}</span>
            </div>

            <div className="modal-body-detalle">
              {/* Foto del negocio */}
              {modalSolicitud.foto && (
                <div className="detalle-foto-container">
                  <Image
                    src={modalSolicitud.foto}
                    alt="Foto del negocio"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              )}

              {/* SECCIÓN: Datos del Negocio */}
              <div className="detalle-seccion">
                <h3>🏪 Datos del Negocio</h3>
                <div className="detalle-grid">
                  <div className="detalle-item">
                    <label>Nombre del negocio</label>
                    <span>{modalSolicitud.nombre_negocio}</span>
                  </div>
                  <div className="detalle-item">
                    <label>Categoría</label>
                    <span>{modalSolicitud.categoria}</span>
                  </div>
                  <div className="detalle-item full">
                    <label>Dirección</label>
                    <span>{modalSolicitud.direccion}</span>
                  </div>
                  {(modalSolicitud.colonia || modalSolicitud.ciudad) && (
                    <div className="detalle-item full">
                      <label>Ubicación</label>
                      <span>
                        {[modalSolicitud.colonia, modalSolicitud.ciudad, modalSolicitud.estado]
                          .filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="detalle-item">
                    <label>Teléfono del negocio</label>
                    <span>{modalSolicitud.telefono_negocio || 'No proporcionado'}</span>
                  </div>
                  <div className="detalle-item full">
                    <label>Horario</label>
                    <span className="horario-text">{modalSolicitud.horario || 'No especificado'}</span>
                  </div>
                  <div className="detalle-item full">
                    <label>Productos / Especialidades</label>
                    <span>{formatProductos(modalSolicitud.productos)}</span>
                  </div>
                  {modalSolicitud.latitud && modalSolicitud.longitud && (
                    <div className="detalle-item">
                      <label>Mapa</label>
                      <a 
                        href={`https://www.google.com/maps?q=${modalSolicitud.latitud},${modalSolicitud.longitud}`}
                        target="_blank" rel="noopener noreferrer" className="mapa-link">
                        📍 Ver en Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN: Datos del Dueño/Contacto */}
              <div className="detalle-seccion">
                <h3>👤 Datos del Dueño / Contacto</h3>
                <div className="detalle-grid">
                  <div className="detalle-item">
                    <label>Nombre completo</label>
                    <span>{modalSolicitud.nombre_invitado}</span>
                  </div>
                  <div className="detalle-item">
                    <label>Email</label>
                    <span>{modalSolicitud.email}</span>
                  </div>
                  <div className="detalle-item">
                    <label>WhatsApp</label>
                    <span>{modalSolicitud.telefono_invitado}</span>
                  </div>
                  <div className="detalle-item">
                    <label>Prefiere que lo contacten por</label>
                    <span className={`preferencia-badge ${modalSolicitud.preferencia_contacto}`}>
                      {modalSolicitud.preferencia_contacto === 'email' ? '📧 Email' : '📱 WhatsApp'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: Info de la Solicitud */}
              <div className="detalle-seccion">
                <h3>📄 Información de la Solicitud</h3>
                <div className="detalle-grid">
                  <div className="detalle-item">
                    <label>ID del negocio</label>
                    <span className="codigo">{modalSolicitud.place_id}</span>
                  </div>
                  <div className="detalle-item">
                    <label>Código de invitación</label>
                    <span className="codigo">{modalSolicitud.codigo}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-detalle">
              <button className="btn-aprobar-grande" onClick={() => aprobarSolicitud(modalSolicitud.invitacion_id)}
                disabled={procesando === modalSolicitud.invitacion_id}>
                {procesando === modalSolicitud.invitacion_id ? '⏳ Procesando...' : '✅ Aprobar Solicitud'}
              </button>
              <button className="btn-rechazar-grande" onClick={() => setShowRechazoModal(true)}
                disabled={procesando === modalSolicitud.invitacion_id}>
                ❌ Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazo */}
      {showRechazoModal && modalSolicitud && (
        <div className="solicitud-modal-overlay" onClick={() => { setShowRechazoModal(false); setMotivoRechazo(''); }}>
          <div className="solicitud-modal rechazo" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setShowRechazoModal(false); setMotivoRechazo(''); }}>✕</button>
            
            <div className="modal-header rechazo">
              <h2>❌ Rechazar Solicitud</h2>
              <p>{modalSolicitud.nombre_negocio}</p>
            </div>

            <div className="modal-body">
              <label className="rechazo-label">Motivo del rechazo (opcional):</label>
              <textarea
                className="rechazo-textarea"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Ej: Información incompleta, negocio duplicado, etc."
                rows={4}
              />
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => { setShowRechazoModal(false); setMotivoRechazo(''); }}>
                Cancelar
              </button>
              <button className="btn-rechazar-confirmar" onClick={() => rechazarSolicitud(modalSolicitud.invitacion_id)}
                disabled={procesando === modalSolicitud.invitacion_id}>
                {procesando === modalSolicitud.invitacion_id ? '⏳ Procesando...' : '❌ Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}