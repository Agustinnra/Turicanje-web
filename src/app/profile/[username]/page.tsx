'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import './creador.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

interface Creador {
  id: number;
  username: string;
  nombre: string;
  titulo?: string;
  bio?: string;
  foto_perfil?: string;
  foto_portada?: string;
  video_embed?: string;
  redes_sociales?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
    web?: string;
  };
}

interface Recomendacion {
  id: string;
  name: string;
  category?: string;
  neighborhood?: string;
  imagen_url?: string;
  calificacion_promedio?: number;
  total_reviews?: number;
}

export default function CreadorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [creador, setCreador] = useState<Creador | null>(null);
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado para seguir
  const [siguiendo, setSiguiendo] = useState(false);
  const [totalSeguidores, setTotalSeguidores] = useState(0);
  const [loadingSeguir, setLoadingSeguir] = useState(false);
  const [usuarioLogueado, setUsuarioLogueado] = useState(false);

  // Estado para menú de usuario
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('usuario_token');
    setUsuarioLogueado(!!token);

    // Cargar datos del usuario
    const userData = localStorage.getItem('usuario_data');
    if (userData) {
      try {
        setUsuario(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data');
      }
    }

    cargarCreador();

    // Cerrar menú al hacer click afuera
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [username]);

  const cerrarSesion = () => {
    localStorage.removeItem('usuario_token');
    localStorage.removeItem('usuario_data');
    setUsuario(null);
    setUsuarioLogueado(false);
    setUserMenuOpen(false);
    router.refresh();
  };

  const cargarCreador = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/creadores/profile/${username}`);
      
      if (!res.ok) {
        throw new Error('Creador no encontrado');
      }

      const data = await res.json();
      setCreador(data);
      setRecomendaciones(data.recomendaciones || []);
      cargarSeguidores(data.id);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarSeguidores = async (creadorId: number) => {
    try {
      const token = localStorage.getItem('usuario_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/social/creadores/${creadorId}/seguidores`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTotalSeguidores(data.total_seguidores);
        setSiguiendo(data.siguiendo);
      }
    } catch (err) {
      console.error('Error cargando seguidores:', err);
    }
  };

  const handleSeguir = async () => {
    if (!usuarioLogueado) {
      window.location.href = '/login-usuario?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    if (!creador) return;

    setLoadingSeguir(true);
    try {
      const token = localStorage.getItem('usuario_token');
      const method = siguiendo ? 'DELETE' : 'POST';
      
      const res = await fetch(`${API_URL}/api/social/creadores/${creador.id}/seguir`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setSiguiendo(data.siguiendo);
        setTotalSeguidores(data.total_seguidores);
      } else {
        const error = await res.json();
        alert(error.mensaje || 'Error al procesar la solicitud');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingSeguir(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !creador) {
    return (
      <div className="profile-page">
        <div className="error-state">
          <h2>😕 Perfil no encontrado</h2>
          <p>{error || 'El perfil que buscas no existe o no está disponible.'}</p>
          <Link href="/creadores" className="btn-volver">← Ver creadores</Link>
        </div>
      </div>
    );
  }

  const tieneRedes = creador.redes_sociales && Object.values(creador.redes_sociales).some(v => v);

  return (
    <div className="profile-page">
      {/* Header con logo */}
      <header className="profile-nav-header">
        <div className="header-container">
          <Link href="/" className="header-logo">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={140} 
              height={40}
              style={{ objectFit: 'contain' }}
            />
          </Link>

          <nav className="header-nav">
            <Link href="/blog" className="nav-link">Restaurantes</Link>
            <Link href="/creadores" className="nav-link">Creadores</Link>
          </nav>

          {usuario ? (
            <div className="header-user-menu" ref={userMenuRef}>
              <button 
                className="user-menu-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <span className="user-avatar-header">
                  {usuario.nombre?.charAt(0).toUpperCase() || '?'}
                </span>
                <span className="user-name-header">{usuario.nombre?.split(' ')[0]}</span>
                <span className={`menu-arrow ${userMenuOpen ? 'open' : ''}`}>▼</span>
              </button>

              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <span className="dropdown-name">{usuario.nombre}</span>
                    <span className="dropdown-email">{usuario.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link href="/mi-cuenta" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <span>👤</span> <span>Mi cuenta</span>
                  </Link>
                  <Link href="/blog" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <span>🍽️</span> <span>Restaurantes</span>
                  </Link>
                  <Link href="/creadores" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <span>👥</span> <span>Creadores</span>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={cerrarSesion}>
                    <span>🚪</span> <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login-usuario" className="btn-login">
              Iniciar sesión
            </Link>
          )}
        </div>
      </header>

      {/* Header con portada */}
      <header className="profile-header">
        <div 
          className="portada"
          style={{
            backgroundImage: creador.foto_portada 
              ? `url(${creador.foto_portada})` 
              : 'linear-gradient(135deg, #6b3fa0 0%, #d1007d 50%, #ff6b9d 100%)'
          }}
        />
        <div className="header-content">
          <div className="avatar-container">
            {creador.foto_perfil ? (
              <img src={creador.foto_perfil} alt={creador.nombre} className="avatar" />
            ) : (
              <div className="avatar-placeholder">
                {creador.nombre.charAt(0)}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1>{creador.nombre}</h1>
            <p className="username">@{creador.username}</p>
            {creador.titulo && <p className="titulo">{creador.titulo}</p>}
            <p className="seguidores-count">
              <strong>{totalSeguidores}</strong> {totalSeguidores === 1 ? 'seguidor' : 'seguidores'}
            </p>
          </div>
          <button 
            className={`btn-seguir ${siguiendo ? 'siguiendo' : ''}`}
            onClick={handleSeguir}
            disabled={loadingSeguir}
          >
            {loadingSeguir ? '...' : siguiendo ? '✓ Siguiendo' : '+ Seguir'}
          </button>
        </div>
      </header>

      {/* Bio */}
      {creador.bio && (
        <section className="bio-section">
          <p>{creador.bio}</p>
        </section>
      )}

      {/* Redes sociales - ICONOS CIRCULARES */}
      {tieneRedes && (
        <section className="redes-section">
          <div className="redes-grid">
            {creador.redes_sociales?.instagram && (
              <a 
                href={creador.redes_sociales.instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-icon instagram"
                title="Instagram"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}
            {creador.redes_sociales?.youtube && (
              <a 
                href={creador.redes_sociales.youtube} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-icon youtube"
                title="YouTube"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            )}
            {creador.redes_sociales?.tiktok && (
              <a 
                href={creador.redes_sociales.tiktok} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-icon tiktok"
                title="TikTok"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
            )}
            {creador.redes_sociales?.facebook && (
              <a 
                href={creador.redes_sociales.facebook} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-icon facebook"
                title="Facebook"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            )}
            {creador.redes_sociales?.twitter && (
              <a 
                href={creador.redes_sociales.twitter} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-icon twitter"
                title="X (Twitter)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            )}
            {creador.redes_sociales?.web && (
              <a 
                href={creador.redes_sociales.web} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-icon web"
                title="Sitio web"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </a>
            )}
          </div>
        </section>
      )}

      {/* Video embed */}
      {creador.video_embed && (
        <section className="video-section">
          <h2>🎬 Video destacado</h2>
          <div className="video-container">
            <iframe
              src={getYouTubeEmbedUrl(creador.video_embed) || creador.video_embed}
              title="Video destacado"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* Recomendaciones */}
      <section className="recomendaciones-section">
        <h2>🍽️ Recomendaciones ({recomendaciones.length})</h2>
        {recomendaciones.length > 0 ? (
          <div className="recomendaciones-grid">
            {recomendaciones.map(lugar => (
              <Link href={`/blog/${lugar.id}`} key={lugar.id} className="lugar-card">
                <div className="lugar-imagen">
                  {lugar.imagen_url ? (
                    <img src={lugar.imagen_url} alt={lugar.name} />
                  ) : (
                    <div className="imagen-placeholder">🍽️</div>
                  )}
                </div>
                <div className="lugar-info">
                  <h3>{lugar.name}</h3>
                  {lugar.category && <span className="categoria">{lugar.category}</span>}
                  {lugar.neighborhood && (
                    <span className="ubicacion">📍 {lugar.neighborhood}</span>
                  )}
                  {lugar.calificacion_promedio !== undefined && lugar.calificacion_promedio > 0 && (
                    <div className="rating">
                      <span className="star">⭐</span>
                      {lugar.calificacion_promedio.toFixed(1)}
                      {lugar.total_reviews !== undefined && (
                        <span className="reviews-count">({lugar.total_reviews} reseñas)</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-message">
            <span>📝</span>
            Aún no hay recomendaciones de este creador
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="profile-footer">
        <Link href="/">
          <img src="/icons/logo-turicanje.png" alt="Turicanje" className="footer-logo" />
        </Link>
        <p>Descubre los mejores lugares de CDMX</p>
      </footer>
    </div>
  );
}