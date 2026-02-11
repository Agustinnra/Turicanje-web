'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import './mi-cuenta.css';
import NotificacionesConfig from '@/components/NotificacionesConfig';


interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  puntos: number;
  codigo_qr: string;
  suscripcion_activa?: boolean;
  suscripcion_fecha_vencimiento?: string;
}

interface Transaccion {
  id: number;
  transaction_type: string;
  points: number;
  amount: number;
  description: string;
  created_at: string;
  negocio_nombre: string;
  negocio_imagen?: string;
}

interface Favorito {
  id: string;
  name: string;
  category: string;
  neighborhood: string;
  imagen_url: string;
  rating?: number;
}

interface CreadorSiguiendo {
  id: number;
  username: string;
  nombre: string;
  titulo: string;
  foto_perfil: string;
  total_seguidores: number;
}

type ModalType = null | 'nombre' | 'email' | 'email-codigo' | 'telefono' | 'telefono-codigo' | 'password';

export default function MiCuenta() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [creadores, setCreadores] = useState<CreadorSiguiendo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumen' | 'favoritos' | 'siguiendo' | 'historial' | 'recompensas' | 'perfil'>('resumen');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [modalActivo, setModalActivo] = useState<ModalType>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [codigoVerificacion, setCodigoVerificacion] = useState('');
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Estados para canjear recompensa
  const [codigoRecompensa, setCodigoRecompensa] = useState('');
  const [canjeando, setCanjeando] = useState(false);
  const [canjeError, setCanjeError] = useState('');
  const [canjeExito, setCanjeExito] = useState<{ puntos: number; total: number } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

  useEffect(() => {
    const token = localStorage.getItem('usuario_token');
    const userData = localStorage.getItem('usuario_data');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      setUsuario(JSON.parse(userData));
      cargarDatos(token);
    } catch (e) {
      router.push('/login');
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const cargarDatos = async (token: string) => {
    try {
      const perfilRes = await fetch(`${API_URL}/api/usuarios/perfil`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (perfilRes.ok) {
        const perfil = await perfilRes.json();
        const usuarioData = {
          id: perfil.id,
          nombre: perfil.nombre,
          email: perfil.email,
          telefono: perfil.telefono,
          puntos: perfil.puntos || 0,
          codigo_qr: perfil.codigo_qr,
          suscripcion_activa: perfil.suscripcion_activa,
          suscripcion_fecha_vencimiento: perfil.suscripcion_fecha_vencimiento
        };
        setUsuario(usuarioData);
        localStorage.setItem('usuario_data', JSON.stringify(usuarioData));
      }

      const transRes = await fetch(`${API_URL}/api/usuarios/transacciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (transRes.ok) {
        const data = await transRes.json();
        setTransacciones(data.transacciones || []);
      }

      const favRes = await fetch(`${API_URL}/api/social/mis-favoritos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (favRes.ok) {
        const data = await favRes.json();
        setFavoritos(Array.isArray(data) ? data : (data.favoritos || []));
      }

      const creadoresRes = await fetch(`${API_URL}/api/social/mis-creadores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (creadoresRes.ok) {
        const data = await creadoresRes.json();
        setCreadores(Array.isArray(data) ? data : (data.creadores || []));
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('usuario_token');
    localStorage.removeItem('usuario_data');
    router.push('/');
  };

  const quitarFavorito = async (placeId: string) => {
    const token = localStorage.getItem('usuario_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/social/comercios/${placeId}/favorito`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setFavoritos(favoritos.filter(f => f.id !== placeId));
      }
    } catch (error) {
      console.error('Error quitando favorito:', error);
    }
  };

  const dejarDeSeguir = async (creadorId: number) => {
    const token = localStorage.getItem('usuario_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/social/creadores/${creadorId}/seguir`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setCreadores(creadores.filter(c => c.id !== creadorId));
      }
    } catch (error) {
      console.error('Error dejando de seguir:', error);
    }
  };

  // Función para canjear código de recompensa
  const handleCanjearCodigo = async () => {
    if (!codigoRecompensa.trim()) {
      setCanjeError('Ingresa un código');
      return;
    }

    setCanjeando(true);
    setCanjeError('');
    setCanjeExito(null);

    try {
      const token = localStorage.getItem('usuario_token');
      const res = await fetch(`${API_URL}/api/reportes/canjear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ codigo: codigoRecompensa.trim().toUpperCase() })
      });

      const data = await res.json();

      if (!res.ok) {
        setCanjeError(data.error || 'Código inválido o expirado');
        return;
      }

      // Éxito
      setCanjeExito({
        puntos: data.puntos_sumados,
        total: data.puntos_total
      });
      setCodigoRecompensa('');

      // Actualizar puntos del usuario en el estado
      if (usuario) {
        const nuevoUsuario = { ...usuario, puntos: data.puntos_total };
        setUsuario(nuevoUsuario);
        localStorage.setItem('usuario_data', JSON.stringify(nuevoUsuario));
      }

    } catch (error) {
      setCanjeError('Error de conexión. Intenta de nuevo.');
    } finally {
      setCanjeando(false);
    }
  };

  const abrirModal = (tipo: ModalType) => {
    setModalActivo(tipo);
    setModalError('');
    setModalSuccess('');
    setCodigoVerificacion('');
    
    if (tipo === 'nombre') setNuevoNombre(usuario?.nombre || '');
    else if (tipo === 'email') setNuevoEmail('');
    else if (tipo === 'telefono') setNuevoTelefono('');
    else if (tipo === 'password') {
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmar('');
    }
  };

  const cerrarModal = () => {
    setModalActivo(null);
    setModalError('');
    setModalSuccess('');
    setModalLoading(false);
  };

  const handleCambiarNombre = async () => {
    if (!nuevoNombre.trim()) {
      setModalError('El nombre no puede estar vacío');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const token = localStorage.getItem('usuario_token');
      const res = await fetch(`${API_URL}/api/usuarios/perfil/nombre`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre: nuevoNombre.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setModalError(data.error || 'Error al actualizar');
        return;
      }

      if (usuario) {
        const nuevoUsuario = { ...usuario, nombre: nuevoNombre.trim() };
        setUsuario(nuevoUsuario);
        localStorage.setItem('usuario_data', JSON.stringify(nuevoUsuario));
      }

      setModalSuccess('¡Nombre actualizado!');
      setTimeout(() => cerrarModal(), 1500);

    } catch (error) {
      setModalError('Error de conexión');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSolicitarCambioEmail = async () => {
    if (!nuevoEmail.trim()) {
      setModalError('Ingresa un email válido');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nuevoEmail)) {
      setModalError('Formato de email inválido');
      return;
    }

    if (nuevoEmail === usuario?.email) {
      setModalError('El nuevo email debe ser diferente al actual');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const token = localStorage.getItem('usuario_token');
      const res = await fetch(`${API_URL}/api/usuarios/perfil/email/solicitar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nuevo_email: nuevoEmail.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setModalError(data.error || 'Error al enviar código');
        return;
      }

      setModalActivo('email-codigo');
      setCountdown(60);
      setModalSuccess('Código enviado a tu nuevo email');

    } catch (error) {
      setModalError('Error de conexión');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmarCambioEmail = async () => {
    if (codigoVerificacion.length !== 6) {
      setModalError('El código debe tener 6 dígitos');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const token = localStorage.getItem('usuario_token');
      const res = await fetch(`${API_URL}/api/usuarios/perfil/email/confirmar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ codigo: codigoVerificacion })
      });

      const data = await res.json();

      if (!res.ok) {
        setModalError(data.error || 'Código incorrecto');
        return;
      }

      if (usuario) {
        const nuevoUsuario = { ...usuario, email: data.nuevo_email };
        setUsuario(nuevoUsuario);
        localStorage.setItem('usuario_data', JSON.stringify(nuevoUsuario));
      }

      setModalSuccess('¡Email actualizado!');
      setTimeout(() => cerrarModal(), 1500);

    } catch (error) {
      setModalError('Error de conexión');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSolicitarCambioTelefono = async () => {
    if (!nuevoTelefono.trim()) {
      setModalError('Ingresa un teléfono válido');
      return;
    }

    const tel = nuevoTelefono.replace(/\D/g, '');
    if (tel.length !== 10) {
      setModalError('El teléfono debe tener 10 dígitos');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const token = localStorage.getItem('usuario_token');
      const res = await fetch(`${API_URL}/api/usuarios/perfil/telefono/solicitar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nuevo_telefono: tel })
      });

      const data = await res.json();

      if (!res.ok) {
        setModalError(data.error || 'Error al enviar código');
        return;
      }

      setModalActivo('telefono-codigo');
      setCountdown(60);
      setModalSuccess('Código enviado por WhatsApp');

    } catch (error) {
      setModalError('Error de conexión');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmarCambioTelefono = async () => {
    if (codigoVerificacion.length !== 6) {
      setModalError('El código debe tener 6 dígitos');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const token = localStorage.getItem('usuario_token');
      const res = await fetch(`${API_URL}/api/usuarios/perfil/telefono/confirmar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ codigo: codigoVerificacion })
      });

      const data = await res.json();

      if (!res.ok) {
        setModalError(data.error || 'Código incorrecto');
        return;
      }

      if (usuario) {
        const nuevoUsuario = { ...usuario, telefono: data.nuevo_telefono };
        setUsuario(nuevoUsuario);
        localStorage.setItem('usuario_data', JSON.stringify(nuevoUsuario));
      }

      setModalSuccess('¡Teléfono actualizado!');
      setTimeout(() => cerrarModal(), 1500);

    } catch (error) {
      setModalError('Error de conexión');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCambiarPassword = async () => {
    if (!passwordActual) {
      setModalError('Ingresa tu contraseña actual');
      return;
    }

    if (passwordNueva.length < 6) {
      setModalError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordNueva !== passwordConfirmar) {
      setModalError('Las contraseñas no coinciden');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const token = localStorage.getItem('usuario_token');
      const res = await fetch(`${API_URL}/api/usuarios/perfil/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password_actual: passwordActual,
          password_nueva: passwordNueva
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setModalError(data.error || 'Error al cambiar contraseña');
        return;
      }

      setModalSuccess('¡Contraseña actualizada!');
      setTimeout(() => cerrarModal(), 1500);

    } catch (error) {
      setModalError('Error de conexión');
    } finally {
      setModalLoading(false);
    }
  };

  const handleReenviarCodigo = async (tipo: 'email' | 'telefono') => {
    setCountdown(60);
    if (tipo === 'email') {
      await handleSolicitarCambioEmail();
    } else {
      await handleSolicitarCambioTelefono();
    }
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="mi-cuenta-container">
        <div className="mi-cuenta-loading">
          <div className="loading-spinner"></div>
          <p>Cargando tu cuenta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mi-cuenta-container">
      {/* HEADER */}
      <header className="mi-cuenta-header">
        <div className="header-container">
          <Link href="/" className="mi-cuenta-logo">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={140} 
              height={50}
              style={{ objectFit: 'contain' }}
            />
          </Link>

          <nav className="header-nav">
            <Link href="/blog" className="nav-link">Restaurantes</Link>
            <Link href="/creadores" className="nav-link">Creadores</Link>
          </nav>

          <div className="header-user-menu" ref={userMenuRef}>
            <button 
              className="user-menu-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <span className="user-avatar-header">
                {usuario?.nombre?.charAt(0).toUpperCase() || '?'}
              </span>
              <span className="user-name-header">{usuario?.nombre?.split(' ')[0]}</span>
              <span className={`menu-arrow ${userMenuOpen ? 'open' : ''}`}>▼</span>
            </button>

            {userMenuOpen && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <span className="dropdown-name">{usuario?.nombre}</span>
                  <span className="dropdown-email">{usuario?.email}</span>
                </div>
                <div className="dropdown-divider"></div>
                <Link href="/blog" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  <span>🍽️</span> <span style={{color: '#333'}}>Explorar restaurantes</span>
                </Link>
                <Link href="/creadores" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  <span>👥</span> <span style={{color: '#333'}}>Ver creadores</span>
                </Link>
                <Link href="/" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                  <span>🏠</span> <span style={{color: '#333'}}>Ir al inicio</span>
                </Link>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={cerrarSesion}>
                  <span>🚪</span> <span style={{color: '#c62828'}}>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HERO - Solo fondo decorativo */}
      <section className="mi-cuenta-hero"></section>

      {/* MAIN */}
      <main className="mi-cuenta-main">
        {/* Card de puntos */}
        <div className="puntos-card">
          <div className="puntos-card-content">
            <div className="puntos-info">
              <p className="puntos-saludo">¡Hola, {usuario?.nombre?.split(' ')[0]}!</p>
              <div className="puntos-total">
                <span className="puntos-numero">{usuario?.puntos?.toLocaleString() || 0}</span>
                <span className="puntos-label">puntos</span>
              </div>
            
              
              {!usuario?.suscripcion_activa && (
                <Link href="/suscripcion" className="suscripcion-warning">
                  <span>⚠️ Tu suscripción no está activa</span>
                  <span className="btn-activar">Activar →</span>
                </Link>
              )}
            </div>
            
            <div className="puntos-qr">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${usuario?.codigo_qr}`}
                alt="Mi QR"
              />
              <span className="qr-codigo-mini">{usuario?.codigo_qr}</span>
            </div>
          </div>
          
          <div className="puntos-card-decoration">
            <span className="decoration-icon">💎</span>
          </div>
        </div>
        <div className="mi-cuenta-tabs">
          <button className={`tab-btn ${activeTab === 'resumen' ? 'active' : ''}`} onClick={() => setActiveTab('resumen')}>
            📊 Resumen
          </button>
          <button className={`tab-btn ${activeTab === 'favoritos' ? 'active' : ''}`} onClick={() => setActiveTab('favoritos')}>
            ❤️ Favoritos {favoritos.length > 0 && <span className="tab-badge">{favoritos.length}</span>}
          </button>
          <button className={`tab-btn ${activeTab === 'siguiendo' ? 'active' : ''}`} onClick={() => setActiveTab('siguiendo')}>
            👤 Siguiendo {creadores.length > 0 && <span className="tab-badge">{creadores.length}</span>}
          </button>
          <button className={`tab-btn ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => setActiveTab('historial')}>
            📜 Historial
          </button>
          <button className={`tab-btn ${activeTab === 'recompensas' ? 'active' : ''}`} onClick={() => setActiveTab('recompensas')}>
            🎁 Recompensas
          </button>
          <button className={`tab-btn ${activeTab === 'perfil' ? 'active' : ''}`} onClick={() => setActiveTab('perfil')}>
            ⚙️ Perfil
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'resumen' && (
            <div className="tab-resumen">
              <div className="resumen-stats">
                <div className="stat-card">
                  <span className="stat-icon">❤️</span>
                  <span className="stat-value">{favoritos.length}</span>
                  <span className="stat-label">Favoritos</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">👤</span>
                  <span className="stat-value">{creadores.length}</span>
                  <span className="stat-label">Siguiendo</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">💰</span>
                  <span className="stat-value">{transacciones.filter(t => t.transaction_type === 'earn').reduce((sum, t) => sum + parseFloat(String(t.points)), 0)}</span>
                  <span className="stat-label">Pts ganados</span>
                </div>
              </div>

              <h3>Últimos movimientos</h3>
              {transacciones.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📝</span>
                  <p>Aún no tienes movimientos</p>
                </div>
              ) : (
                <div className="transacciones-list">
                  {transacciones.slice(0, 5).map(trans => (
                    <div key={trans.id} className="transaccion-item">
                      <div className="trans-icon">
                        {trans.negocio_imagen ? (
                          <img src={trans.negocio_imagen} alt="" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px'}} />
                        ) : (
                          trans.transaction_type === 'earn' ? '💰' : '🎁'
                        )}
                      </div>
                      <div className="trans-info">
                        <span className="trans-negocio">{trans.negocio_nombre || 'Turicanje'}</span>
                        <span className="trans-fecha">{formatearFecha(trans.created_at)}</span>
                      </div>
                      <span className={`trans-puntos ${trans.transaction_type}`}>
                        {trans.transaction_type === 'earn' ? '+' : '-'}{trans.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favoritos' && (
            <div className="tab-favoritos">
              <h3>Mis restaurantes favoritos</h3>
              {favoritos.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">❤️</span>
                  <h3>Sin favoritos aún</h3>
                  <p>Guarda tus restaurantes favoritos</p>
                  <Link href="/blog" className="btn-explorar">Explorar restaurantes</Link>
                </div>
              ) : (
                <div className="favoritos-grid">
                  {favoritos.map(fav => (
                    <div key={fav.id} className="favorito-card">
                      <Link href={`/blog/${fav.id}`} className="favorito-link">
                        <div className="favorito-imagen">
                          {fav.imagen_url ? <img src={fav.imagen_url} alt={fav.name} /> : <div className="favorito-placeholder">🍽️</div>}
                          <span className="favorito-badge">❤️</span>
                        </div>
                        <div className="favorito-info">
                          <h4>{fav.name}</h4>
                          <p className="favorito-category">{fav.category}</p>
                          <p className="favorito-location">📍 {fav.neighborhood}</p>
                        </div>
                      </Link>
                      <button className="btn-quitar-favorito" onClick={() => quitarFavorito(fav.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'siguiendo' && (
            <div className="tab-siguiendo">
              <h3>Creadores que sigo</h3>
              {creadores.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">👤</span>
                  <h3>No sigues a nadie</h3>
                  <p>Descubre creadores de contenido gastronómico</p>
                  <Link href="/creadores" className="btn-explorar">Ver creadores</Link>
                </div>
              ) : (
                <div className="creadores-grid">
                  {creadores.map(creador => (
                    <div key={creador.id} className="creador-card">
                      <Link href={`/profile/${creador.username}`} className="creador-link">
                        <div className="creador-avatar">
                          {creador.foto_perfil ? (
                            <img src={creador.foto_perfil} alt={creador.nombre} />
                          ) : (
                            <span>{creador.nombre.charAt(0)}</span>
                          )}
                        </div>
                        <div className="creador-info">
                          <h4>{creador.nombre}</h4>
                          <p className="creador-titulo">{creador.titulo}</p>
                          <p className="creador-seguidores">{creador.total_seguidores} seguidores</p>
                        </div>
                      </Link>
                      <button className="btn-dejar-seguir" onClick={() => dejarDeSeguir(creador.id)}>
                        Dejar de seguir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="tab-historial">
              <h3>Historial de puntos</h3>
              {transacciones.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📜</span>
                  <p>Sin movimientos todavía</p>
                </div>
              ) : (
                <div className="transacciones-list historial-completo">
                  {transacciones.map(trans => (
                    <div key={trans.id} className="transaccion-item">
                      <div className="trans-icon">
                        {trans.negocio_imagen ? (
                          <img src={trans.negocio_imagen} alt="" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px'}} />
                        ) : (
                          trans.transaction_type === 'earn' ? '💰' : '🎁'
                        )}
                      </div>
                      <div className="trans-info">
                        <span className="trans-negocio">{trans.negocio_nombre || 'Turicanje'}</span>
                        <span className="trans-descripcion">{trans.description}</span>
                        <span className="trans-fecha">{formatearFecha(trans.created_at)}</span>
                      </div>
                      <span className={`trans-puntos ${trans.transaction_type}`}>
                        {trans.transaction_type === 'earn' ? '+' : '-'}{trans.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'recompensas' && (
            <div className="tab-recompensas">
              <div className="recompensas-header">
                <h3>🎁 Canjear código de recompensa</h3>
                <p>¿Recibiste un código por ayudarnos a reportar información? Ingrésalo aquí para sumar puntos a tu cuenta.</p>
              </div>

              <div className="canjear-form">
                <div className="input-group">
                  <input
                    type="text"
                    value={codigoRecompensa}
                    onChange={(e) => {
                      setCodigoRecompensa(e.target.value.toUpperCase());
                      setCanjeError('');
                      setCanjeExito(null);
                    }}
                    placeholder="Ej: TUR-ABC123"
                    className="codigo-input"
                    maxLength={12}
                  />
                  <button 
                    onClick={handleCanjearCodigo}
                    disabled={canjeando || !codigoRecompensa.trim()}
                    className="btn-canjear"
                  >
                    {canjeando ? 'Canjeando...' : 'Canjear'}
                  </button>
                </div>

                {canjeError && (
                  <div className="canje-error">
                    ❌ {canjeError}
                  </div>
                )}

                {canjeExito && (
                  <div className="canje-exito">
                    <span className="exito-icon">🎉</span>
                    <div className="exito-info">
                      <strong>¡Código canjeado exitosamente!</strong>
                      <p>+{canjeExito.puntos} puntos agregados</p>
                      <p className="total-puntos">Tu nuevo saldo: <strong>{canjeExito.total} puntos</strong></p>
                    </div>
                  </div>
                )}
              </div>

              <div className="recompensas-info">
                <h4>¿Cómo obtener códigos?</h4>
                <div className="info-cards">
                  <div className="info-card">
                    <span className="info-icon">📋</span>
                    <div>
                      <strong>Reporta información</strong>
                      <p>Ayúdanos a mantener los datos actualizados reportando cambios en horarios, menús o lugares nuevos.</p>
                    </div>
                  </div>
                  <div className="info-card">
                    <span className="info-icon">✅</span>
                    <div>
                      <strong>Verificamos tu reporte</strong>
                      <p>Nuestro equipo revisará la información que enviaste.</p>
                    </div>
                  </div>
                  <div className="info-card">
                    <span className="info-icon">🎁</span>
                    <div>
                      <strong>Recibe tu código</strong>
                      <p>Si tu reporte es válido, te enviaremos un código de 10 puntos por WhatsApp o email.</p>
                    </div>
                  </div>
                </div>

                <Link href="/reportar" className="btn-reportar">
                  📝 Hacer un reporte
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'perfil' && (
            <div className="tab-perfil">
              <div className="mi-qr-section">
                <h3>🎫 Mi código Turicanje</h3>
                <p className="qr-instrucciones">Muestra este código en los comercios para acumular puntos</p>
                <div className="qr-container">
                  <div className="qr-code-box">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${usuario?.codigo_qr}`} alt="Mi código QR" className="qr-image" />
                  </div>
                  <span className="qr-codigo">{usuario?.codigo_qr}</span>
                </div>
              </div>

              <h3>Mi información</h3>
              <div className="perfil-info-editable">
                <div className="perfil-item-editable">
                  <div className="perfil-item-content">
                    <span className="perfil-label">Nombre</span>
                    <span className="perfil-value">{usuario?.nombre}</span>
                  </div>
                  <button className="btn-editar" onClick={() => abrirModal('nombre')}>Editar</button>
                </div>

                <div className="perfil-item-editable">
                  <div className="perfil-item-content">
                    <span className="perfil-label">Email</span>
                    <span className="perfil-value">{usuario?.email}</span>
                  </div>
                  <button className="btn-editar" onClick={() => abrirModal('email')}>Cambiar</button>
                </div>

                <div className="perfil-item-editable">
                  <div className="perfil-item-content">
                    <span className="perfil-label">Teléfono</span>
                    <span className="perfil-value">{usuario?.telefono || 'No registrado'}</span>
                  </div>
                  <button className="btn-editar" onClick={() => abrirModal('telefono')}>Cambiar</button>
                </div>

                <div className="perfil-item-editable">
                  <div className="perfil-item-content">
                    <span className="perfil-label">Contraseña</span>
                    <span className="perfil-value">••••••••</span>
                  </div>
                  <button className="btn-editar" onClick={() => abrirModal('password')}>Cambiar</button>
                </div>

                <div className="perfil-item-editable">
                  <div className="perfil-item-content">
                    <span className="perfil-label">Suscripción</span>
                    <span className={`perfil-value ${usuario?.suscripcion_activa ? 'activa' : 'vencida'}`}>
                      {usuario?.suscripcion_activa ? '✅ Activa' : '❌ Vencida'}
                    </span>
                  </div>
                </div>
              </div>

              {/* NOTIFICACIONES */}
              {usuario && (
                <NotificacionesConfig 
                  userId={usuario.id} 
                  token={localStorage.getItem('usuario_token') || ''} 
                />
              )}

              <div className="perfil-whatsapp">
                <h4>📱 Consulta tus puntos por WhatsApp</h4>
                <p>Escribe "mis puntos" al número de Turicanje para consultar tu saldo al instante.</p>
                <a href="https://wa.me/521XXXXXXXXXX?text=mis%20puntos" target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                  Abrir WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALES */}
      {modalActivo && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={cerrarModal}>✕</button>

            {modalActivo === 'nombre' && (
              <>
                <h2>Cambiar nombre</h2>
                <div className="modal-form">
                  <label>Nuevo nombre</label>
                  <input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Tu nombre completo" autoFocus />
                  {modalError && <p className="modal-error">{modalError}</p>}
                  {modalSuccess && <p className="modal-success">{modalSuccess}</p>}
                  <button className="btn-modal-primary" onClick={handleCambiarNombre} disabled={modalLoading}>
                    {modalLoading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </>
            )}

            {modalActivo === 'email' && (
              <>
                <h2>Cambiar email</h2>
                <p className="modal-subtitle">Te enviaremos un código de verificación al nuevo email</p>
                <div className="modal-form">
                  <label>Email actual</label>
                  <input type="email" value={usuario?.email} disabled className="input-disabled" />
                  <label>Nuevo email</label>
                  <input type="email" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} placeholder="nuevo@email.com" autoFocus />
                  {modalError && <p className="modal-error">{modalError}</p>}
                  <button className="btn-modal-primary" onClick={handleSolicitarCambioEmail} disabled={modalLoading}>
                    {modalLoading ? 'Enviando...' : 'Enviar código'}
                  </button>
                </div>
              </>
            )}

            {modalActivo === 'email-codigo' && (
              <>
                <h2>Verificar email</h2>
                <p className="modal-subtitle">Ingresa el código de 6 dígitos</p>
                <div className="modal-form">
                  <label>Código de verificación</label>
                  <input type="text" value={codigoVerificacion} onChange={(e) => setCodigoVerificacion(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="input-codigo" autoFocus maxLength={6} />
                  {modalError && <p className="modal-error">{modalError}</p>}
                  {modalSuccess && <p className="modal-success">{modalSuccess}</p>}
                  <button className="btn-modal-primary" onClick={handleConfirmarCambioEmail} disabled={modalLoading || codigoVerificacion.length !== 6}>
                    {modalLoading ? 'Verificando...' : 'Confirmar'}
                  </button>
                  <button className="btn-reenviar" onClick={() => handleReenviarCodigo('email')} disabled={countdown > 0 || modalLoading}>
                    {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
                  </button>
                </div>
              </>
            )}

            {modalActivo === 'telefono' && (
              <>
                <h2>Cambiar teléfono</h2>
                <p className="modal-subtitle">Te enviaremos un código por WhatsApp</p>
                <div className="modal-form">
                  <label>Teléfono actual</label>
                  <input type="tel" value={usuario?.telefono || 'No registrado'} disabled className="input-disabled" />
                  <label>Nuevo teléfono</label>
                  <input type="tel" value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} placeholder="55 1234 5678" autoFocus />
                  {modalError && <p className="modal-error">{modalError}</p>}
                  <button className="btn-modal-primary" onClick={handleSolicitarCambioTelefono} disabled={modalLoading}>
                    {modalLoading ? 'Enviando...' : 'Enviar código por WhatsApp'}
                  </button>
                </div>
              </>
            )}

            {modalActivo === 'telefono-codigo' && (
              <>
                <h2>Verificar teléfono</h2>
                <p className="modal-subtitle">Ingresa el código de 6 dígitos</p>
                <div className="modal-form">
                  <label>Código de verificación</label>
                  <input type="text" value={codigoVerificacion} onChange={(e) => setCodigoVerificacion(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="input-codigo" autoFocus maxLength={6} />
                  {modalError && <p className="modal-error">{modalError}</p>}
                  {modalSuccess && <p className="modal-success">{modalSuccess}</p>}
                  <button className="btn-modal-primary" onClick={handleConfirmarCambioTelefono} disabled={modalLoading || codigoVerificacion.length !== 6}>
                    {modalLoading ? 'Verificando...' : 'Confirmar'}
                  </button>
                  <button className="btn-reenviar" onClick={() => handleReenviarCodigo('telefono')} disabled={countdown > 0 || modalLoading}>
                    {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
                  </button>
                </div>
              </>
            )}

            {modalActivo === 'password' && (
              <>
                <h2>Cambiar contraseña</h2>
                <div className="modal-form">
                  <label>Contraseña actual</label>
                  <input type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} placeholder="••••••••" autoFocus />
                  <label>Nueva contraseña</label>
                  <input type="password" value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} placeholder="Mínimo 6 caracteres" />
                  <label>Confirmar nueva contraseña</label>
                  <input type="password" value={passwordConfirmar} onChange={(e) => setPasswordConfirmar(e.target.value)} placeholder="Repite la contraseña" />
                  {modalError && <p className="modal-error">{modalError}</p>}
                  {modalSuccess && <p className="modal-success">{modalSuccess}</p>}
                  <button className="btn-modal-primary" onClick={handleCambiarPassword} disabled={modalLoading}>
                    {modalLoading ? 'Actualizando...' : 'Cambiar contraseña'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}