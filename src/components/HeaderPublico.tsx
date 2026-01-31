'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import './HeaderPublico.css';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

export default function HeaderPublico() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

    // Cerrar menú al hacer click afuera
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('usuario_token');
    localStorage.removeItem('usuario_data');
    setUsuario(null);
    setMenuAbierto(false);
    router.refresh();
  };

  const iniciarSesion = () => {
    // Guardar URL actual para regresar después del login
    localStorage.setItem('redirect_after_login', window.location.pathname);
    router.push('/login');
  };

  return (
    <header className="header-publico">
      <div className="header-publico-container">
        {/* Logo */}
        <Link href="/" className="header-logo">
          <Image 
            src="/icons/logo-turicanje.png" 
            alt="Turicanje" 
            width={140} 
            height={40}
            style={{ objectFit: 'contain' }}
          />
        </Link>

        {/* Navegación central (opcional) */}
        <nav className="header-nav">
          <Link href="/restaurantes" className="nav-link">
            Restaurantes
          </Link>
          <Link href="/creadores" className="nav-link">
            Creadores
          </Link>
        </nav>

        {/* Usuario / Login */}
        <div className="header-user" ref={menuRef}>
          {usuario ? (
            <>
              <button 
                className="user-button"
                onClick={() => setMenuAbierto(!menuAbierto)}
              >
                <div className="user-avatar">
                  {usuario.nombre?.charAt(0).toUpperCase() || '?'}
                </div>
                <span className="user-name">{usuario.nombre?.split(' ')[0]}</span>
                <span className={`dropdown-arrow ${menuAbierto ? 'open' : ''}`}>▼</span>
              </button>

              {menuAbierto && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <span className="dropdown-name">{usuario.nombre}</span>
                    <span className="dropdown-email">{usuario.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link href="/mi-cuenta" className="dropdown-item" onClick={() => setMenuAbierto(false)}>
                    <span>👤</span> Mi cuenta
                  </Link>
                  <Link href="/mi-cuenta?tab=favoritos" className="dropdown-item" onClick={() => setMenuAbierto(false)}>
                    <span>❤️</span> Mis favoritos
                  </Link>
                  <Link href="/mi-cuenta?tab=siguiendo" className="dropdown-item" onClick={() => setMenuAbierto(false)}>
                    <span>👥</span> Siguiendo
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={cerrarSesion}>
                    <span>🚪</span> Cerrar sesión
                  </button>
                </div>
              )}
            </>
          ) : (
            <button className="btn-iniciar-sesion" onClick={iniciarSesion}>
              Iniciar sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
}