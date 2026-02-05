'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

interface Reporte {
  id: number;
  nombre_negocio: string;
  place_id: string | null;
  tipo_reporte: string;
  descripcion: string | null;
  telefono_reportante: string | null;
  email_reportante: string | null;
  foto_url: string | null;
  estado: string;
  codigo_generado: string | null;
  revisado: boolean;
  notas_admin: string | null;
  created_at: string;
  eliminar_at: string;
}

const TIPO_LABELS: Record<string, { label: string; icon: string }> = {
  cerrado_permanente: { label: 'Cerró permanentemente', icon: '🚫' },
  cambio_horario: { label: 'Cambió horario', icon: '🕐' },
  cambio_menu: { label: 'Cambió menú/precios', icon: '🍽️' },
  info_incorrecta: { label: 'Info incorrecta', icon: '❌' },
  recomendar_nuevo: { label: 'Lugar nuevo', icon: '✨' },
  otro: { label: 'Otro', icon: '💬' },
};

const ESTADO_COLORS: Record<string, { bg: string; color: string }> = {
  pendiente: { bg: '#fef3c7', color: '#92400e' },
  aprobado: { bg: '#d1fae5', color: '#065f46' },
  rechazado: { bg: '#fee2e2', color: '#991b1b' },
  duplicado: { bg: '#e5e7eb', color: '#374151' },
};

export default function TabReportes() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>('pendiente');
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [modalFoto, setModalFoto] = useState<string | null>(null);
  const [notasTemp, setNotasTemp] = useState<Record<number, string>>({});

  const cargarReportes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = filtro === 'todos' ? '' : `?revisado=${filtro === 'pendiente' ? 'false' : 'true'}`;
      const res = await fetch(`${API_URL}/api/reportes${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        let reportesFiltrados = data.reportes || [];
        
        // Filtrar por estado si no es "todos"
        if (filtro !== 'todos' && filtro !== 'pendiente') {
          reportesFiltrados = reportesFiltrados.filter((r: Reporte) => r.estado === filtro);
        }
        
        setReportes(reportesFiltrados);
      }
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, [filtro]);

  const revisarReporte = async (id: number, accion: 'aprobado' | 'rechazado' | 'duplicado') => {
    setProcesando(id);
    setMensaje(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/reportes/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          revisado: true,
          accion_tomada: accion,
          notas_admin: notasTemp[id] || null,
          revisado_por: 'admin',
          // Si se aprueba, el backend genera el código
          generar_codigo: accion === 'aprobado'
        })
      });

      if (!res.ok) throw new Error('Error al procesar reporte');

      const data = await res.json();
      
      if (accion === 'aprobado' && data.reporte?.codigo_generado) {
        setMensaje({ 
          tipo: 'exito', 
          texto: `✅ Reporte aprobado. Código generado: ${data.reporte.codigo_generado}` 
        });
      } else if (accion === 'aprobado') {
        setMensaje({ tipo: 'exito', texto: '✅ Reporte aprobado' });
      } else if (accion === 'rechazado') {
        setMensaje({ tipo: 'exito', texto: '❌ Reporte rechazado' });
      } else {
        setMensaje({ tipo: 'exito', texto: '🔄 Marcado como duplicado' });
      }

      // Recargar
      await cargarReportes();
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ ${error.message}` });
    } finally {
      setProcesando(null);
    }
  };

  const diasRestantes = (eliminarAt: string) => {
    const diff = new Date(eliminarAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const pendientes = reportes.filter(r => r.estado === 'pendiente').length;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>⏳ Cargando reportes...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0, color: '#1f2937' }}>
          📋 Reportes de Usuarios
          {pendientes > 0 && (
            <span style={{
              background: '#ef4444',
              color: 'white',
              borderRadius: '999px',
              padding: '2px 10px',
              fontSize: '0.8rem',
              marginLeft: '0.5rem',
              verticalAlign: 'middle'
            }}>
              {pendientes} pendientes
            </span>
          )}
        </h2>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['pendiente', 'aprobado', 'rechazado', 'todos'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: filtro === f ? '2px solid #ec4899' : '1px solid #e5e7eb',
                background: filtro === f ? '#fdf2f8' : 'white',
                color: filtro === f ? '#be185d' : '#6b7280',
                fontWeight: filtro === f ? 600 : 400,
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              {f === 'pendiente' && '⏳ '}
              {f === 'aprobado' && '✅ '}
              {f === 'rechazado' && '❌ '}
              {f === 'todos' && '📋 '}
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div style={{
          padding: '1rem',
          borderRadius: '0.75rem',
          marginBottom: '1rem',
          background: mensaje.tipo === 'exito' ? '#d1fae5' : '#fee2e2',
          color: mensaje.tipo === 'exito' ? '#065f46' : '#991b1b',
          border: `1px solid ${mensaje.tipo === 'exito' ? '#6ee7b7' : '#fca5a5'}`
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Info sobre limpieza */}
      <div style={{
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        fontSize: '0.85rem',
        color: '#0369a1'
      }}>
        ℹ️ Los reportes se eliminan automáticamente <strong>30 días</strong> después de crearse. Los códigos no canjeados también expiran a los 30 días.
      </div>

      {/* Lista de reportes */}
      {reportes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          {filtro === 'pendiente' ? '🎉 No hay reportes pendientes' : 'No hay reportes con este filtro'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reportes.map(reporte => {
            const tipo = TIPO_LABELS[reporte.tipo_reporte] || { label: reporte.tipo_reporte, icon: '📝' };
            const estadoColor = ESTADO_COLORS[reporte.estado] || ESTADO_COLORS.pendiente;
            const dias = diasRestantes(reporte.eliminar_at);

            return (
              <div
                key={reporte.id}
                style={{
                  background: 'white',
                  borderRadius: '1rem',
                  border: '1px solid #e5e7eb',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#1f2937' }}>
                      📍 {reporte.nombre_negocio}
                    </h3>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      background: '#fdf2f8',
                      color: '#be185d',
                      marginRight: '0.5rem'
                    }}>
                      {tipo.icon} {tipo.label}
                    </span>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: estadoColor.bg,
                      color: estadoColor.color
                    }}>
                      {reporte.estado}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#9ca3af' }}>
                    <div>{new Date(reporte.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    <div style={{ color: dias <= 7 ? '#ef4444' : '#9ca3af' }}>
                      ⏰ Se elimina en {dias} días
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                {reporte.descripcion && (
                  <div style={{
                    background: '#f9fafb',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    color: '#374151'
                  }}>
                    💬 {reporte.descripcion}
                  </div>
                )}

                {/* Fotos */}
                {reporte.foto_url && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {(() => {
                      try {
                        const urls = JSON.parse(reporte.foto_url);
                        return (Array.isArray(urls) ? urls : [reporte.foto_url]).map((url: string, i: number) => (
                          <img
                            key={i}
                            src={url}
                            alt={`Foto ${i + 1}`}
                            onClick={() => setModalFoto(url)}
                            style={{
                              width: '120px',
                              height: '120px',
                              borderRadius: '0.75rem',
                              objectFit: 'cover',
                              cursor: 'pointer',
                              border: '2px solid #e5e7eb'
                            }}
                          />
                        ));
                      } catch {
                        return (
                          <img
                            src={reporte.foto_url}
                            alt="Foto del reporte"
                            onClick={() => setModalFoto(reporte.foto_url)}
                            style={{
                              width: '120px',
                              height: '120px',
                              borderRadius: '0.75rem',
                              objectFit: 'cover',
                              cursor: 'pointer',
                              border: '2px solid #e5e7eb'
                            }}
                          />
                        );
                      }
                    })()}
                  </div>
                )}

                {/* Contacto */}
                {(reporte.telefono_reportante || reporte.email_reportante) && (
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    color: '#6b7280',
                    flexWrap: 'wrap'
                  }}>
                    {reporte.telefono_reportante && (
                      <span>📱 {reporte.telefono_reportante}</span>
                    )}
                    {reporte.email_reportante && (
                      <span>📧 {reporte.email_reportante}</span>
                    )}
                  </div>
                )}

                {/* Código generado */}
                {reporte.codigo_generado && (
                  <div style={{
                    background: '#d1fae5',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    color: '#065f46',
                    fontWeight: 600
                  }}>
                    🎟️ Código generado: <code style={{ background: '#a7f3d0', padding: '0.15rem 0.5rem', borderRadius: '0.25rem' }}>{reporte.codigo_generado}</code>
                  </div>
                )}

                {/* Acciones (solo si pendiente) */}
                {reporte.estado === 'pendiente' && (
                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                    {/* Notas admin */}
                    <input
                      type="text"
                      placeholder="Notas del admin (opcional)..."
                      value={notasTemp[reporte.id] || ''}
                      onChange={e => setNotasTemp({ ...notasTemp, [reporte.id]: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                        marginBottom: '0.75rem',
                        fontSize: '0.85rem',
                        color: '#374151',
                        background: '#f9fafb'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => revisarReporte(reporte.id, 'aprobado')}
                        disabled={procesando === reporte.id}
                        style={{
                          padding: '0.5rem 1.25rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                          color: 'white',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          opacity: procesando === reporte.id ? 0.7 : 1
                        }}
                      >
                        {procesando === reporte.id ? '⏳...' : '✅ Aprobar y generar código'}
                      </button>
                      <button
                        onClick={() => revisarReporte(reporte.id, 'rechazado')}
                        disabled={procesando === reporte.id}
                        style={{
                          padding: '0.5rem 1.25rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #fca5a5',
                          background: '#fff5f5',
                          color: '#dc2626',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        ❌ Rechazar
                      </button>
                      <button
                        onClick={() => revisarReporte(reporte.id, 'duplicado')}
                        disabled={procesando === reporte.id}
                        style={{
                          padding: '0.5rem 1.25rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb',
                          background: '#f9fafb',
                          color: '#6b7280',
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        🔄 Duplicado
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal foto */}
      {modalFoto && (
        <div
          onClick={() => setModalFoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }}
        >
          <img
            src={modalFoto}
            alt="Foto ampliada"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: '1rem',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
    </div>
  );
}