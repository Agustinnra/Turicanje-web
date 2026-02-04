'use client';

import Image from 'next/image';
import Link from 'next/link';
import './resenas.css';

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
    imagen: "/testimonios/cochibirria.jpg",
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
    imagen: "/testimonios/cafepunal.jpg",
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
    imagen: "/testimonios/santosuadero.jpg",
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
    imagen: "/testimonios/fandango.jpg",
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
    imagen: "/testimonios/titanesdelmar.jpg",
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
    imagen: "/testimonios/handrollers.jpg",
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
    avatar: "/avatars/user1.jpg",
    rating: 5,
    puntosAcumulados: "487 puntos"
  },
  {
    id: 2,
    nombre: "Carlos Hernández",
    ocupacion: "Contador",
    zona: "Del Valle",
    testimonio: "Lo uso principalmente para encontrar dónde desayunar. El bot entiende cuando le pongo 'huevos rancheros' o 'algo rápido'. Siempre atina.",
    avatar: "/avatars/user2.jpg",
    rating: 5,
    puntosAcumulados: "312 puntos"
  },
  {
    id: 3,
    nombre: "Sofía Martínez",
    ocupacion: "Arquitecta",
    zona: "Roma Sur",
    testimonio: "Me encanta que puedo ver los menús y el cashback antes de ir. Ya no llego a lugares caros sin saber. Y los puntos son dinero real.",
    avatar: "/avatars/user3.jpg",
    rating: 5,
    puntosAcumulados: "623 puntos"
  },
  {
    id: 4,
    nombre: "Andrés Ruiz",
    ocupacion: "Desarrollador",
    zona: "Portales",
    testimonio: "El QR de usuario es genial. Llego, pago, escanean mi código y listo. Sin apps pesadas ni registro en cada lugar.",
    avatar: "/avatars/user4.jpg",
    rating: 5,
    puntosAcumulados: "891 puntos"
  },
  {
    id: 5,
    nombre: "Valentina López",
    ocupacion: "Maestra",
    zona: "Benito Juárez",
    testimonio: "Mis amigas y yo hacemos 'ruta de cafés' los sábados. Buscamos en el bot y vamos a los que tienen mejor cashback. Ya es tradición.",
    avatar: "/avatars/user5.jpg",
    rating: 5,
    puntosAcumulados: "445 puntos"
  },
  {
    id: 6,
    nombre: "Ricardo Peña",
    ocupacion: "Vendedor",
    zona: "Doctores",
    testimonio: "Como mucho en la calle por mi trabajo. El bot me salva cuando no sé qué comer. Le pongo mi ubicación y me recomienda lo mejor cerca.",
    avatar: "/avatars/user6.jpg",
    rating: 5,
    puntosAcumulados: "1,204 puntos"
  }
];

// Estadísticas
const estadisticas = [
  { numero: "150+", label: "Negocios registrados" },
  { numero: "600+", label: "Usuarios activos" },
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
  return (
    <main className="resenas-page">
      {/* Header */}
      <header className="resenas-header">
        <div className="header-content">
          <Link href="/" className="logo-link">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={150} 
              height={52}
              className="logo"
            />
          </Link>
          <nav className="header-nav">
            <Link href="/">Inicio</Link>
            <Link href="/afiliar-negocio">Afiliar Negocio</Link>
            <Link href="/registrarse">Crear Cuenta</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="resenas-hero">
        <div className="hero-content">
          <h1>Lo que dicen de <span className="highlight">Turicanje</span></h1>
          <p className="hero-subtitle">
            Negocios y usuarios comparten su experiencia con nuestra plataforma
          </p>
        </div>
        <div className="hero-decoration"></div>
      </section>

      {/* Estadísticas */}
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

      {/* Testimonios de Negocios */}
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
                "{testimonio.testimonio}"
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

      {/* CTA Negocios */}
      <section className="cta-section cta-negocios">
        <div className="cta-content">
          <h3>¿Tienes un restaurante o café?</h3>
          <p>Únete a los negocios que ya están fidelizando clientes con Turicanje</p>
          <Link href="/afiliar-negocio" className="cta-button">
            Afiliar mi Negocio →
          </Link>
        </div>
      </section>

      {/* Testimonios de Usuarios */}
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
                "{testimonio.testimonio}"
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

      {/* CTA Usuarios */}
      <section className="cta-section cta-usuarios">
        <div className="cta-content">
          <h3>¿Listo para empezar a acumular puntos?</h3>
          <p>Regístrate gratis y descubre los mejores lugares para comer en CDMX</p>
          <div className="cta-buttons">
            <Link href="/registrarse" className="cta-button primary">
              Crear mi Cuenta
            </Link>
            <a 
              href="https://wa.me/5215512345678?text=Hola" 
              target="_blank" 
              rel="noopener noreferrer"
              className="cta-button secondary"
            >
              💬 Probar el Bot
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="resenas-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={120}
              height={42}
            />
            <p>El programa de lealtad para restaurantes y comensales en México</p>
          </div>
          <div className="footer-links">
            <Link href="/terminos">Términos y Condiciones</Link>
            <Link href="/privacidad">Aviso de Privacidad</Link>
            <Link href="mailto:contacto@turicanje.com">Contacto</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Turicanje. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
