'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './nosotros.css';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

export default function NosotrosPage() {
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
    <div className="nosotros-container">
      {/* Header */}
      <header className="nosotros-header">
        <div className="header-container">
          <Link href="/" className="header-logo">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={140}
              height={50}
              style={{ objectFit: 'contain', height: 'auto' }}
              priority
            />
          </Link>

          <nav className="header-nav">
            <Link href="/" className="nav-link">Inicio</Link>
            <Link href="/nosotros" className="nav-link active">Nosotros</Link>
            <Link href="/contacto" className="nav-link">Contacto</Link>
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
            <Link href="/login-usuario" className="btn-login">
              👤 Iniciar sesión
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="nosotros-hero">
        <div className="hero-content">
          <h1 className="nosotros-title">Nosotros</h1>
          <p className="nosotros-subtitle">
            Conectamos a los amantes de la comida con los mejores restaurantes de la Ciudad de México
          </p>
        </div>
      </section>

      {/* Main */}
      <main className="nosotros-main">
        <div className="nosotros-content">
          
          {/* Historia con imagen */}
          <section className="nosotros-historia">
            <div className="historia-content">
              <div className="historia-texto">
                <h2><span className="section-icon">📖</span> Nuestra Historia</h2>
                <p>
                  Turicanje nació en 2024 de una idea simple: <strong>¿por qué no recompensar a las personas 
                  por hacer lo que más les gusta, comer y viajar bien?</strong>
                </p>
                <p>
                  Fundada en la Ciudad de México, comenzamos conectando a amantes de la comida con 
                  restaurantes locales a través de nuestro bot de WhatsApp. Lo que empezó como un 
                  proyecto pequeño, rápidamente creció gracias al apoyo de la comunidad foodie.
                </p>
                <p>
                  Hoy, Turicanje es la plataforma líder de descubrimiento gastronómico y recompensas 
                  en CDMX, trabajando con cientos de restaurantes y creadores de contenido que comparten 
                  nuestra pasión por la buena comida.
                </p>
                
                <div className="historia-logros">
                  <div className="logro-item">
                    <span className="logro-icon">🏆</span>
                    <span>Lanzamiento 2024</span>
                  </div>
                  <div className="logro-item">
                    <span className="logro-icon">🚀</span>
                    <span>500+ restaurantes aliados</span>
                  </div>
                  <div className="logro-item">
                    <span className="logro-icon">💜</span>
                    <span>Comunidad de 10K+ foodies</span>
                  </div>
                </div>
              </div>
              
              <div className="historia-imagen">
                <img 
                  src="/images/linea-tiempo.avif"
                  alt="Historia Turicanje"
                  style={{ 
                    width: '100%', 
                    height: 'auto',
                    objectFit: 'cover', 
                    borderRadius: '20px' 
                  }}
                />
                <div className="imagen-caption">
                  Conectando sabores con experiencias 🍽️
                </div>
              </div>
            </div>
          </section>

          {/* Misión */}
          <section className="nosotros-section">
            <h2><span className="section-icon">🎯</span> Nuestra Misión</h2>
            <p>
              En Turicanje creemos que descubrir nuevos lugares para comer debería ser una experiencia 
              emocionante y gratificante. Por eso creamos una plataforma que conecta a los comensales 
              con los mejores restaurantes de la ciudad, mientras los recompensa por cada visita.
            </p>
            <p>
              Nuestro sistema de puntos y cashback te permite ahorrar mientras disfrutas de la 
              gastronomía mexicana. Ya sea que busques ese taco callejero perfecto o una experiencia 
              de fine dining, Turicanje te ayuda a encontrarlo.
            </p>
          </section>

          {/* Valores */}
          <section className="nosotros-section">
            <h2><span className="section-icon">💜</span> Nuestros Valores</h2>
            <div className="valores-grid">
              <div className="valor-card">
                <span className="valor-icon">🤝</span>
                <h3>Comunidad</h3>
                <p>Creamos conexiones entre comensales, creadores de contenido y restaurantes locales.</p>
              </div>
              <div className="valor-card">
                <span className="valor-icon">⭐</span>
                <h3>Calidad</h3>
                <p>Solo trabajamos con restaurantes que cumplen nuestros estándares de excelencia.</p>
              </div>
              <div className="valor-card">
                <span className="valor-icon">🎁</span>
                <h3>Recompensas</h3>
                <p>Cada visita cuenta. Acumula puntos y canjéalos por descuentos increíbles.</p>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="nosotros-section">
            <h2><span className="section-icon">📊</span> Turicanje en Números</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">500+</span>
                <span className="stat-label">Restaurantes</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Usuarios</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">Creadores</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">$1M+</span>
                <span className="stat-label">En recompensas</span>
              </div>
            </div>
          </section>

          {/* Cómo funciona */}
          <section className="nosotros-section">
            <h2><span className="section-icon">⚡</span> ¿Cómo Funciona?</h2>
            <p>
              <strong>1. Regístrate gratis</strong> - Crea tu cuenta y obtén tu código QR único.
            </p>
            <p>
              <strong>2. Descubre restaurantes</strong> - Explora nuestra selección curada de los mejores 
              lugares para comer en CDMX, con recomendaciones de creadores de contenido.
            </p>
            <p>
              <strong>3. Visita y acumula</strong> - Muestra tu QR al pagar y acumula puntos 
              automáticamente. Entre más visitas, más ganas.
            </p>
            <p>
              <strong>4. Canjea recompensas</strong> - Usa tus puntos para obtener descuentos, 
              platillos gratis y experiencias exclusivas.
            </p>
          </section>

          {/* CTA */}
          <div className="nosotros-cta">
            <h2>¿Listo para empezar?</h2>
            <p>Únete a miles de comensales que ya disfrutan de recompensas en cada visita.</p>
            <div className="cta-buttons">
              <Link href="/registrarse" className="btn-cta-primary">
                🚀 Crear cuenta gratis
              </Link>
              <Link href="/blog" className="btn-cta-secondary">
                🍽️ Ver restaurantes
              </Link>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="nosotros-footer">
        <div className="footer-content">
          <Link href="/" className="footer-logo">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={120}
              height={40}
              style={{ objectFit: 'contain', height: 'auto' }}
            />
          </Link>
          <p>© {new Date().getFullYear()} Turicanje. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}