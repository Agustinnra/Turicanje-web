'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import './blog.css';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

interface Restaurant {
  id: string;
  slug: string;
  nombre: string;
  name: string;
  descripcion: string;
  imagen_principal: string;
  category: string;
  categorias: string;
  neighborhood: string;
  colonia: string;
  calificacion: number;
  calificacion_promedio: number;
  precio_promedio: string;
  cashback: boolean;
  cashback_pct: number;
  esFavorito?: boolean;
}

export default function BlogPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  const [favoritosIds, setFavoritosIds] = useState<Set<string>>(new Set());
  const userMenuRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

  const categorias = [
    { id: 'todas', nombre: 'Todas', emoji: '🍽️' },
    { id: 'Callejera', nombre: 'Callejera', emoji: '🌮' },
    { id: 'italiana', nombre: 'Italiana', emoji: '🍝' },
    { id: 'japonesa', nombre: 'Japonesa', emoji: '🍱' },
    { id: 'mariscos', nombre: 'Mariscos', emoji: '🦐' },
    { id: 'cafe', nombre: 'Café', emoji: '☕' },
    { id: 'parrilla', nombre: 'Parrilla', emoji: '🥩' },
    { id: 'postres', nombre: 'Postres', emoji: '🍰' },
  ];

  useEffect(() => {
    // Verificar si hay usuario logueado
    const userData = localStorage.getItem('usuario_data');
    if (userData) {
      try {
        setUsuario(JSON.parse(userData));
        cargarFavoritos();
      } catch (e) {
        console.error('Error parsing user data');
      }
    }

    cargarRestaurantes();

    // Cerrar menú al hacer click afuera
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarRestaurantes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants?all=true`);
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data || []);
      }
    } catch (error) {
      console.error('Error cargando restaurantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarFavoritos = async () => {
    const token = localStorage.getItem('usuario_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/social/mis-favoritos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // El endpoint puede devolver array directo o {favoritos: [...]}
        const favoritos = Array.isArray(data) ? data : (data.favoritos || []);
        const ids = new Set<string>(favoritos.map((f: any) => f.id || f.place_id));
        setFavoritosIds(ids);
      }
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    }
  };

  const toggleFavorito = async (restaurantId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('usuario_token');
    
    if (!token) {
      localStorage.setItem('redirect_after_login', '/blog');
      router.push('/login');
      return;
    }

    const esFavorito = favoritosIds.has(restaurantId);
    const method = esFavorito ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`${API_URL}/api/social/comercios/${restaurantId}/favorito`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setFavoritosIds(prev => {
          const newSet = new Set(prev);
          if (esFavorito) {
            newSet.delete(restaurantId);
          } else {
            newSet.add(restaurantId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error al cambiar favorito:', error);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('usuario_token');
    localStorage.removeItem('usuario_data');
    setUsuario(null);
    setUserMenuOpen(false);
    setFavoritosIds(new Set());
  };

  const restaurantesFiltrados = restaurants.filter(r => {
    const nombre = r.nombre || r.name || '';
    const colonia = r.colonia || r.neighborhood || '';
    const categoria = r.categorias || r.category || '';
    
    const matchSearch = 
      nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colonia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoria.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategoria = 
      categoriaActiva === 'todas' || 
      categoria.toLowerCase().includes(categoriaActiva.toLowerCase());

    return matchSearch && matchCategoria;
  });

  return (
    <div className="blog-page">
      {/* Header */}
      <header className="blog-header">
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
            <Link href="/blog" className="nav-link active">Restaurantes</Link>
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
                    <span>👤</span> <span style={{color: '#333'}}>Mi cuenta</span>
                  </Link>
                  <Link href="/mi-cuenta?tab=favoritos" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <span>❤️</span> <span style={{color: '#333'}}>Mis favoritos</span>
                  </Link>
                  <Link href="/creadores" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <span>👥</span> <span style={{color: '#333'}}>Ver creadores</span>
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
      <section className="blog-hero">
        <div className="hero-content">
          <h1>Descubre dónde comer</h1>
          <p>Los mejores restaurantes con cashback en cada visita</p>
          
          {/* Búsqueda */}
          <div className="hero-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre, zona o tipo de comida..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="blog-categorias">
        <div className="categorias-container">
          {categorias.map(cat => (
            <button
              key={cat.id}
              className={`categoria-btn ${categoriaActiva === cat.id ? 'active' : ''}`}
              onClick={() => setCategoriaActiva(cat.id)}
            >
              <span className="cat-emoji">{cat.emoji}</span>
              <span className="cat-nombre">{cat.nombre}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Resultados */}
      <section className="blog-resultados">
        <div className="resultados-header">
          <h2>{restaurantesFiltrados.length} restaurante{restaurantesFiltrados.length !== 1 ? 's' : ''}</h2>
          {usuario && (
            <Link href="/mi-cuenta?tab=favoritos" className="ver-favoritos">
              ❤️ Mis favoritos
            </Link>
          )}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando restaurantes...</p>
          </div>
        ) : restaurantesFiltrados.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🍽️</span>
            <h3>No encontramos restaurantes</h3>
            <p>Intenta con otro término o categoría</p>
            <button className="btn-reset" onClick={() => { setSearchTerm(''); setCategoriaActiva('todas'); }}>
              Ver todos
            </button>
          </div>
        ) : (
          <div className="restaurantes-grid">
            {restaurantesFiltrados.map(restaurant => {
              const nombre = restaurant.nombre || restaurant.name || 'Sin nombre';
              const categoria = restaurant.categorias || restaurant.category || '';
              const colonia = restaurant.colonia || restaurant.neighborhood || '';
              const calificacion = restaurant.calificacion || restaurant.calificacion_promedio;
              const cashbackPct = restaurant.cashback ? restaurant.cashback_pct : 0;
              
              return (
              <Link 
                key={restaurant.id}
                href={`/blog/${restaurant.slug || restaurant.id}`}
                className="restaurant-card"
              >
                {/* Imagen */}
                <div className="card-imagen">
                  {restaurant.imagen_principal ? (
                    <img
                      src={restaurant.imagen_principal}
                      alt={nombre}
                      className="card-img"
                    />
                  ) : (
                    <div className="imagen-placeholder">
                      <span>🍽️</span>
                    </div>
                  )}
                  
                  {/* Botón favorito */}
                  <button 
                    className={`btn-favorito ${favoritosIds.has(restaurant.id) ? 'activo' : ''}`}
                    onClick={(e) => toggleFavorito(restaurant.id, e)}
                    title={favoritosIds.has(restaurant.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  >
                    {favoritosIds.has(restaurant.id) ? '❤️' : '🤍'}
                  </button>

                  {/* Badge de cashback */}
                  {cashbackPct > 0 && (
                    <div className="badge-cashback">
                      {cashbackPct}% cashback
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="card-info">
                  <h3 className="card-nombre">{nombre}</h3>
                  
                  {categoria && (
                    <span className="card-categoria">{categoria}</span>
                  )}
                  
                  {restaurant.descripcion && (
                    <p className="card-descripcion">{restaurant.descripcion}</p>
                  )}

                  <div className="card-meta">
                    {colonia && (
                      <span className="meta-ubicacion">📍 {colonia}</span>
                    )}
                    {calificacion && (
                      <span className="meta-rating">⭐ {calificacion}</span>
                    )}
                    {restaurant.precio_promedio && (
                      <span className="meta-precio">{restaurant.precio_promedio}</span>
                    )}
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="blog-cta">
        <div className="cta-content">
          <h2>¿Tienes un restaurante?</h2>
          <p>Únete a Turicanje y llega a más clientes con nuestro programa de cashback</p>
          <Link href="/afiliar-negocio" className="btn-cta">
            Afiliar mi negocio
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="blog-footer">
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