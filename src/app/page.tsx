'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import './landing.css';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

    // Cerrar menú de usuario al hacer click afuera
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

  // Función para scroll suave a una sección
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMenuOpen(false);
  };

  return (
    <div className="landing-container">
      {/* ==================== HEADER ==================== */}
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
            <Link href="/" className="landing-nav-link landing-nav-link-active">INICIO</Link>
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
            
            <Link href="/contacto" className="landing-nav-link">CONTACTO</Link>
          </nav>

          {/* Botón de usuario / login */}
          {usuario ? (
            // Usuario logueado - mostrar menú
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
            // No logueado - mostrar botón de login
            <Link href="/login-usuario" className="login-btn">
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
            <Link href="/contacto" className="landing-nav-link-mobile">Contacto</Link>
            {usuario ? (
              <button onClick={cerrarSesion} className="landing-nav-link-mobile logout-mobile">
                🚪 Cerrar sesión
              </button>
            ) : (
              <Link href="/login-usuario" className="landing-nav-link-mobile login-mobile">Iniciar sesión</Link>
            )}
          </nav>
        )}
      </header>

      {/* ==================== HERO SECTION ==================== */}
      <section className="hero-section">
        <div className="hero-background">
          <Image
            src="/images/principall.jpeg"
            alt="Emprendedora con tablet en su negocio"
            fill
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'left center' }}
            priority
          />
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            El programa de lealtad <br />
            para restaurantes y comensales
          </h1>
          <p className="hero-subtitle">
            Conectamos negocios con clientes<br />
            que regresan una y otra vez.
          </p>
          <div className="hero-buttons">
            <button 
              onClick={() => scrollToSection('seccion-negocios')} 
              className="hero-btn hero-btn-primary"
            >
              SOY NEGOCIO
            </button>
            <button 
              onClick={() => scrollToSection('seccion-usuarios')} 
              className="hero-btn hero-btn-secondary"
            >
              SOY USUARIO
            </button>
          </div>
        </div>
      </section>

      {/* ==================== SECCIÓN DUAL ==================== */}
      <section className="dual-section">
        {/* Para Negocios */}
        <div id="seccion-negocios" className="dual-card dual-card-negocios">
          <div className="dual-card-content">
            <span className="dual-badge">Para Negocios</span>
            <h2 className="dual-title">Haz crecer tu negocio</h2>
            <ul className="dual-benefits">
              <li>
                <span className="benefit-icon">📍</span>
                <div>
                  <strong>Más visibilidad</strong>
                  <p>Aparece primero cuando buscan dónde comer cerca</p>
                </div>
              </li>
              <li>
                <span className="benefit-icon">🔄</span>
                <div>
                  <strong>Clientes que regresan</strong>
                  <p>El cashback los motiva a volver a tu negocio</p>
                </div>
              </li>
              <li>
                <span className="benefit-icon">💰</span>
                <div>
                  <strong>Sin comisiones por venta</strong>
                  <p>Sin letras chicas</p>
                </div>
              </li>
            </ul>
            <Link href="/afiliar-negocio" className="dual-cta dual-cta-negocio">
              AFILIAR MI NEGOCIO
            </Link>
          </div>
          <div className="dual-card-image">
            <Image
              src="/images/mujer.jpeg"
              alt="Dueño de negocio feliz"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Para Usuarios */}
        <div className="dual-card dual-card-usuarios">
          <div className="dual-card-image">
            <Image
              src="/images/app-usuarios.jpeg"
              alt="Usuario usando la app"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div id="seccion-usuarios" className="dual-card-content">
            <span className="dual-badge dual-badge-usuario">Para Usuarios</span>
            <h2 className="dual-title">Gana mientras disfrutas</h2>
            <ul className="dual-benefits">
              <li>
                <span className="benefit-icon">💎</span>
                <div>
                  <strong>Cashback en cada compra</strong>
                  <p>Acumula puntos que valen dinero real</p>
                </div>
              </li>
              <li>
                <span className="benefit-icon">🍽️</span>
                <div>
                  <strong>Descubre nuevos lugares</strong>
                  <p>Restaurantes, cafés y más cerca de ti</p>
                </div>
              </li>
              <li>
                <span className="benefit-icon">🎁</span>
                <div>
                  <strong>Beneficios exclusivos</strong>
                  <p>Canjea puntos acumulados por viajes y experiencias</p>
                </div>
              </li>
            </ul>
            <Link href="/registrarse" className="dual-cta dual-cta-usuario">
              CREAR MI CUENTA GRATIS
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== CÓMO FUNCIONA ==================== */}
      <section className="como-funciona-section">
        <h2 className="section-title">¿Cómo funciona?</h2>
        <p className="section-subtitle">Simple para todos, beneficios para ambos</p>
        
        <div className="pasos-grid">
          <div className="paso-card">
            <div className="paso-numero">1</div>
            <h3 className="paso-title">Regístrate</h3>
            <p className="paso-description">
              <strong>Negocios:</strong> Afilia tu restaurante en minutos<br />
              <strong>Usuarios:</strong> Crea tu cuenta gratis
            </p>
          </div>
          
          <div className="paso-card">
            <div className="paso-numero">2</div>
            <h3 className="paso-title">Conecta</h3>
            <p className="paso-description">
              <strong>Negocios:</strong> Recibe clientes de la app<br />
              <strong>Usuarios:</strong> Encuentra dónde comer
            </p>
          </div>
          
          <div className="paso-card">
            <div className="paso-numero">3</div>
            <h3 className="paso-title">Gana</h3>
            <p className="paso-description">
              <strong>Negocios:</strong> Clientes leales que regresan<br />
              <strong>Usuarios:</strong> Cashback en cada compra
            </p>
          </div>
        </div>
      </section>

      {/* ==================== NÚMEROS / STATS ==================== */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">10%</span>
            <span className="stat-label">Cashback promedio</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">$1 = 1pt</span>
            <span className="stat-label">Puntos que valen dinero</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">0%</span>
            <span className="stat-label">Comisión primer año</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">12</span>
            <span className="stat-label">Meses de vigencia</span>
          </div>
        </div>
      </section>

      {/* ==================== CTA FINAL ==================== */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">¿Listo para comenzar?</h2>
          <p className="cta-subtitle">
            Únete a la comunidad de negocios y usuarios que ya disfrutan Turicanje
          </p>
          <div className="cta-buttons">
            <Link href="/afiliar-negocio" className="cta-button-primary">
              SOY NEGOCIO
            </Link>
            <Link href="/registrarse" className="cta-button-secondary">
              SOY USUARIO
            </Link>
          </div>
        </div>
      </section>

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
              <Link href="/login-usuario">Iniciar sesión</Link>
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