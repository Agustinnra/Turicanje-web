'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import '../landing.css';
import './resenas.css';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

// Testimonios de Negocios Afiliados
const testimoniosNegocios = [
  {
    id: 1,
    negocio: "La Cochi Birria del Barrio",
    propietario: "Roberto Mendoza",
    cargo: "Propietario",
    categoria: "Puesto Fijo",
    zona: "Del Valle",
    testimonio: "Desde que nos unimos a Turicanje, nuestras ventas entre semana subieron un 35%. Los clientes regresan por los puntos y terminan trayendo amigos. Es el mejor marketing que hemos tenido.",
    rating: 5,
    fechaAfiliacion: "Agosto 2025"
  },
  {
    id: 2,
    negocio: "Café Puñal",
    propietario: "Diana Estrada",
    cargo: "Fundadora",
    categoria: "Cafetería",
    zona: "Doctores",
    testimonio: "El bot de WhatsApp nos trae clientes nuevos todos los días. Alguien escribe 'café cerca' y aparecemos. Sencillo pero efectivo. Ya no dependemos solo de Instagram.",
    rating: 5,
    fechaAfiliacion: "Septiembre 2025"
  },
  {
    id: 3,
    negocio: "Santo Suadero",
    propietario: "Miguel Ángel Torres",
    cargo: "Chef y Propietario",
    categoria: "Restaurante",
    zona: "Del Valle Centro",
    testimonio: "Mis clientes ahora piden su QR antes de pagar. El sistema de puntos los tiene enganchados. He visto caras nuevas que llegaron por el bot buscando 'tacos de suadero'.",
    rating: 5,
    fechaAfiliacion: "Julio 2025"
  },
  {
    id: 4,
    negocio: "Fandango Café",
    propietario: "Lucía Ramírez",
    cargo: "Gerente General",
    categoria: "Cafetería",
    zona: "Portales",
    testimonio: "Lo que más me gusta es que no cobran comisión por venta como las apps de delivery. Pago mi suscripción y listo. Los puntos los defino yo.",
    rating: 5,
    fechaAfiliacion: "Octubre 2025"
  },
  {
    id: 5,
    negocio: "Titanes del Mar",
    propietario: "Jorge Vázquez",
    cargo: "Propietario",
    categoria: "Mariscos",
    zona: "Narvarte",
    testimonio: "Pensé que era solo para cafés hipster, pero funciona perfecto para marisquería. Los domingos llegan familias completas que nos encontraron en el bot.",
    rating: 5,
    fechaAfiliacion: "Noviembre 2025"
  },
  {
    id: 6,
    negocio: "Handrollers",
    propietario: "Kenji Nakamura",
    cargo: "Director",
    categoria: "Restaurante",
    zona: "Roma Norte",
    testimonio: "El dashboard es muy completo. Veo exactamente cuántos puntos di, quién los canjeó, todo. Me ayuda a entender mejor a mis clientes.",
    rating: 5,
    fechaAfiliacion: "Agosto 2025"
  }
];

// Testimonios de Usuarios
const testimoniosUsuarios = [
  {
    id: 1,
    nombre: "Mariana González",
    ocupacion: "Diseñadora UX",
    zona: "Narvarte",
    testimonio: "Le escribo al bot '¿qué se te antoja?' y me manda opciones con cashback cerca de mi oficina. Ya junté como 200 pesos en puntos sin darme cuenta.",
    rating: 5,
    puntosAcumulados: "487 puntos"
  },
  {
    id: 2,
    nombre: "Carlos Hernández",
    ocupacion: "Contador",
    zona: "Del Valle",
    testimonio: "Lo uso principalmente para encontrar dónde desayunar. El bot entiende cuando le pongo 'huevos rancheros' o 'algo rápido'. Siempre atina.",
    rating: 5,
    puntosAcumulados: "312 puntos"
  },
  {
    id: 3,
    nombre: "Sofía Martínez",
    ocupacion: "Arquitecta",
    zona: "Roma Sur",
    testimonio: "Me encanta que puedo ver los menús y el cashback antes de ir. Ya no llego a lugares caros sin saber. Y los puntos son dinero real.",
    rating: 5,
    puntosAcumulados: "623 puntos"
  },
  {
    id: 4,
    nombre: "Andrés Ruiz",
    ocupacion: "Desarrollador",
    zona: "Portales",
    testimonio: "El QR de usuario es genial. Llego, pago, escanean mi código y listo. Sin apps pesadas ni registro en cada lugar.",
    rating: 5,
    puntosAcumulados: "891 puntos"
  },
  {
    id: 5,
    nombre: "Valentina López",
    ocupacion: "Maestra",
    zona: "Benito Juárez",
    testimonio: "Mis amigas y yo hacemos 'ruta de cafés' los sábados. Buscamos en el bot y vamos a los que tienen mejor cashback. Ya es tradición.",
    rating: 5,
    puntosAcumulados: "445 puntos"
  },
  {
    id: 6,
    nombre: "Ricardo Peña",
    ocupacion: "Vendedor",
    zona: "Doctores",
    testimonio: "Como mucho en la calle por mi trabajo. El bot me salva cuando no sé qué comer. Le pongo mi ubicación y me recomienda lo mejor cerca.",
    rating: 5,
    puntosAcumulados: "1,204 puntos"
  }
];

// Estadísticas
const estadisticas = [
  { numero: "150+", label: "Negocios afiliados" },
  { numero: "5,000+", label: "Usuarios activos" },
  { numero: "50,000+", label: "Puntos canjeados" },
  { numero: "4.9", label: "Calificación promedio" }
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="star-rating">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < rating ? 'star filled' : 'star'}>★</span>
      ))}
    </div>
  );
}

export default function ResenasPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('usuario_data');
    if (userData) {
      try {
        setUsuario(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data');
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('usuario_token');
    localStorage.removeItem('usuario_data');
    setUsuario(null);
    setUserMenuOpen(false);
  };

  return (
    <div className="landing-container">
      {/* ==================== HEADER (igual que landing) ==================== */}
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
            <Link href="/" className="landing-nav-link">INICIO</Link>
            <Link href="/blog" className="landing-nav-link">RESTAURANTES</Link>
            
            <div 
              className="nav-item-dropdown"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="landing-nav-link">
                SERVICIOS <span className="dropdown-arrow">▼</span>
              </button>
              {dropdownOpen && (
                <div className="landing-dropdown-menu">
                  <Link href="/afiliar-negocio" className="landing-dropdown-item">
                    🏪 Registrar mi negocio
                  </Link>
                  <Link href="/registrarse" className="landing-dropdown-item">
                    👤 Crear cuenta de usuario
                  </Link>
                  <Link href="/faq" className="landing-dropdown-item">
                    ❓ Preguntas frecuentes
                  </Link>
                </div>
              )}
            </div>
            
            <Link href="/resenas" className="landing-nav-link landing-nav-link-active">RESEÑAS</Link>
            <Link href="/contacto" className="landing-nav-link">CONTACTO</Link>
          </nav>

          {/* Botón de usuario / login */}
          {usuario ? (
            <div className="user-menu-container" ref={userMenuRef}>
              <button 
                className="user-menu-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <span className="user-avatar-small">
                  {usuario.nombre?.charAt(0).toUpperCase() || '?'}
                </span>
                <span className="user-name-header">{usuario.nombre?.split(' ')[0]}</span>
                <span className={`user-arrow ${userMenuOpen ? 'open' : ''}`}>▼</span>
              </button>

              {userMenuOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <span className="dropdown-user-name" style={{color: '#333'}}>{usuario.nombre}</span>
                    <span className="dropdown-user-email" style={{color: '#666'}}>{usuario.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link href="/mi-cuenta" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <span>👤</span> <span style={{color: '#333'}}>Mi cuenta</span>
                  </Link>
                  <Link href="/blog" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <span>🍽️</span> <span style={{color: '#333'}}>Explorar restaurantes</span>
                  </Link>
                  <Link href="/creadores" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <span>👥</span> <span style={{color: '#333'}}>Ver creadores</span>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="user-dropdown-item logout-item" onClick={cerrarSesion}>
                    <span>🚪</span> <span style={{color: '#c62828'}}>Cerrar sesión</span>
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
            <Link href="/" className="landing-nav-link-mobile">Inicio</Link>
            <Link href="/blog" className="landing-nav-link-mobile">🍽️ Restaurantes</Link>
            {usuario && (
              <>
                <Link href="/mi-cuenta" className="landing-nav-link-mobile">👤 Mi cuenta</Link>
                <Link href="/mi-cuenta?tab=favoritos" className="landing-nav-link-mobile">❤️ Mis favoritos</Link>
              </>
            )}
            <Link href="/afiliar-negocio" className="landing-nav-link-mobile sub-item">🏪 Registrar mi negocio</Link>
            <Link href="/registrarse" className="landing-nav-link-mobile sub-item">👤 Crear cuenta</Link>
            <Link href="/resenas" className="landing-nav-link-mobile">⭐ Reseñas</Link>
            <Link href="/contacto" className="landing-nav-link-mobile">Contacto</Link>
            {usuario ? (
              <button onClick={cerrarSesion} className="landing-nav-link-mobile logout-mobile">
                🚪 Cerrar sesión
              </button>
            ) : (
              <Link href="/login" className="landing-nav-link-mobile login-mobile">Iniciar sesión</Link>
            )}
          </nav>
        )}
      </header>

      {/* ==================== HERO ==================== */}
      <section className="resenas-hero">
        <div className="hero-content">
          <h1>Lo que dicen de <span className="highlight">Turicanje</span></h1>
          <p className="hero-subtitle">
            Negocios y usuarios comparten su experiencia con nuestra plataforma
          </p>
        </div>
        <div className="hero-decoration"></div>
      </section>

      {/* ==================== ESTADÍSTICAS ==================== */}
      <section className="estadisticas-section">
        <div className="estadisticas-grid">
          {estadisticas.map((stat, index) => (
            <div key={index} className="estadistica-card">
              <span className="stat-numero">{stat.numero}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== TESTIMONIOS NEGOCIOS ==================== */}
      <section className="testimonios-section negocios-section">
        <div className="section-header">
          <span className="section-tag">🏪 Negocios Afiliados</span>
          <h2>Restaurantes y cafés que confían en nosotros</h2>
          <p>Más de 150 negocios en CDMX ya usan Turicanje para fidelizar clientes</p>
        </div>
        
        <div className="testimonios-grid">
          {testimoniosNegocios.map((testimonio) => (
            <article key={testimonio.id} className="testimonio-card negocio-card">
              <div className="card-header">
                <div className="negocio-avatar">
                  <span className="avatar-emoji">🍽️</span>
                </div>
                <div className="negocio-info">
                  <h3>{testimonio.negocio}</h3>
                  <span className="negocio-meta">{testimonio.categoria} • {testimonio.zona}</span>
                </div>
              </div>
              
              <blockquote className="testimonio-texto">
                &ldquo;{testimonio.testimonio}&rdquo;
              </blockquote>
              
              <div className="card-footer">
                <div className="autor-info">
                  <span className="autor-nombre">{testimonio.propietario}</span>
                  <span className="autor-cargo">{testimonio.cargo}</span>
                </div>
                <div className="rating-fecha">
                  <StarRating rating={testimonio.rating} />
                  <span className="fecha">Desde {testimonio.fechaAfiliacion}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ==================== CTA NEGOCIOS ==================== */}
      <section className="cta-section-resenas cta-negocios">
        <div className="cta-content">
          <h3>¿Tienes un restaurante o café?</h3>
          <p>Únete a los negocios que ya están fidelizando clientes con Turicanje</p>
          <Link href="/afiliar-negocio" className="cta-button-primary">
            Afiliar mi Negocio →
          </Link>
        </div>
      </section>

      {/* ==================== TESTIMONIOS USUARIOS ==================== */}
      <section className="testimonios-section usuarios-section">
        <div className="section-header">
          <span className="section-tag">👥 Usuarios</span>
          <h2>Comensales que ya acumulan puntos</h2>
          <p>Miles de personas descubren restaurantes y ganan cashback cada día</p>
        </div>
        
        <div className="testimonios-grid">
          {testimoniosUsuarios.map((testimonio) => (
            <article key={testimonio.id} className="testimonio-card usuario-card">
              <div className="card-header">
                <div className="usuario-avatar">
                  <span className="avatar-inicial">
                    {testimonio.nombre.charAt(0)}
                  </span>
                </div>
                <div className="usuario-info">
                  <h3>{testimonio.nombre}</h3>
                  <span className="usuario-meta">{testimonio.ocupacion} • {testimonio.zona}</span>
                </div>
              </div>
              
              <blockquote className="testimonio-texto">
                &ldquo;{testimonio.testimonio}&rdquo;
              </blockquote>
              
              <div className="card-footer">
                <div className="puntos-badge">
                  <span className="puntos-icon">🎯</span>
                  <span className="puntos-cantidad">{testimonio.puntosAcumulados}</span>
                </div>
                <StarRating rating={testimonio.rating} />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ==================== CTA USUARIOS ==================== */}
      <section className="cta-section-resenas cta-usuarios">
        <div className="cta-content">
          <h3>¿Listo para empezar a acumular puntos?</h3>
          <p>Regístrate gratis y descubre los mejores lugares para comer en CDMX</p>
          <div className="cta-buttons">
            <Link href="/registrarse" className="cta-button-primary">
              Crear mi Cuenta
            </Link>
            <a 
              href="https://wa.me/525522545216?text=Hola" 
              target="_blank" 
              rel="noopener noreferrer"
              className="cta-button-secondary"
            >
              💬 Probar el Bot
            </a>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER (igual que landing) ==================== */}
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
              <Link href="/registrarse">Crear cuenta</Link>
              <Link href="/login">Iniciar sesión</Link>
              <Link href="/terminos-usuarios">Términos usuarios</Link>
            </div>

            <div className="footer-column">
              <h4>Nosotros</h4>
              <Link href="/resenas">Reseñas</Link>
              <Link href="/contacto">Contacto</Link>
            </div>
            
            <div className="footer-column">
              <h4>Legal</h4>
              <Link href="/privacidad">Aviso de Privacidad</Link>
              <Link href="/terminos-usuarios">Términos y Condiciones</Link>
              <Link href="/faq">Preguntas frecuentes</Link>
            </div>

            <div className="footer-social">
              <h4>Síguenos</h4>
              <div className="social-links">
                <a 
                  href="https://www.instagram.com/turicanje.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link instagram"
                  aria-label="Instagram"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.facebook.com/share/1GTiMge7gD/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link facebook"
                  aria-label="Facebook"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                </a>
                <a 
                  href="https://youtube.com/@turicanjeapp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-link youtube"
                  aria-label="YouTube"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </a>
              </div>
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
