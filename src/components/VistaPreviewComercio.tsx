'use client';

import Link from 'next/link';
import Image from 'next/image';
import './vista-preview-comercio.css';

interface Negocio {
  id: string;
  name: string;
  category: string;
  descripcion?: string;
  address: string;
  neighborhood?: string;
  city?: string;
  phone?: string;
  whatsapp?: string;
  hours?: string | { horario_texto?: string };
  lat?: number;
  lng?: number;
  imagen_url?: string;
  galeria_lugar?: string[];
  galeria_menu?: string[];
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  x_twitter?: string;
  youtube?: string;
  calificacion_promedio?: number;
  total_reviews?: number;
  cashback_porcentaje?: number;
  created_at?: string;
  creador_id?: number;
  creador_username?: string;
  creador_nombre?: string;
  creador_titulo?: string;
  creador_foto?: string;
}

interface Props {
  negocio: Negocio;
}

export default function VistaPreviewComercio({ negocio }: Props) {
  // Imagen del hero
  const imagenHero = negocio.imagen_url || negocio.galeria_lugar?.[0] || '/images/placeholder-comercio.jpg';
  
  // Galerías
  const galeriaLugar = negocio.galeria_lugar?.filter(Boolean) || [];
  const galeriaMenu = negocio.galeria_menu?.filter(Boolean) || [];

  // Formatear fecha
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  // URL de Google Maps
  const googleMapsUrl = negocio.lat && negocio.lng
    ? `https://maps.app.goo.gl/?q=${negocio.lat},${negocio.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.address)}`;

  // Formatear horario
  const formatHorario = () => {
    if (!negocio.hours) return null;
    if (typeof negocio.hours === 'object') {
      return negocio.hours.horario_texto || JSON.stringify(negocio.hours);
    }
    return negocio.hours;
  };

  return (
    <div className="preview-wrapper">
      {/* ===== BANNER DE PREVIEW ===== */}
      <div className="preview-banner">
        <span className="preview-banner-icon">👁️</span>
        <span>Vista previa — Así se verá tu página en <strong>/blog/{negocio.id}</strong></span>
      </div>

      {/* ==================== HERO SECTION ==================== */}
      <section className="hero-section">
        <div className="hero-background">
          <img src={imagenHero} alt={negocio.name} />
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          {/* Badge categoría */}
          <span className="hero-badge">{negocio.category}</span>
          
          {/* Título */}
          <h1 className="hero-title">{negocio.name}</h1>
          
          {/* Rating */}
          <div className="hero-rating">
            <div className="stars-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star} 
                  className={`star ${star <= Math.round(Number(negocio.calificacion_promedio || 0)) ? 'filled' : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="rating-text">
              {negocio.calificacion_promedio ? Number(negocio.calificacion_promedio).toFixed(1) : '—'} 
              ({negocio.total_reviews || 0} reseñas)
            </span>
          </div>
          
          {/* Ubicación */}
          <p className="hero-location">
            📍 {negocio.neighborhood || 'Colonia'}, {negocio.city || 'CDMX'}
          </p>

          {/* Redes Sociales */}
          {(negocio.instagram || negocio.facebook || negocio.tiktok || negocio.x_twitter || negocio.youtube) && (
            <div className="hero-social">
              {negocio.instagram && (
                <a 
                  href={negocio.instagram.startsWith('http') ? negocio.instagram : `https://instagram.com/${negocio.instagram.replace('@', '')}`}
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
              {negocio.facebook && (
                <a 
                  href={negocio.facebook.startsWith('http') ? negocio.facebook : `https://facebook.com/${negocio.facebook}`}
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
              {negocio.tiktok && (
                <a 
                  href={negocio.tiktok.startsWith('http') ? negocio.tiktok : `https://tiktok.com/@${negocio.tiktok.replace('@', '')}`}
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
              {negocio.x_twitter && (
                <a 
                  href={negocio.x_twitter.startsWith('http') ? negocio.x_twitter : `https://x.com/${negocio.x_twitter.replace('@', '')}`}
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
              {negocio.youtube && (
                <a 
                  href={negocio.youtube.startsWith('http') ? negocio.youtube : `https://youtube.com/${negocio.youtube}`}
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
            {negocio.whatsapp && (
              <a 
                href={`https://wa.me/52${negocio.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-btn hero-btn-primary"
              >
                💬 Haz tu pedido
              </a>
            )}
            {negocio.phone && (
              <a href={`tel:${negocio.phone}`} className="hero-btn hero-btn-secondary">
                📞 Llamar
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ===== CREADOR / RECOMENDADO POR ===== */}
      <section className="slug-creador-section">
        <div className="slug-creador-container">
          {negocio.creador_id ? (
            /* Creador específico */
            <>
              <Link href={`/profile/${negocio.creador_username}`} className="slug-creador-link">
                {negocio.creador_foto ? (
                  <img 
                    src={negocio.creador_foto} 
                    alt={negocio.creador_nombre || ''} 
                    className="slug-creador-avatar"
                  />
                ) : (
                  <div className="slug-creador-placeholder">
                    {negocio.creador_nombre?.charAt(0) || '?'}
                  </div>
                )}
              </Link>
              <div className="slug-creador-info">
                <Link href={`/profile/${negocio.creador_username}`} className="slug-creador-nombre">
                  {negocio.creador_nombre}
                </Link>
                <span className="slug-creador-fecha">
                  {formatDate(negocio.created_at)} · 1 Min. de lectura
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
                <Link href="/" className="slug-creador-nombre">Turicanje</Link>
                <span className="slug-creador-fecha">
                  {formatDate(negocio.created_at)} · 1 Min. de lectura
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ===== GALERÍA DESTACADA ===== */}
      {galeriaLugar.length > 0 && (
        <section className="galeria-destacada-section">
          <div className="galeria-destacada">
            {galeriaLugar.map((img, idx) => (
              <div key={idx} className="galeria-destacada-img">
                <img src={img} alt={`${negocio.name} ${idx + 1}`} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <main className="comercio-content">

        {/* Descripción */}
        {negocio.descripcion && (
          <div className="descripcion-section">
            <p>{negocio.descripcion}</p>
          </div>
        )}

        {/* Menú */}
        {galeriaMenu.length > 0 && (
          <section className="info-section">
            <div className="section-header">
              <span className="section-icon">📋</span>
              <h2 className="section-title">MENÚ</h2>
            </div>
            <div className="menu-grid">
              {galeriaMenu.map((img, idx) => (
                <div key={idx} className="menu-img">
                  <img src={img} alt={`Menú ${idx + 1}`} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Horario */}
        {negocio.hours && (
          <section className="info-section">
            <div className="section-header">
              <span className="section-icon">🕐</span>
              <h2 className="section-title">HORARIO</h2>
            </div>
            <p className="horario-text">{formatHorario()}</p>
          </section>
        )}

        {/* Ubicación con Mapa */}
        <section className="info-section">
          <div className="section-header">
            <span className="section-icon">📍</span>
            <h2 className="section-title">UBICACIÓN</h2>
          </div>
          <p className="direccion-text">{negocio.address}</p>
          
          {/* Mapa embebido */}
          {negocio.lat && negocio.lng && (
            <div className="mapa-container">
              <iframe
                src={`https://www.google.com/maps?q=${negocio.lat},${negocio.lng}&output=embed`}
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

        {/* Cashback */}
        {negocio.cashback_porcentaje && negocio.cashback_porcentaje > 0 && (
          <section className="cashback-section">
            <div className="cashback-card">
              <span className="cashback-icon">🎁</span>
              <div className="cashback-info">
                <span className="cashback-porcentaje">{negocio.cashback_porcentaje}% Cashback</span>
                <span className="cashback-text">Acumula puntos con cada compra</span>
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}