'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import './login.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [verificando, setVerificando] = useState(true);

  // ✅ Verificar si ya está logueado al cargar
  useEffect(() => {
    const verificarSesion = async () => {
      // Verificar token de comercio
      const tokenComercio = localStorage.getItem('token');
      // Verificar token de usuario loyalty
      const tokenUsuario = localStorage.getItem('usuario_token');
      
      if (!tokenComercio && !tokenUsuario) {
        setVerificando(false);
        return;
      }

      // Si hay token de comercio, verificar
      if (tokenComercio) {
        try {
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${tokenComercio}` }
          });

          if (response.ok) {
            const data = await response.json();
            redirigirSegunRol(data.usuario.role);
            return;
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
          }
        } catch (err) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
        }
      }

      // Si hay token de usuario loyalty, redirigir a mi-cuenta
      if (tokenUsuario) {
        router.push('/mi-cuenta');
        return;
      }

      setVerificando(false);
    };

    verificarSesion();
  }, []);

  // ✅ Función para redirigir según rol (comercios)
  const redirigirSegunRol = (role: string) => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        router.push('/admin');
        break;
      case 'comercio':
        router.push('/comercios/dashboard');
        break;
      case 'usuario':
        router.push('/mi-cuenta');
        break;
      default:
        router.push('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Primero intentar login de comercios
      const responseComercio = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (responseComercio.ok) {
        const data = await responseComercio.json();
        
        // Login de comercio exitoso
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        
        console.log('✅ Login comercio exitoso:', data.usuario.email);
        redirigirSegunRol(data.usuario.role);
        return;
      }

      // 2️⃣ Si comercio falla, intentar login de loyalty users
      const responseLoyalty = await fetch(`${API_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (responseLoyalty.ok) {
        const data = await responseLoyalty.json();
        
        // Login de loyalty exitoso
        localStorage.setItem('usuario_token', data.token);
        localStorage.setItem('usuario_data', JSON.stringify(data.usuario));
        
        console.log('✅ Login usuario exitoso:', data.usuario.email);
        router.push('/mi-cuenta');
        return;
      }

      // 3️⃣ Ambos fallaron - mostrar error
      const errorData = await responseLoyalty.json().catch(() => ({}));
      throw new Error(errorData.error || 'Credenciales inválidas');

    } catch (err: any) {
      console.log('❌ Error en login:', err.message);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras verifica sesión
  if (verificando) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Verificando...</h1>
            <p>Espera un momento</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Link href="/">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={180} 
              height={50}
              style={{ objectFit: 'contain', marginBottom: '20px' }}
            />
          </Link>
          <h1>Bienvenido de vuelta</h1>
          <p>Inicia sesión en Turicanje</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={mostrarPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setMostrarPassword(!mostrarPassword)}
              >
                {mostrarPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">⚠️ {error}</div>
          )}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="login-footer">
          <p className="link-olvidaste">
            <Link href="/recuperar-password">¿Olvidaste tu contraseña?</Link>
          </p>
          <p>
            ¿No tienes cuenta?{' '}
            <Link href="/registrarse" className="link-registro">Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}