'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import './suscripcion.css';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  suscripcion_activa: boolean;
  fecha_vencimiento?: string;
}

export default function SuscripcionPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('usuario_data');
    if (!userData) {
      router.push('/login-usuario');
      return;
    }
    setUsuario(JSON.parse(userData));
    setLoading(false);

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [router]);

  const cerrarSesion = () => {
    localStorage.removeItem('usuario_token');
    localStorage.removeItem('usuario_data');
    setUsuario(null);
    setUserMenuOpen(false);
    router.push('/');
  };

  const handleSuscribirse = async (plan: string) => {
    setProcesando(true);
    // TODO: Integrar con Stripe/Conekta
    window.location.href = `/checkout?plan=${plan}`;
  };

  if (loading) {
    return (
      <div className="suscripcion-loading">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="suscripcion-container">
      {/* Header Unificado */}
      <header className="suscripcion-header">
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
            <Link href="/nosotros" className="nav-link">Nosotros</Link>
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
      <section className="suscripcion-hero">
        <div className="hero-content">
          <h1>Hazte Premium</h1>
          <p>Acumula puntos, obtén recompensas y disfruta de beneficios exclusivos</p>
        </div>
      </section>

      {/* Planes */}
      <main className="suscripcion-main">
        <div className="planes-grid">
          
          {/* Plan Gratuito */}
          <div className="plan-card">
            <div className="plan-header">
              <h2>Gratuito</h2>
              <div className="plan-precio">
                <span className="precio">$0</span>
                <span className="periodo">siempre</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>✓ Descubre restaurantes</li>
              <li>✓ Guarda favoritos</li>
              <li>✓ Sigue creadores</li>
              <li className="disabled">✗ Acumula puntos</li>
              <li className="disabled">✗ Canjea recompensas</li>
              <li className="disabled">✗ Descuentos exclusivos</li>
              <li className="disabled">✗ Beneficios de cumpleaños</li>
            </ul>
            <button className="btn-plan current" disabled>
              Plan actual
            </button>
          </div>

          {/* Plan Anual - Destacado */}
          <div className="plan-card destacado">
            <div className="plan-badge">Más popular</div>
            <div className="plan-header">
              <h2>Anual</h2>
              <div className="plan-precio">
                <span className="precio">$999</span>
                <span className="periodo">/año</span>
              </div>
              <p className="plan-ahorro">Ahorra $189 vs mensual</p>
            </div>
            <ul className="plan-features">
              <li>✓ Todo lo gratuito</li>
              <li>✓ Acumula puntos en cada compra</li>
              <li>✓ Canjea por descuentos reales</li>
              <li>✓ 10% cashback en restaurantes</li>
              <li>✓ $300 de regalo en tu cumpleaños</li>
              <li>✓ Acceso a promociones exclusivas</li>
              <li>✓ Soporte prioritario</li>
            </ul>
            <button 
              className="btn-plan primary"
              onClick={() => handleSuscribirse('anual')}
              disabled={procesando}
            >
              {procesando ? 'Procesando...' : 'Suscribirme'}
            </button>
          </div>

          {/* Plan Mensual */}
          <div className="plan-card">
            <div className="plan-header">
              <h2>Mensual</h2>
              <div className="plan-precio">
                <span className="precio">$99</span>
                <span className="periodo">/mes</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>✓ Todo lo gratuito</li>
              <li>✓ Acumula puntos en cada compra</li>
              <li>✓ Canjea por descuentos reales</li>
              <li>✓ 10% cashback en restaurantes</li>
              <li>✓ $100 de regalo en tu cumpleaños</li>
              <li>✓ Cancela cuando quieras</li>
              <li className="disabled">✗ Promociones exclusivas</li>
            </ul>
            <button 
              className="btn-plan secondary"
              onClick={() => handleSuscribirse('mensual')}
              disabled={procesando}
            >
              {procesando ? 'Procesando...' : 'Suscribirme'}
            </button>
          </div>
        </div>

        {/* FAQ */}
        <section className="suscripcion-faq">
          <h2>Preguntas frecuentes</h2>
          
          <div className="faq-item">
            <h3>¿Cómo acumulo puntos?</h3>
            <p>Por cada $10 MXN de consumo en restaurantes participantes, acumulas 1 punto. Solo muestra tu QR al pagar.</p>
          </div>
          
          <div className="faq-item">
            <h3>¿Los puntos vencen?</h3>
            <p>Los puntos vencen 12 meses después de generarse. Si cancelas tu suscripción, se congelan hasta que renueves.</p>
          </div>
          
          <div className="faq-item">
            <h3>¿Puedo cancelar en cualquier momento?</h3>
            <p>Sí, puedes cancelar cuando quieras. Seguirás teniendo acceso hasta el fin de tu periodo pagado.</p>
          </div>
          
          <div className="faq-item">
            <h3>¿Qué métodos de pago aceptan?</h3>
            <p>Aceptamos todas las tarjetas de crédito/débito y OXXO Pay.</p>
          </div>
        </section>

        {/* CTA */}
        <section className="suscripcion-cta">
          <h2>¿Tienes más dudas?</h2>
          <p>Estamos aquí para ayudarte</p>
          <Link href="/contacto" className="btn-contacto">
            Contáctanos
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="suscripcion-footer">
        <p>© {new Date().getFullYear()} Turicanje. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}