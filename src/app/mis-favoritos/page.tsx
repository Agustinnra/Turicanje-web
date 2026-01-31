'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './mis-favoritos.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

interface Favorito {
  id: string;
  name: string;
  category?: string;
  neighborhood?: string;
  imagen_url?: string;
  calificacion_promedio?: number;
  total_reviews?: number;
  total_favoritos?: number;
}

interface Creador {
  id: number;
  username: string;
  nombre: string;
  titulo?: string;
  foto_perfil?: string;
  total_seguidores?: number;
}

export default function MisFavoritosPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'favoritos' | 'creadores'>('favoritos');
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [creadores, setCreadores] = useState<Creador[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('usuario_token');
    const usuarioData = localStorage.getItem('usuario_data');
    
    if (!token) {
      router.push('/login?redirect=/mis-favoritos');
      return;
    }

    if (usuarioData) {
      setUsuario(JSON.parse(usuarioData));
    }

    cargarDatos(token);
  }, []);

  const cargarDatos = async (token: string) => {
    setLoading(true);
    try {
      // Cargar favoritos
      const favRes = await fetch(`${API_URL}/api/social/mis-favoritos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (favRes.ok) {
        const data = await favRes.json();
        setFavoritos(data);
      }

      // Cargar creadores que sigo
      const creadoresRes = await fetch(`${API_URL}/api/social/mis-creadores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (creadoresRes.ok) {
        const data = await creadoresRes.json();
        setCreadores(data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario_token');
    localStorage.removeItem('usuario_data');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="mis-favoritos-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mis-favoritos-page">
      {/* Header */}
      <header className="page-header">
        <Link href="/" className="logo">
          <img src="/icons/logo-turicanje.png" alt="Turicanje" />
        </Link>
        <div className="user-info">
          <span>Hola, {usuario?.nombre || 'Usuario'}</span>
          <button onClick={handleLogout} className="btn-logout">Cerrar sesión</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab ${activeTab === 'favoritos' ? 'active' : ''}`}
          onClick={() => setActiveTab('favoritos')}
        >
          ❤️ Mis Favoritos ({favoritos.length})
        </button>
        <button 
          className={`tab ${activeTab === 'creadores' ? 'active' : ''}`}
          onClick={() => setActiveTab('creadores')}
        >
          👤 Creadores ({creadores.length})
        </button>
      </div>

      {/* Contenido */}
      <main className="content">
        {activeTab === 'favoritos' && (
          <section className="favoritos-section">
            {favoritos.length === 0 ? (
              <div className="empty-state">
                <span className="emoji">❤️</span>
                <h3>No tienes favoritos aún</h3>
                <p>Explora lugares y guarda tus favoritos para verlos aquí</p>
                <Link href="/" className="btn-explorar">Explorar lugares</Link>
              </div>
            ) : (
              <div className="favoritos-grid">
                {favoritos.map(lugar => (
                  <Link href={`/blog/${lugar.id}`} key={lugar.id} className="lugar-card">
                    <div className="lugar-imagen">
                      {lugar.imagen_url ? (
                        <img src={lugar.imagen_url} alt={lugar.name} />
                      ) : (
                        <div className="imagen-placeholder">🍽️</div>
                      )}
                      <span className="favorito-badge">❤️</span>
                    </div>
                    <div className="lugar-info">
                      <h3>{lugar.name}</h3>
                      {lugar.category && <span className="categoria">{lugar.category}</span>}
                      {lugar.neighborhood && <span className="ubicacion">📍 {lugar.neighborhood}</span>}
                      {lugar.calificacion_promedio !== undefined && lugar.calificacion_promedio > 0 && (
                        <div className="rating">
                          ⭐ {lugar.calificacion_promedio.toFixed(1)}
                          {lugar.total_reviews !== undefined && (
                            <span className="reviews-count">({lugar.total_reviews})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'creadores' && (
          <section className="creadores-section">
            {creadores.length === 0 ? (
              <div className="empty-state">
                <span className="emoji">👤</span>
                <h3>No sigues a ningún creador</h3>
                <p>Descubre creadores de contenido y síguelos para ver sus recomendaciones</p>
                <Link href="/" className="btn-explorar">Descubrir creadores</Link>
              </div>
            ) : (
              <div className="creadores-grid">
                {creadores.map(creador => (
                  <Link href={`/profile/${creador.username}`} key={creador.id} className="creador-card">
                    <div className="creador-avatar">
                      {creador.foto_perfil ? (
                        <img src={creador.foto_perfil} alt={creador.nombre} />
                      ) : (
                        <div className="avatar-placeholder">
                          {creador.nombre.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="creador-info">
                      <h3>{creador.nombre}</h3>
                      <span className="username">@{creador.username}</span>
                      {creador.titulo && <span className="titulo">{creador.titulo}</span>}
                      <span className="seguidores">{creador.total_seguidores} seguidores</span>
                    </div>
                    <span className="siguiendo-badge">✓ Siguiendo</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="page-footer">
        <p>© 2026 Turicanje - Descubre los mejores lugares de CDMX</p>
      </footer>
    </div>
  );
}