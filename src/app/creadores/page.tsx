'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import './creadores.css';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

interface Creador {
  id: number;
  username: string;
  nombre: string;
  titulo: string;
  bio: string;
  foto_perfil: string;
  instagram_url: string;
  tiktok_url: string;
  total_seguidores: number;
  total_recomendaciones: number;
  siguiendo?: boolean;
}

export default function CreadoresPage() {
  const router = useRouter();
  const [creadores, setCreadores] = useState<Creador[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

  useEffect(() => {
    // Verificar si hay usuario logueado
    const userData = localStorage.getItem('usuario_data');
    if (userData) {
      try {
        setUsuario(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data');
      }
    }

    cargarCreadores();

    // Cerrar menú al hacer click afuera
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarCreadores = async () => {
    try {
      const token = localStorage.getItem('usuario_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/creadores`, { headers });
      
      if (res.ok) {
        const data = await res.json();
        setCreadores(data.creadores || data || []);
      }
    } catch (error) {
      console.error('Error cargando creadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeguir = async (creadorId: number) => {
    const token = localStorage.getItem('usuario_token');
    
    if (!token) {
      localStorage.setItem('redirect_after_login', '/creadores');
      router.push('/login');
      return;
    }

    try {
      const creador = creadores.find(c => c.id === creadorId);
      const method = creador?.siguiendo ? 'DELETE' : 'POST';

      const res = await fetch(`${API_URL}/api/social/creadores/${creadorId}/seguir`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setCreadores(creadores.map(c => {
          if (c.id === creadorId) {
            return {
              ...c,
              siguiendo: !c.siguiendo,
              total_seguidores: c.siguiendo ? c.total_seguidores - 1 : c.total_seguidores + 1
            };
          }
          return c;
        }));
      }
    } catch (error) {
      console.error('Error al seguir/dejar de seguir:', error);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('usuario_token');
    localStorage.removeItem('usuario_data');
    setUsuario(null);
    setUserMenuOpen(false);
    router.refresh();
  };

  const creadoresFiltrados = creadores.filter(c => 
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.titulo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="creadores-page">
      {/* Header */}
      <header className="creadores-header">
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
            <Link href="/creadores" className="nav-link active">Creadores</Link>
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
                    <span>👤</span> <span style={{color: '#333'}}>Mi cuenta</span>
                  </Link>
                  <Link href="/blog" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <span>🍽️</span> <span style={{color: '#333'}}>Restaurantes</span>
                  </Link>
                  <Link href="/" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <span>🏠</span> <span style={{color: '#333'}}>Inicio</span>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={cerrarSesion}>
                    <span>🚪</span> <span style={{color: '#c62828'}}>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-login">
              Iniciar sesión
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="creadores-hero">
        <div className="hero-content">
          <h1>Creadores de contenido</h1>
          <p>Descubre a los foodies que comparten los mejores lugares para comer en la ciudad</p>
        </div>
      </section>

      {/* Búsqueda */}
      <section className="creadores-search">
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar creador por nombre o username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="search-results-count">
            {creadoresFiltrados.length} creador{creadoresFiltrados.length !== 1 ? 'es' : ''}
          </span>
        </div>
      </section>

      {/* Grid de creadores */}
      <section className="creadores-grid-section">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando creadores...</p>
          </div>
        ) : creadoresFiltrados.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <h3>No encontramos creadores</h3>
            <p>Intenta con otro término de búsqueda</p>
          </div>
        ) : (
          <div className="creadores-grid">
            {creadoresFiltrados.map(creador => (
              <div key={creador.id} className="creador-card">
                <Link href={`/profile/${creador.username}`} className="creador-card-link">
                  <div className="creador-cover">
                    <div className="cover-gradient"></div>
                  </div>
                  <div className="creador-avatar">
                    {creador.foto_perfil ? (
                      <img src={creador.foto_perfil} alt={creador.nombre} />
                    ) : (
                      <div className="avatar-placeholder">
                        {creador.nombre?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="creador-info">
                    <h3 className="creador-nombre">{creador.nombre}</h3>
                    <span className="creador-username">@{creador.username}</span>
                    <p className="creador-titulo">{creador.titulo || 'Creador de contenido'}</p>
                    <div className="creador-stats">
                      <div className="stat">
                        <span className="stat-number">{creador.total_seguidores || 0}</span>
                        <span className="stat-label">Seguidores</span>
                      </div>
                      <div className="stat">
                        <span className="stat-number">{creador.total_recomendaciones || 0}</span>
                        <span className="stat-label">Reseñas</span>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="creador-actions">
                  <button 
                    className={`btn-seguir ${creador.siguiendo ? 'siguiendo' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSeguir(creador.id);
                    }}
                  >
                    {creador.siguiendo ? '✓ Siguiendo' : '+ Seguir'}
                  </button>
                </div>
                {/* Redes sociales */}
                {(creador.instagram_url || creador.tiktok_url) && (
                  <div className="creador-social">
                    {creador.instagram_url && (
                      <a href={creador.instagram_url} target="_blank" rel="noopener noreferrer" className="social-link instagram">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    )}
                    {creador.tiktok_url && (
                      <a href={creador.tiktok_url} target="_blank" rel="noopener noreferrer" className="social-link tiktok">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA para convertirse en creador */}
      <section className="creadores-cta">
        <div className="cta-content">
          <h2>¿Eres creador de contenido?</h2>
          <p>Únete a Turicanje y comparte tus restaurantes favoritos con tu comunidad</p>
          <Link href="/contacto" className="btn-cta">
            Quiero ser creador
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="creadores-footer">
        <div className="footer-content">
          <Link href="/" className="footer-logo">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={120} 
              height={40}
              style={{ objectFit: 'contain' }}
            />
          </Link>
          <p>© {new Date().getFullYear()} Turicanje. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}