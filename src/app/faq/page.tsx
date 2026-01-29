'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './faq.css';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

interface FAQItem {
  pregunta: string;
  respuesta: string;
  categoria: string;
}

const faqs: FAQItem[] = [
  {
    categoria: 'General',
    pregunta: '¿Qué es Turicanje?',
    respuesta: 'Turicanje es un programa de lealtad multimarca que opera en México. Te permite acumular puntos por tus consumos en restaurantes y comercios afiliados, y canjearlos por descuentos y beneficios.'
  },
  {
    categoria: 'General',
    pregunta: '¿Cuánto cuesta registrarse?',
    respuesta: 'El registro al Programa Turicanje no tiene costo alguno por el primer año para nuevos socios. Puedes registrarte a través de nuestra app o página web.'
  },
  {
    categoria: 'General',
    pregunta: '¿Quién puede participar?',
    respuesta: 'Puede participar cualquier persona física mayor de 18 años de edad, con capacidad legal para obligarse, que resida en territorio mexicano.'
  },
  {
    categoria: 'Puntos',
    pregunta: '¿Cómo acumulo puntos?',
    respuesta: 'Por cada $10 pesos de consumo en las marcas participantes se acumula 1 punto que equivale a $1.00 peso mexicano. Debes presentar tu tarjeta física o digital antes de pedir la cuenta.'
  },
  {
    categoria: 'Puntos',
    pregunta: '¿Los puntos tienen fecha de vencimiento?',
    respuesta: 'Sí, los Puntos Turicanje vencen después de 12 meses a partir de su fecha de emisión. También vencen si hay inactividad en tu cuenta por 12 meses consecutivos.'
  },
  {
    categoria: 'Puntos',
    pregunta: '¿Puedo transferir mis puntos a otra persona?',
    respuesta: 'No, los puntos son personales e intransferibles. Solo pueden ser utilizados por el titular de la tarjeta Turicanje.'
  },
  {
    categoria: 'Puntos',
    pregunta: '¿Puedo canjear mis puntos por dinero en efectivo?',
    respuesta: 'No, los puntos no tienen valor monetario y no pueden canjearse por dinero en efectivo o algún título de crédito. Solo pueden usarse para pagar consumos en establecimientos afiliados.'
  },
  {
    categoria: 'Pagos',
    pregunta: '¿Cómo pago con mis puntos?',
    respuesta: 'Indica al mesero que deseas pagar con puntos y presenta tu Tarjeta Turicanje física o digital junto con una identificación oficial. Especifica la cantidad de puntos que deseas utilizar.'
  },
  {
    categoria: 'Pagos',
    pregunta: '¿Puedo combinar puntos con otras promociones?',
    respuesta: 'El pago con puntos no puede combinarse con otros programas de lealtad externos. Sin embargo, sí puede combinarse con promociones bancarias y cupones digitales del programa.'
  },
  {
    categoria: 'Pagos',
    pregunta: '¿Puedo pagar propinas con puntos?',
    respuesta: 'No, el pago con puntos no es aplicable para propinas ni para activaciones o compra de certificados de regalo.'
  },
  {
    categoria: 'Cuenta',
    pregunta: '¿Cómo recupero mi contraseña?',
    respuesta: 'Para iniciar sesión puedes elegir tu número telefónico o correo electrónico registrado. Te llegará una contraseña temporal al medio de contacto seleccionado.'
  },
  {
    categoria: 'Cuenta',
    pregunta: '¿Qué hago si pierdo mi tarjeta?',
    respuesta: 'Reporta inmediatamente al correo contacto@turicanje.com. Tu cuenta se bloqueará hasta que se aclare la situación. Los puntos disponibles al momento del reporte estarán protegidos.'
  },
  {
    categoria: 'Cuenta',
    pregunta: '¿Cómo cancelo mi participación?',
    respuesta: 'Puedes cancelar tu participación a través de www.turicanje.app o llamando al 5576794313 de lunes a viernes de 9:00 a 18:00 h. La cancelación resultará en la pérdida de los puntos acumulados.'
  },
  {
    categoria: 'Beneficios',
    pregunta: '¿Qué beneficios tengo en mi cumpleaños?',
    respuesta: 'En tu mes de cumpleaños recibes cupones de descuento: $200 en consumo mínimo de $500 (plan Mensual), $300 en consumo mínimo de $600 (plan Anual), o $500 en consumo mínimo de $1000 (TuriClub).'
  },
  {
    categoria: 'Comercios',
    pregunta: '¿Cómo afilio mi negocio a Turicanje?',
    respuesta: 'Contacta a nuestro equipo comercial a través de comercios@turicanje.com o en la sección de contacto. Te explicaremos los beneficios y el proceso de afiliación.'
  },
  {
    categoria: 'Comercios',
    pregunta: '¿Cuánto cuesta afiliar mi negocio?',
    respuesta: 'Los establecimientos afiliados no pagan cuotas durante el primer año. Solo se cobra la tarifa fija por envío para distancias menores a 4 km.'
  }
];

export default function FAQPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');

  const categorias = ['Todas', ...Array.from(new Set(faqs.map(f => f.categoria)))];
  
  const faqsFiltradas = filtroCategoria === 'Todas' 
    ? faqs 
    : faqs.filter(f => f.categoria === filtroCategoria);

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

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-container">
      {/* Header */}
      <header className="faq-header">
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
      <section className="faq-hero">
        <div className="hero-content">
          <h1>Preguntas Frecuentes</h1>
          <p>Encuentra respuestas a las dudas más comunes</p>
        </div>
      </section>

      {/* Main */}
      <main className="faq-main">
        <div className="faq-content">
          <div className="faq-filtros">
            {categorias.map(cat => (
              <button
                key={cat}
                className={`filtro-btn ${filtroCategoria === cat ? 'active' : ''}`}
                onClick={() => {
                  setFiltroCategoria(cat);
                  setActiveIndex(null);
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="faq-lista">
            {faqsFiltradas.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${activeIndex === index ? 'active' : ''}`}
              >
                <button 
                  className="faq-pregunta"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="faq-categoria-tag">{faq.categoria}</span>
                  <span className="faq-texto">{faq.pregunta}</span>
                  <span className="faq-icon">+</span>
                </button>
                {activeIndex === index && (
                  <div className="faq-respuesta">
                    <p>{faq.respuesta}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="faq-cta">
            <h2>¿No encontraste lo que buscabas?</h2>
            <p>Estamos aquí para ayudarte</p>
            <Link href="/contacto" className="cta-btn">
              Contáctanos
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="faq-footer">
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