'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      const token = localStorage.getItem('token');
      
      if (!token) {
        setVerificando(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          // Ya está logueado, redirigir según rol
          redirigirSegunRol(data.usuario.role);
        } else {
          // Token inválido, limpiar
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          setVerificando(false);
        }
      } catch (err) {
        setVerificando(false);
      }
    };

    verificarSesion();
  }, []);

  // ✅ Función para redirigir según rol
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
        router.push('/usuario');
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
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Guardar token y usuario
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      // ✅ Redirigir según el rol del usuario
      redirigirSegunRol(data.usuario.role);

    } catch (err: any) {
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
          <p>
            ¿No tienes cuenta?{' '}
            <Link href="/registro" className="link-registro">Regístrate aquí</Link>
          </p>
          <p className="link-olvidaste">
            <Link href="/recuperar-password">¿Olvidaste tu contraseña?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}