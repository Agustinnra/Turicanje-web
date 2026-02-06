'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './comercio.css';

interface Creador {
  id: number;
  username: string;
  nombre: string;
  titulo?: string;
  foto_perfil?: string;
  redes_sociales?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    web?: string;
  };
}

interface Review {
  id: number;
  calificacion: number;
  comentario?: string;
  user_nombre: string;
  verificado: boolean;
  created_at: string;
}

interface Stats {
  visualizaciones: number;
  total_reviews: number;
  promedio: number;
}

interface Comercio {
  id: string;
  name: string;
  name_en?: string;
  category: string;
  products?: string[];
  descripcion?: string;
  address: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  phone?: string;
  whatsapp?: string;
  hours?: string;
  lat?: number;
  lng?: number;
  imagen_url?: string;
  galeria_lugar?: string[];
  galeria_menu?: string[];
  instagram_embed?: string;
  url_order?: string;
  url_reservaciones?: string;
  // Redes sociales como columnas individuales
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  x_twitter?: string;
  youtube?: string;
  calificacion_promedio?: number;
  total_reviews?: number;
  cashback_porcentaje?: number;
  is_active?: boolean;
  plan_activo?: boolean;
  created_at?: string;
  // Amenidades
  area_fumar?: boolean;
  terraza?: boolean;
  area_infantil?: boolean;
  pet_friendly?: boolean;
  estacionamiento?: boolean;
  acepta_reservaciones?: boolean;
  delivery?: boolean;
  opciones_menu?: string[];
  // Creador
  creador_id?: number;
  creador_username?: string;
  creador_nombre?: string;
  creador_titulo?: string;
  creador_foto?: string;
  creador_redes?: any;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function ComercioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Estados para reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({ visualizaciones: 0, total_reviews: 0, promedio: 0 });
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComentario, setNewComentario] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Estados para favoritos
  const [esFavorito, setEsFavorito] = useState(false);
  const [totalFavoritos, setTotalFavoritos] = useState(0);
  const [loadingFavorito, setLoadingFavorito] = useState(false);
  const [usuarioLogueado, setUsuarioLogueado] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const lastTapRef = useRef(0);
  const touchDistRef = useRef(0);


  // Estados para lightbox del menú
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);





  useEffect(() => {
    // Verificar si hay usuario logueado
    const token = localStorage.getItem('usuario_token');
    const userData = localStorage.getItem('usuario_data');
    
    if (token && userData) {
      try {
        setUsuario(JSON.parse(userData));
        setUsuarioLogueado(true);
      } catch (e) {
        setUsuarioLogueado(false);
      }
    }
    
    const cargarComercio = async () => {
      try {
        const response = await fetch(`${API_URL}/api/restaurants/${slug}`);
        if (!response.ok) return;
        const data = await response.json();
        setComercio(data);
      } catch (error) {
        console.error('Error cargando comercio:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) cargarComercio();
  }, [slug]);


// Cargar scripts de Instagram Y TikTok para embeds
useEffect(() => {
  if (comercio?.instagram_embed) {
    const embedContent = comercio.instagram_embed;
    
    // Detectar si es TikTok
    const isTikTok = embedContent.includes('tiktok.com') || embedContent.includes('tiktok-embed');
    
    // Detectar si es Instagram  
    const isInstagram = embedContent.includes('instagram.com') || embedContent.includes('instagr.am');
    
    if (isTikTok) {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
        if (existingScript) {
          existingScript.remove();
        }
        const script = document.createElement('script');
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
      }, 100);
    }
    
    if (isInstagram) {
      const existingInstaScript = document.querySelector('script[src="//www.instagram.com/embed.js"]');
      if (!existingInstaScript) {
        const script = document.createElement('script');
        script.src = '//www.instagram.com/embed.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
          if ((window as any).instgrm) {
            (window as any).instgrm.Embeds.process();
          }
        };
      } else {
        if ((window as any).instgrm) {
          (window as any).instgrm.Embeds.process();
        }
      }
    }
  }
}, [comercio?.instagram_embed]);

  // Cargar reviews y stats cuando tengamos el comercio
  useEffect(() => {
    if (!comercio?.id) return;
    
    const cargarReviewsYStats = async () => {
      try {
        // Cargar reviews - GET /api/reviews/:place_id
        const reviewsRes = await fetch(`${API_URL}/api/reviews/${comercio.id}`);
        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          // Tu endpoint retorna { place, reviews, rating_distribution, pagination }
          setReviews(data.reviews || []);
          setStats(prev => ({
            ...prev,
            total_reviews: data.place?.total_reviews || 0,
            promedio: data.place?.average_rating || 0
          }));
        }
        
        // Cargar visualizaciones - GET /api/reviews/views/:place_id
        const viewsRes = await fetch(`${API_URL}/api/reviews/views/${comercio.id}`);
        if (viewsRes.ok) {
          const viewsData = await viewsRes.json();
          setStats(prev => ({
            ...prev,
            visualizaciones: viewsData.visualizaciones || 0
          }));
        }
        
        // Registrar visualización - POST /api/reviews/view/:place_id
        fetch(`${API_URL}/api/reviews/view/${comercio.id}`, { method: 'POST' });

        // Cargar info de favoritos
        cargarFavoritos(comercio.id);
        
      } catch (error) {
        console.error('Error cargando reviews:', error);
      }
    };
    
    cargarReviewsYStats();
  }, [comercio?.id]);

  // Función para enviar review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRating) {
      setReviewError('Selecciona una calificación');
      return;
    }
    
    if (!newNombre.trim()) {
      setReviewError('Ingresa tu nombre');
      return;
    }
    
    setSubmitting(true);
    setReviewError('');
    
    try {
      // POST /api/reviews con place_id en el body
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: comercio?.id,
          calificacion: newRating,
          comentario: newComentario,
          user_nombre: newNombre
        })
      });
      
      if (response.ok) {
        // Recargar reviews
        const reviewsRes = await fetch(`${API_URL}/api/reviews/${comercio?.id}`);
        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          setReviews(data.reviews || []);
          setStats(prev => ({
            ...prev,
            total_reviews: data.place?.total_reviews || 0,
            promedio: data.place?.average_rating || 0
          }));
        }
        
        // Limpiar formulario
        setNewRating(0);
        setNewComentario('');
        setNewNombre('');
      } else {
        const error = await response.json();
        setReviewError(error.error || 'Error al enviar review');
      }
    } catch (error) {
      setReviewError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  // Función para copiar link
  const copiarLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2000);
  };

  // Funciones del lightbox
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const nextImage = () => {
    const galeriaMenu = comercio?.galeria_menu || [];
    setLightboxIndex((prev) => (prev + 1) % galeriaMenu.length);
    setZoomLevel(1);
    setZoomPosition({ x: 50, y: 50 });
  };

  const prevImage = () => {
    const galeriaMenu = comercio?.galeria_menu || [];
    setLightboxIndex((prev) => (prev - 1 + galeriaMenu.length) % galeriaMenu.length);
    setZoomLevel(1);
    setZoomPosition({ x: 50, y: 50 });
  };

  // Manejar teclas en lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, comercio?.galeria_menu?.length]);

  // Cargar info de favoritos
  const cargarFavoritos = async (placeId: string) => {
    try {
      const token = localStorage.getItem('usuario_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/social/comercios/${placeId}/favoritos`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTotalFavoritos(data.total_favoritos);
        setEsFavorito(data.es_favorito);
      }
    } catch (err) {
      console.error('Error cargando favoritos:', err);
    }
  };

  // Toggle favorito
  const handleFavorito = async () => {
    if (!usuarioLogueado) {
      // Redirigir a login
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    if (!comercio) return;

    setLoadingFavorito(true);
    try {
      const token = localStorage.getItem('usuario_token');
      const method = esFavorito ? 'DELETE' : 'POST';
      
      const res = await fetch(`${API_URL}/api/social/comercios/${comercio.id}/favorito`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setEsFavorito(data.favorito);
        setTotalFavoritos(data.total_favoritos);
      } else {
        const error = await res.json();
        alert(error.mensaje || 'Error al procesar la solicitud');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingFavorito(false);
    }
  };

  // URLs para compartir
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = comercio ? `Mira ${comercio.name} en Turicanje` : '';

  // Formatear fecha de review
  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  // Cerrar sesión
  const cerrarSesion = () => {
    localStorage.removeItem('usuario_token');
    localStorage.removeItem('usuario_data');
    setUsuario(null);
    setUsuarioLogueado(false);
    setUserMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!comercio) {
    return (
      <div className="not-found">
        <h1>Comercio no encontrado</h1>
        <Link href="/">Volver al inicio</Link>
      </div>
    );
  }

  const galeriaMenu = comercio.galeria_menu || [];
  const galeriaLugar = comercio.galeria_lugar || [];
  const imagenHero = comercio.imagen_url || '/images/placeholder-comercio.jpg';
  
  const googleMapsUrl = comercio.lat && comercio.lng 
    ? `https://maps.app.goo.gl/?q=${comercio.lat},${comercio.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(comercio.address)}`;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="comercio-page">
      {/* ==================== HEADER TRANSPARENTE ==================== */}
      <header className="landing-header">
        <div className="header-content">
          <Link href="/" className="logo-link">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={200}
              height={70}
              className="logo-image"
              priority
            />
          </Link>

          {/* Navegación Desktop */}
          <nav className="nav-desktop">
            <Link href="/" className="nav-link">INICIO</Link>
            <Link href="/nosotros" className="nav-link">NOSOTROS</Link>
            
            <div 
              className="nav-item-dropdown"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="nav-link">
                SERVICIOS <span className="dropdown-arrow">▼</span>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link href="/afiliar-negocio" className="dropdown-item">
                    🏪 Registrar mi negocio
                  </Link>
                  <Link href="/registro-usuario" className="dropdown-item">
                    👤 Crear cuenta de usuario
                  </Link>
                  <Link href="/faq" className="dropdown-item">
                    ❓ Preguntas frecuentes
                  </Link>
                </div>
              )}
            </div>
            
            <Link href="/contacto" className="nav-link">CONTACTO</Link>
          </nav>

          {usuarioLogueado && usuario ? (
            <div className="header-user-menu" style={{ position: 'relative' }}>
              <button 
                className="user-menu-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 14px 6px 6px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #d1007d 0%, #6b3fa0 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                }}>
                  {usuario.nombre?.charAt(0).toUpperCase() || '?'}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>
                  {usuario.nombre?.split(' ')[0]}
                </span>
                <span style={{ 
                  fontSize: '10px', 
                  color: 'rgba(255,255,255,0.7)',
                  transform: userMenuOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s'
                }}>▼</span>
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 25px rgba(0, 0, 0, 0.15)',
                  minWidth: '220px',
                  overflow: 'hidden',
                  zIndex: 1000,
                }}>
                  <div style={{ padding: '16px', background: '#f9f9f9' }}>
                    <span style={{ display: 'block', fontWeight: 600, color: '#333', fontSize: '14px' }}>
                      {usuario.nombre}
                    </span>
                    <span style={{ display: 'block', fontSize: '12px', color: '#666', marginTop: '2px' }}>
                      {usuario.email}
                    </span>
                  </div>
                  <div style={{ height: '1px', background: '#eee' }}></div>
                  <Link 
                    href="/mi-cuenta" 
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#333', textDecoration: 'none', fontSize: '14px' }}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span>👤</span> Mi cuenta
                  </Link>
                  <Link 
                    href="/mi-cuenta?tab=favoritos" 
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#333', textDecoration: 'none', fontSize: '14px' }}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span>❤️</span> Mis favoritos
                  </Link>
                  <Link 
                    href="/blog" 
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#333', textDecoration: 'none', fontSize: '14px' }}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span>🍽️</span> Restaurantes
                  </Link>
                  <div style={{ height: '1px', background: '#eee' }}></div>
                  <button 
                    onClick={cerrarSesion}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#c62828', background: 'white', border: 'none', width: '100%', textAlign: 'left', fontSize: '14px', cursor: 'pointer' }}
                  >
                    <span>🚪</span> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="login-btn">
              <span className="login-icon">👤</span>
              Iniciar sesión
            </Link>
          )}

          {/* Hamburger Menu */}
          <button 
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="nav-mobile">
            <Link href="/" className="nav-link-mobile">Inicio</Link>
            <Link href="/blog" className="nav-link-mobile">Restaurantes</Link>
            <Link href="/nosotros" className="nav-link-mobile">Nosotros</Link>
            <Link href="/afiliar-negocio" className="nav-link-mobile sub-item">🏪 Registrar mi negocio</Link>
            <Link href="/faq" className="nav-link-mobile sub-item">❓ Preguntas frecuentes</Link>
            <Link href="/contacto" className="nav-link-mobile">Contacto</Link>
            {usuarioLogueado && usuario ? (
              <>
                <Link href="/mi-cuenta" className="nav-link-mobile login-mobile">👤 {usuario.nombre?.split(' ')[0]}</Link>
                <button 
                  onClick={cerrarSesion} 
                  className="nav-link-mobile"
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', color: '#c62828', cursor: 'pointer' }}
                >
                  🚪 Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/registro-usuario" className="nav-link-mobile sub-item">👤 Crear cuenta</Link>
                <Link href="/login" className="nav-link-mobile login-mobile">Iniciar sesión</Link>
              </>
            )}
          </nav>
        )}
      </header>

      {/* ===== CATEGORÍAS NAV ===== */}
      <nav className="categories-nav">
        <div className="categories-content">
          <Link href="/blog">Todas las entradas</Link>
          <Link href="/blog?category=Restaurante">RESTAURANTES</Link>
          <Link href="/blog?category=Bar">ANTROS, BARES Y CANTINAS</Link>
          <Link href="/blog?category=Eventos">EVENTOS, TOURS Y EXPERIENCIAS</Link>
          <Link href="/blog?category=Hospedaje">HOSPEDAJE</Link>
          <Link href="/blog?category=Cafetería">CAFETERÍAS</Link>
          <Link href="/blog?category=Comida Callejera">COMIDA CALLEJERA</Link>
          <Link href="/blog?category=Dark Kitchen">DARK KITCHEN</Link>
        </div>
      </nav>

      {/* ==================== HERO SECTION ==================== */}
      <section className="hero-section">
        <div className="hero-background">
          <img src={imagenHero} alt={comercio.name} />
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          {/* Badge categoría */}
          <span className="hero-badge">{comercio.category}</span>
          
          {/* Título */}
          <h1 className="hero-title">{comercio.name}</h1>
          
          {/* Rating */}
          <div className="hero-rating">
            <div className="stars-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star} 
                  className={`star ${star <= Math.round(Number(comercio.calificacion_promedio || 0)) ? 'filled' : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="rating-text">
              {comercio.calificacion_promedio ? Number(comercio.calificacion_promedio).toFixed(1) : '—'} 
              ({comercio.total_reviews || 0} reseñas)
            </span>
          </div>
          
          {/* Ubicación */}
          <p className="hero-location">
            📍 {comercio.neighborhood}, {comercio.city || 'CDMX'}
          </p>

          {/* Redes Sociales */}
          {(comercio.instagram || comercio.facebook || comercio.tiktok || comercio.x_twitter || comercio.youtube) && (
            <div className="hero-social">
              {comercio.instagram && (
                <a 
                  href={comercio.instagram.startsWith('http') ? comercio.instagram : `https://instagram.com/${comercio.instagram.replace('@', '')}`}
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
              {comercio.facebook && (
                <a 
                  href={comercio.facebook.startsWith('http') ? comercio.facebook : `https://facebook.com/${comercio.facebook}`}
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
              {comercio.tiktok && (
                <a 
                  href={comercio.tiktok.startsWith('http') ? comercio.tiktok : `https://tiktok.com/@${comercio.tiktok.replace('@', '')}`}
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
              {comercio.x_twitter && (
                <a 
                  href={comercio.x_twitter.startsWith('http') ? comercio.x_twitter : `https://x.com/${comercio.x_twitter.replace('@', '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-icon x-twitter"
                  title="X (Twitter)"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {comercio.youtube && (
                <a 
                  href={comercio.youtube.startsWith('http') ? comercio.youtube : `https://youtube.com/${comercio.youtube}`}
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
            </div>
          )}

          {/* Botones CTA */}
          <div className="hero-buttons">
            {comercio.whatsapp && (
              <a 
                href={`https://wa.me/52${comercio.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-btn hero-btn-primary"
              >
                💬 Haz tu pedido
              </a>
            )}
            {comercio.phone && (
              <a href={`tel:${comercio.phone}`} className="hero-btn hero-btn-secondary">
                📞 Llamar
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ===== CREADOR / RECOMENDADO POR ===== */}
      <section className="slug-creador-section">
        <div className="slug-creador-container">
          {comercio.creador_id ? (
            /* Creador específico */
            <>
              <Link href={`/profile/${comercio.creador_username}`} className="slug-creador-link">
                {comercio.creador_foto ? (
                  <img 
                    src={comercio.creador_foto} 
                    alt={comercio.creador_nombre || ''} 
                    className="slug-creador-avatar"
                  />
                ) : (
                  <div className="slug-creador-placeholder">
                    {comercio.creador_nombre?.charAt(0) || '?'}
                  </div>
                )}
              </Link>
              <div className="slug-creador-info">
                <span className="slug-recomendado-label">Recomendado por:</span>
                <Link href={`/profile/${comercio.creador_username}`} className="slug-creador-nombre">
                  {comercio.creador_nombre}
                </Link>
                <span className="slug-creador-fecha">
                  {formatDate(comercio.created_at)} · 1 Min. de lectura
                </span>
              </div>
            </>
          ) : (
            /* Turicanje por defecto */
            <>
              <Image 
                src="/icons/logo-turicanje.png" 
                alt="Turicanje" 
                width={48}
                height={48}
                className="slug-creador-avatar turicanje"
              />
              <div className="slug-creador-info">
                <span className="slug-recomendado-label">Recomendado por:</span>
                <Link href="/" className="slug-creador-nombre">Turicanje</Link>
                <span className="slug-creador-fecha">
                  {formatDate(comercio.created_at)} · 1 Min. de lectura
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ===== INSTAGRAM EMBED O GALERÍA ===== */}
      {comercio.instagram_embed ? (
        <section className="instagram-embed-section">
          <div 
            className="instagram-embed-container"
            dangerouslySetInnerHTML={{ __html: comercio.instagram_embed }}
          />
        </section>
      ) : galeriaLugar.length > 0 ? (
        <section className="galeria-destacada-section">
          <div className="galeria-destacada">
            {galeriaLugar.map((img, idx) => (
              <div key={idx} className="galeria-destacada-img">
                <img src={img} alt={`${comercio.name} ${idx + 1}`} />
              </div>
            ))}
          </div>
        </section>
      ) : null}




                  {/* Amenidades */}
      {(comercio.terraza || comercio.estacionamiento || comercio.pet_friendly || 
          comercio.area_infantil || comercio.area_fumar || comercio.acepta_reservaciones || 
          comercio.delivery) && (
          <section className="info-section">
            <div className="section-header">
              <span className="section-icon">✨</span>
              <h2 className="section-title">AMENIDADES</h2>
            </div>
            <div className="amenidades-grid">
              {comercio.terraza && (
                <div className="amenidad-item">
                  <span className="amenidad-icon">🌿</span>
                  <span className="amenidad-label">Terraza</span>
                </div>
              )}
              {comercio.estacionamiento && (
                <div className="amenidad-item">
                  <span className="amenidad-icon">🅿️</span>
                  <span className="amenidad-label">Estacionamiento</span>
                </div>
              )}
              {comercio.pet_friendly && (
                <div className="amenidad-item">
                  <span className="amenidad-icon">🐾</span>
                  <span className="amenidad-label">Pet Friendly</span>
                </div>
              )}
              {comercio.area_infantil && (
                <div className="amenidad-item">
                  <span className="amenidad-icon">👶</span>
                  <span className="amenidad-label">Área Infantil</span>
                </div>
              )}
              {comercio.area_fumar && (
                <div className="amenidad-item">
                  <span className="amenidad-icon">🚬</span>
                  <span className="amenidad-label">Área de Fumar</span>
                </div>
              )}
              {comercio.acepta_reservaciones && (
                <div className="amenidad-item">
                  <span className="amenidad-icon">📅</span>
                  <span className="amenidad-label">Reservaciones</span>
                </div>
              )}
              {comercio.delivery && (
                <div className="amenidad-item">
                  <span className="amenidad-icon">🛵</span>
                  <span className="amenidad-label">Delivery</span>
                </div>
              )}
            </div>
          </section>
      )}

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <main className="comercio-content">

        {/* Descripción */}
        {comercio.descripcion && (
          <div className="descripcion-section">
            <p>{comercio.descripcion}</p>
          </div>
        )}

        {/* Galería del lugar (solo si hay embed, porque si no hay embed ya se mostró arriba) */}
        {comercio.instagram_embed && galeriaLugar.length > 0 && (
          <section className="galeria-section">
            <div className="galeria-grid">
              {galeriaLugar.map((img, idx) => (
                <div key={idx} className="galeria-img">
                  <img src={img} alt={`${comercio.name} ${idx + 1}`} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================== MENÚ CON CARRUSEL ==================== */}
        {galeriaMenu.length > 0 && (
          <section className="info-section menu-section">
            <div className="section-header">
              <span className="section-icon">📋</span>
              <h2 className="section-title">MENÚ</h2>
              <span className="menu-count">{galeriaMenu.length} foto{galeriaMenu.length !== 1 ? 's' : ''}</span>
            </div>
            
            {/* Carrusel horizontal */}
            <div className="menu-carousel">
              <div className="menu-carousel-track">
                {galeriaMenu.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="menu-carousel-item"
                    onClick={() => openLightbox(idx)}
                  >
                    <img src={img} alt={`Menú ${idx + 1}`} />
                    <div className="menu-item-overlay">
                      <span className="zoom-icon">🔍</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="menu-hint">👆 Desliza para ver más · Click para ampliar</p>
          </section>
        )}

        {/* Horario */}
        {comercio.hours && (
          <section className="info-section">
            <div className="section-header">
              <span className="section-icon">🕐</span>
              <h2 className="section-title">HORARIO</h2>
            </div>
            <p className="horario-text">{comercio.hours}</p>
          </section>
        )}

        {/* Ubicación con Mapa */}
        <section className="info-section">
          <div className="section-header">
            <span className="section-icon">📍</span>
            <h2 className="section-title">UBICACIÓN</h2>
          </div>
          <p className="direccion-text">{comercio.address}</p>
          
          {/* Mapa embebido */}
          {comercio.lat && comercio.lng && (
            <div className="mapa-container">
              <iframe
                src={`https://www.google.com/maps?q=${comercio.lat},${comercio.lng}&output=embed`}
                width="100%"
                height="300"
                style={{ border: 0, borderRadius: '8px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          )}

        
          
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="maps-btn">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>Cómo llegar</span>
          </a>
        </section>


      </main>

      {/* ==================== SECCIÓN COMPARTIR Y STATS ==================== */}
      <section className="share-stats-section">
        <div className="share-buttons">
          <a 
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn facebook"
            title="Compartir en Facebook"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          <a 
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn twitter"
            title="Compartir en X"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a 
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn linkedin"
            title="Compartir en LinkedIn"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <button 
            onClick={copiarLink}
            className={`share-btn link ${linkCopiado ? 'copied' : ''}`}
            title={linkCopiado ? '¡Copiado!' : 'Copiar enlace'}
          >
            {linkCopiado ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            )}
          </button>
        </div>
        
        <div className="stats-row">
          <span>{stats.visualizaciones} visualizaciones</span>
          <span>·</span>
          <span>{stats.total_reviews} comentarios</span>
          <span>·</span>
          <span>{totalFavoritos} ❤️</span>
          <button 
            className={`like-btn ${esFavorito ? 'liked' : ''}`} 
            title={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            onClick={handleFavorito}
            disabled={loadingFavorito}
          >
            <svg viewBox="0 0 24 24" fill={esFavorito ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
      </section>

      {/* ==================== SECCIÓN COMENTARIOS ==================== */}
      <section className="reviews-section">
        <div className="reviews-header">
          <h2>Comentarios</h2>
          <div className="reviews-summary">
            <div className="stars-display">
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star} 
                  className={`star ${star <= Math.round(stats.promedio) ? 'filled' : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="reviews-text">
              {stats.promedio > 0 
                ? `${stats.promedio.toFixed(1)} · ${stats.total_reviews} reseñas`
                : 'Aún no hay calificaciones'
              }
            </span>
          </div>
        </div>

        {/* Formulario de review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="form-row">
            <label>Agrega una calificación*</label>
            <div className="stars-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= (hoverRating || newRating) ? 'active' : ''}`}
                  onClick={() => setNewRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <input
            type="text"
            placeholder="Tu nombre*"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            className="review-input"
            maxLength={100}
          />
          
          <textarea
            placeholder="Escribir un comentario..."
            value={newComentario}
            onChange={(e) => setNewComentario(e.target.value)}
            className="review-textarea"
            rows={3}
            maxLength={500}
          />
          
          {reviewError && <p className="review-error">{reviewError}</p>}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel"
              onClick={() => {
                setNewRating(0);
                setNewComentario('');
                setNewNombre('');
                setReviewError('');
              }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-publish"
              disabled={submitting}
            >
              {submitting ? 'Enviando...' : 'Publicar'}
            </button>
          </div>
        </form>

        {/* Lista de reviews */}
        {reviews.length > 0 && (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <div className="review-avatar">
                    {review.user_nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="review-meta">
                    <span className="review-author">
                      {review.user_nombre}
                      {review.verificado && <span className="verified-badge" title="Verificado">✓</span>}
                    </span>
                    <span className="review-date">{formatReviewDate(review.created_at)}</span>
                  </div>
                  <div className="review-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`star-small ${star <= review.calificacion ? 'filled' : ''}`}>★</span>
                    ))}
                  </div>
                </div>
                {review.comentario && (
                  <p className="review-comment">{review.comentario}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==================== LIGHTBOX DEL MENÚ ==================== */}
      {lightboxOpen && galeriaMenu.length > 0 && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>✕</button>
          
          {galeriaMenu.length > 1 && (
            <>
              <button 
                className="lightbox-nav lightbox-prev" 
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
              >
                ‹
              </button>
              <button 
                className="lightbox-nav lightbox-next" 
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
              >
                ›
              </button>
            </>
          )}
          
          <div 
            className="lightbox-content" 
            onClick={(e) => {
              e.stopPropagation();
              const now = Date.now();
              if (now - lastTapRef.current < 300) {
                if (zoomLevel > 1) {
                  setZoomLevel(1);
                  setZoomPosition({ x: 50, y: 50 });
                } else {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setZoomLevel(3);
                  setZoomPosition({ x, y });
                }
              }
              lastTapRef.current = now;
            }}
            onWheel={(e) => {
              e.stopPropagation();
              const delta = e.deltaY > 0 ? -0.5 : 0.5;
              setZoomLevel(prev => Math.min(Math.max(prev + delta, 1), 5));
              if (zoomLevel + delta <= 1) {
                setZoomPosition({ x: 50, y: 50 });
              }
            }}
            onMouseMove={(e) => {
              if (zoomLevel > 1) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setZoomPosition({ x, y });
              }
            }}
            onTouchStart={(e) => {
              if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touchDistRef.current = Math.sqrt(dx * dx + dy * dy);
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 2) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const newDist = Math.sqrt(dx * dx + dy * dy);
                const scale = newDist / touchDistRef.current;
                setZoomLevel(prev => Math.min(Math.max(prev * scale, 1), 5));
                touchDistRef.current = newDist;
              }
            }}
          >
            <img 
              src={galeriaMenu[lightboxIndex]} 
              alt={`Menú ${lightboxIndex + 1}`}
              className="lightbox-image"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                cursor: zoomLevel > 1 ? 'move' : 'zoom-in',
                transition: zoomLevel === 1 ? 'transform 0.3s ease' : 'none',
              }}
              draggable={false}
            />
            {zoomLevel > 1 && (
              <button
                className="zoom-reset-btn"
                onClick={(e) => { e.stopPropagation(); setZoomLevel(1); setZoomPosition({ x: 50, y: 50 }); }}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              >
                🔍 {Math.round(zoomLevel * 100)}% — Tap para resetear
              </button>
            )}
          </div>
          
          {galeriaMenu.length > 1 && (
            <div className="lightbox-counter">
              {lightboxIndex + 1} / {galeriaMenu.length}
            </div>
          )}
          
          {galeriaMenu.length > 1 && (
            <div className="lightbox-thumbnails">
              {galeriaMenu.map((img, idx) => (
                <button
                  key={idx}
                  className={`lightbox-thumb ${idx === lightboxIndex ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); setZoomLevel(1); setZoomPosition({ x: 50, y: 50 }); }}
                >
                  <img src={img} alt={`Miniatura ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== FOOTER ==================== */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={150}
              height={52}
              className="footer-logo"
            />
            <p className="footer-tagline">Compra, Cambia y Viaja</p>
            <div className="footer-contact-info">
              <p>CDMX, México</p>
              <p><a href="mailto:contacto@turicanje.com">contacto@turicanje.com</a></p>
              <p>55 7679 4313</p>
            </div>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h4>Negocios</h4>
              <Link href="/afiliar-negocio">Afiliar mi negocio</Link>
              <Link href="/login">Acceso comercios</Link>
              <Link href="/terminos-comercio">Términos comercio</Link>
            </div>
            
            <div className="footer-column">
              <h4>Usuarios</h4>
              <Link href="/registro-usuario">Crear cuenta</Link>
              <Link href="/login">Iniciar sesión</Link>
              <Link href="/terminos-usuarios">Términos usuarios</Link>
            </div>
            
            <div className="footer-column">
              <h4>Empresa</h4>
              <Link href="/nosotros">Nosotros</Link>
              <Link href="/contacto">Contacto</Link>
              <Link href="/faq">Preguntas frecuentes</Link>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Turicanje S.A.S. de C.V. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}