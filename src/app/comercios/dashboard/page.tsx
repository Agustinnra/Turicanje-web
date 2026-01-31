'use client';

import { useState, useEffect } from 'react';
import FormularioNegocio from '@/components/FormularioNegocio';
import FormularioCompletoNegocio from '@/components/FormularioCompletoNegocio';
import MapaNegocio from '@/components/MapaNegocio';
import RegistrarVenta from '@/components/RegistrarVenta';
import HistorialVentas from '@/components/HistorialVentas';
import VistaPreviewComercio from '@/components/VistaPreviewComercio';
import Link from 'next/link';
import './dashboard.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface SaldoPuntos {
  saldo: number;
  estado: string;
  mensaje: string | null;
  puede_dar_puntos: boolean;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [negocio, setNegocio] = useState<any>(null);
  const [tabActivo, setTabActivo] = useState<'preview' | 'editar' | 'puntos' | 'ventas' | 'negocios' | 'usuarios'>('preview');
  const [saldoPuntos, setSaldoPuntos] = useState<SaldoPuntos | null>(null);

  // Estados para Admin
  const [negocios, setNegocios] = useState<any[]>([]);
  const [negocioSeleccionado, setNegocioSeleccionado] = useState<any>(null);
  const [busqueda, setBusqueda] = useState('');
  const [loadingNegocios, setLoadingNegocios] = useState(false);
  const [paginacion, setPaginacion] = useState({ page: 1, total: 0, totalPages: 0 });

  // Estados para Super Admin
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      try {
        const usr = JSON.parse(usuarioStr);
        setUsuario(usr);
        
        // Admin y Super Admin van directo a lista de negocios
        if (usr.role === 'admin' || usr.role === 'super_admin') {
          setTabActivo('negocios');
          cargarNegocios(token);
          if (usr.role === 'super_admin') {
            cargarUsuarios(token);
          }
          setLoading(false);
        } else if (usr.role === 'comercio') {
          cargarMiNegocio(token);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error('Error parsing usuario:', e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // FUNCIONES PARA COMERCIO
  // ============================================================
  const cargarMiNegocio = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/comercios/mi-negocio`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setNegocio(data);
          // Cargar saldo de puntos
          cargarSaldoPuntos(token);
        }
      }
    } catch (err) {
      console.error('Error cargando negocio:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarSaldoPuntos = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/comercios/mi-saldo-puntos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSaldoPuntos(data);
      }
    } catch (err) {
      console.error('Error cargando saldo de puntos:', err);
    }
  };

  // ============================================================
  // FUNCIONES PARA ADMIN
  // ============================================================
  const cargarNegocios = async (token?: string, page = 1, search = '') => {
    const tkn = token || localStorage.getItem('token');
    if (!tkn) return;
    
    setLoadingNegocios(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.append('search', search);

      const response = await fetch(`${API_URL}/api/comercios/admin/negocios?${params}`, {
        headers: { 'Authorization': `Bearer ${tkn}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNegocios(data.negocios || []);
        setPaginacion(data.pagination || { page: 1, total: 0, totalPages: 0 });
      }
    } catch (err) {
      console.error('Error cargando negocios:', err);
    } finally {
      setLoadingNegocios(false);
    }
  };

  const buscarNegocios = () => {
    cargarNegocios(undefined, 1, busqueda);
  };

  const seleccionarNegocio = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/comercios/admin/negocio/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNegocioSeleccionado(data.negocio);
        setTabActivo('editar');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // ============================================================
  // FUNCIONES PARA SUPER ADMIN
  // ============================================================
  const cargarUsuarios = async (token?: string) => {
    const tkn = token || localStorage.getItem('token');
    if (!tkn) return;

    setLoadingUsuarios(true);
    try {
      const response = await fetch(`${API_URL}/api/comercios/super/usuarios`, {
        headers: { 'Authorization': `Bearer ${tkn}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.usuarios || []);
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const cambiarRol = async (userId: number, nuevoRol: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/comercios/super/usuario/${userId}/rol`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: nuevoRol })
      });

      if (response.ok) {
        await cargarUsuarios();
        alert('Rol actualizado exitosamente');
      } else {
        const data = await response.json();
        alert(data.error || 'Error al cambiar rol');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al cambiar rol');
    }
  };

  // ============================================================
  // HANDLERS COMUNES
  // ============================================================
  const handleNegocioCreado = (nuevoNegocio: any) => {
    setNegocio(nuevoNegocio);
    setTabActivo('preview');
  };

  const handleNegocioActualizado = (negocioActualizado: any) => {
    if (usuario?.role === 'comercio') {
      setNegocio(negocioActualizado);
      setTabActivo('preview');
    } else {
      setNegocioSeleccionado(negocioActualizado);
      cargarNegocios(undefined, paginacion.page, busqueda);
      setTabActivo('negocios');
    }
  };

  // ✅ NUEVA: Guardar negocio completo (para admin)
  const guardarNegocioCompleto = async (datos: any) => {
    const token = localStorage.getItem('token');
    if (!token || !negocioSeleccionado?.id) {
      throw new Error('No autorizado');
    }

    const response = await fetch(`${API_URL}/api/comercios/admin/negocio/${negocioSeleccionado.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar');
    }

    const result = await response.json();
    handleNegocioActualizado(result.negocio);
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
  };

  // ============================================================
  // HELPER: Verificar si es admin
  // ============================================================
  const esAdmin = usuario?.role === 'admin' || usuario?.role === 'super_admin';

  // ============================================================
  // HELPER: Verificar si el plan del comercio está vencido
  // ============================================================
  const planVencido = (): boolean => {
    if (!negocio) return false;
    
    // Si plan_activo es explícitamente false
    if (negocio.plan_activo === false) return true;
    
    // ✅ NUEVO: Si NO tiene fecha de vencimiento = no tiene plan = bloqueado
    if (!negocio.plan_fecha_vencimiento) return true;
    
    // Si tiene fecha de vencimiento, verificar si ya pasó
    const fechaVencimiento = new Date(negocio.plan_fecha_vencimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fechaVencimiento < hoy;
  };

  const esPlanVencido = planVencido();

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Cargando...</p>
      </div>
    );
  }

  // ============================================================
  // VISTA: COMERCIO SIN NEGOCIO (CREAR)
  // ============================================================
  if (usuario?.role === 'comercio' && !negocio) {
    return (
      <div className="dashboard-wrapper">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-brand">
              <div className="brand-icon">📝</div>
              <div className="brand-text">
                <h1>Registra tu Comercio</h1>
                <span className="brand-subtitle">Completa la información de tu negocio</span>
              </div>
            </div>
            <div className="header-actions">
              <div className="user-info">
                <span className="user-email">{usuario?.email}</span>
                <span className="user-role role-comercio">COMERCIO</span>
              </div>
              <button onClick={handleCerrarSesion} className="btn-logout">
                <span>🚪</span> Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        <div className="form-container">
          <FormularioNegocio
            negocio={null}
            modoCrear={true}
            onNegocioCreado={handleNegocioCreado}
            onNegocioActualizado={() => {}}
          />
        </div>
      </div>
    );
  }

  // ============================================================
  // VISTA PRINCIPAL CON TABS
  // ============================================================
  const negocioActual = esAdmin ? negocioSeleccionado : negocio;

  return (
    <div className="dashboard-wrapper">
      {/* ========== HEADER ========== */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="brand-icon">
              {usuario?.role === 'super_admin' ? '👑' : usuario?.role === 'admin' ? '🔧' : '🏪'}
            </div>
            <div className="brand-text">
              <h1>
                {usuario?.role === 'super_admin' ? 'Super Admin' : 
                 usuario?.role === 'admin' ? 'Panel Admin' : 
                 'Mi Negocio'}
              </h1>
              <span className="brand-subtitle">
                {usuario?.role === 'comercio' ? negocio?.name : 'Gestión de Turicanje'}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <div className="user-info">
              <span className="user-email">{usuario?.email}</span>
              <span className={`user-role role-${usuario?.role}`}>
                {usuario?.role?.toUpperCase()}
              </span>
            </div>
            <button onClick={handleCerrarSesion} className="btn-logout">
              <span>🚪</span> Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* ========== BANNER SUSCRIPCIÓN VENCIDA (COMERCIO) ========== */}
      {usuario?.role === 'comercio' && esPlanVencido && (
        <div className="banner-suscripcion-vencida">
          <div className="banner-content">
            <span className="banner-icon">⚠️</span>
            <div className="banner-text">
              <strong>Tu suscripción ha vencido</strong>
              <p>Tu negocio aparecerá al final de las búsquedas y no puedes editar tu información hasta que renueves.</p>
            </div>
            <Link href="/comercios/dashboard/suscripcion" className="btn-renovar">
              💳 Renovar Ahora
            </Link>
          </div>
        </div>
      )}

      {/* ========== CARD ESTADO DE CUENTA (COMERCIO) ========== */}
      {usuario?.role === 'comercio' && negocio && (
        <div className="estado-cuenta-card">
          <div className="estado-cuenta-grid">
            {/* Info del negocio */}
            <div className="estado-negocio">
              <div className="estado-negocio-header">
                {negocio.imagen_url ? (
                  <img src={negocio.imagen_url} alt={negocio.name} className="estado-negocio-img" />
                ) : (
                  <div className="estado-negocio-placeholder">🏪</div>
                )}
                <div className="estado-negocio-info">
                  <h3>{negocio.name}</h3>
                  <p>{negocio.category}</p>
                  <span className={`estado-badge ${esPlanVencido ? 'vencido' : 'activo'}`}>
                    {esPlanVencido ? '⚠️ Plan Vencido' : '✅ Activo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Saldo de puntos */}
            <div className="estado-saldo">
              <span className="estado-saldo-label">TU SALDO DE PUNTOS</span>
              <div className="estado-saldo-valor">
                <span className="estado-saldo-numero">{saldoPuntos?.saldo?.toLocaleString() || 0}</span>
                <span className="estado-saldo-unit">pts</span>
              </div>
              {saldoPuntos?.mensaje && (
                <div className={`estado-saldo-mensaje ${saldoPuntos.estado}`}>
                  {saldoPuntos.mensaje}
                </div>
              )}
              <Link href="/comercios/dashboard/recargar" className="btn-recargar-mini">
                💳 Recargar
              </Link>
            </div>

            {/* Mi Suscripción */}
            <div className="estado-suscripcion">
              <span className="estado-suscripcion-label">MI SUSCRIPCIÓN</span>
              <div className="estado-suscripcion-info">
                {esPlanVencido ? (
                  <>
                    <span className="suscripcion-status vencida">⚠️ Vencida</span>
                    <p className="suscripcion-mensaje">Tu negocio no aparece en búsquedas</p>
                  </>
                ) : negocio.plan_fecha_vencimiento ? (
                  <>
                    <span className="suscripcion-status activa">✅ Activa</span>
                    <p className="suscripcion-vence">Vence: {new Date(negocio.plan_fecha_vencimiento).toLocaleDateString('es-MX')}</p>
                  </>
                ) : (
                  <>
                    <span className="suscripcion-status trial">🎁 Prueba</span>
                    <p className="suscripcion-mensaje">Suscríbete para más beneficios</p>
                  </>
                )}
              </div>
              <Link href="/comercios/dashboard/suscripcion" className={`btn-suscripcion ${esPlanVencido ? 'urgente' : ''}`}>
                {esPlanVencido ? '🚨 Renovar Ahora' : '💳 Gestionar'}
              </Link>
            </div>

            {/* Link al slug */}
            <div className="estado-acciones">
              <Link href={`/blog/${negocio.id}`} target="_blank" className="btn-ver-publico">
                🔗 Ver página pública
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========== TABS DE NAVEGACIÓN ========== */}
      <nav className="dashboard-tabs">
        {/* Comercio: Preview, Editar, Puntos, Ventas */}
        {usuario?.role === 'comercio' && (
          <>
            <button 
              className={`tab ${tabActivo === 'preview' ? 'active' : ''}`}
              onClick={() => setTabActivo('preview')}
            >
              <span className="tab-icon">👁️</span>
              <span className="tab-text">Vista Previa</span>
            </button>
            <button 
              className={`tab ${tabActivo === 'editar' ? 'active' : ''} ${esPlanVencido ? 'tab-disabled' : ''}`}
              onClick={() => !esPlanVencido && setTabActivo('editar')}
              disabled={esPlanVencido}
              title={esPlanVencido ? 'Renueva tu suscripción para editar' : ''}
            >
              <span className="tab-icon">{esPlanVencido ? '🔒' : '✏️'}</span>
              <span className="tab-text">Editar</span>
              {esPlanVencido && <span className="tab-locked">🔒</span>}
            </button>
            <button 
              className={`tab ${tabActivo === 'puntos' ? 'active' : ''}`}
              onClick={() => setTabActivo('puntos')}
            >
              <span className="tab-icon">🎁</span>
              <span className="tab-text">Dar Puntos</span>
            </button>
            <button 
              className={`tab ${tabActivo === 'ventas' ? 'active' : ''}`}
              onClick={() => setTabActivo('ventas')}
            >
              <span className="tab-icon">📊</span>
              <span className="tab-text">Mis Ventas</span>
            </button>
          </>
        )}

        {/* Admin: Negocios y Editar */}
        {esAdmin && (
          <>
            <button 
              className={`tab ${tabActivo === 'negocios' ? 'active' : ''}`}
              onClick={() => setTabActivo('negocios')}
            >
              <span className="tab-icon">🏢</span>
              <span className="tab-text">Negocios</span>
              <span className="tab-badge">{paginacion.total || negocios.length}</span>
            </button>
            <button 
              className={`tab ${tabActivo === 'editar' ? 'active' : ''}`}
              onClick={() => setTabActivo('editar')}
              disabled={!negocioSeleccionado}
            >
              <span className="tab-icon">✏️</span>
              <span className="tab-text">Editar Negocio</span>
            </button>
          </>
        )}

        {/* Super Admin: Usuarios */}
        {usuario?.role === 'super_admin' && (
          <button 
            className={`tab ${tabActivo === 'usuarios' ? 'active' : ''}`}
            onClick={() => setTabActivo('usuarios')}
          >
            <span className="tab-icon">👥</span>
            <span className="tab-text">Usuarios</span>
            <span className="tab-badge">{usuarios.length}</span>
          </button>
        )}
      </nav>

      {/* ========== CONTENIDO PRINCIPAL ========== */}
      <main className="dashboard-main">
        
        {/* ========== TAB: LISTA DE NEGOCIOS (ADMIN) ========== */}
        {tabActivo === 'negocios' && esAdmin && (
          <div className="admin-panel">
            <div className="admin-toolbar">
              <h2 style={{ margin: 0 }}>🏢 Todos los Negocios</h2>
              <div className="admin-search">
                <input
                  type="text"
                  placeholder="Buscar por nombre o dirección..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscarNegocios()}
                />
                <button onClick={buscarNegocios}>🔍 Buscar</button>
              </div>
              <div className="admin-stats">
                Total: <strong>{paginacion.total || negocios.length}</strong> negocios
              </div>
            </div>

            {loadingNegocios ? (
              <div className="loading-inline">
                <div className="loading-spinner-small" />
                Cargando negocios...
              </div>
            ) : (
              <div className="negocios-lista">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Negocio</th>
                      <th>Categoría</th>
                      <th>Teléfono</th>
                      <th>Afiliado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {negocios.map((neg) => (
                      <tr key={neg.id}>
                        <td>
                          <div className="negocio-cell">
                            {neg.imagen_url && (
                              <img src={neg.imagen_url} alt={neg.name} className="negocio-thumb" />
                            )}
                            <div>
                              <strong>{neg.name}</strong>
                              <small>{neg.address?.substring(0, 40)}...</small>
                            </div>
                          </div>
                        </td>
                        <td><span className="category-tag">{neg.category}</span></td>
                        <td>{neg.phone || '-'}</td>
                        <td>
                          <span className={`badge ${neg.afiliado ? 'badge-success' : 'badge-gray'}`}>
                            {neg.afiliado ? '✓ Sí' : 'No'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn-small btn-primary"
                            onClick={() => seleccionarNegocio(neg.id)}
                          >
                            ✏️ Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginación */}
                {paginacion.totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      disabled={paginacion.page <= 1}
                      onClick={() => cargarNegocios(undefined, paginacion.page - 1, busqueda)}
                    >
                      ← Anterior
                    </button>
                    <span>Página {paginacion.page} de {paginacion.totalPages}</span>
                    <button 
                      disabled={paginacion.page >= paginacion.totalPages}
                      onClick={() => cargarNegocios(undefined, paginacion.page + 1, busqueda)}
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========== TAB: GESTIÓN DE USUARIOS (SUPER ADMIN) ========== */}
        {tabActivo === 'usuarios' && usuario?.role === 'super_admin' && (
          <div className="admin-panel">
            <div className="admin-toolbar">
              <h2 style={{ margin: 0 }}>👥 Gestión de Usuarios</h2>
              <div className="admin-stats">
                Total: <strong>{usuarios.length}</strong> usuarios
              </div>
            </div>

            {loadingUsuarios ? (
              <div className="loading-inline">
                <div className="loading-spinner-small" />
                Cargando usuarios...
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol Actual</th>
                    <th>Negocio</th>
                    <th>Cambiar Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usr) => (
                    <tr key={usr.id}>
                      <td><strong>{usr.nombre_contacto || usr.nombre || '-'}</strong></td>
                      <td>{usr.email}</td>
                      <td>
                        <span className={`badge badge-${usr.role}`}>
                          {usr.role}
                        </span>
                      </td>
                      <td>{usr.place_id ? '✓ Sí' : '-'}</td>
                      <td>
                        <select
                          value={usr.role}
                          onChange={(e) => cambiarRol(usr.id, e.target.value)}
                          disabled={usr.id === usuario?.id}
                          className="role-select"
                        >
                          <option value="usuario">usuario</option>
                          <option value="comercio">comercio</option>
                          <option value="admin">admin</option>
                          <option value="super_admin">super_admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ========== TAB: VISTA PREVIA (COMERCIO) ========== */}
        {tabActivo === 'preview' && usuario?.role === 'comercio' && negocio && (
          <div className="preview-wrapper">
            <VistaPreviewComercio negocio={negocio} />
          </div>
        )}

        {/* ========== TAB: DAR PUNTOS (COMERCIO) ========== */}
        {tabActivo === 'puntos' && usuario?.role === 'comercio' && (
          <div className="puntos-wrapper">
            <RegistrarVenta />
          </div>
        )}

        {/* ========== TAB: MIS VENTAS (COMERCIO) ========== */}
        {tabActivo === 'ventas' && usuario?.role === 'comercio' && (
          <div className="ventas-wrapper">
            <HistorialVentas />
          </div>
        )}

        {/* ========== TAB: EDITAR ========== */}
        {tabActivo === 'editar' && (
          <div className="editar-wrapper">
            {/* Si es ADMIN → Formulario Completo */}
            {esAdmin && negocioSeleccionado ? (
              <FormularioCompletoNegocio
                negocio={negocioSeleccionado}
                onGuardar={guardarNegocioCompleto}
                onCancelar={() => setTabActivo('negocios')}
                modoAdmin={true}
              />
            ) : esAdmin && !negocioSeleccionado ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>Selecciona un negocio de la lista para editarlo</p>
                <button 
                  className="btn-primary"
                  onClick={() => setTabActivo('negocios')}
                >
                  ← Ir a lista de negocios
                </button>
              </div>
            ) : (
              /* Si es COMERCIO → Formulario Simple */
              <>
                <div className="editar-header">
                  <h2>📝 Edita la información de tu negocio</h2>
                </div>
                {negocio ? (
                  <FormularioNegocio
                    negocio={negocio}
                    modoCrear={false}
                    onNegocioCreado={() => {}}
                    onNegocioActualizado={handleNegocioActualizado}
                  />
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>No tienes un negocio registrado</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </main>
    </div>
  );
}