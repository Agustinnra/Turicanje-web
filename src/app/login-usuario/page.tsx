'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import './login-usuario.css';

export default function LoginUsuario() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

  useEffect(() => {
    // Verificar si ya está logueado
    const token = localStorage.getItem('usuario_token');
    if (token) {
      router.push('/mi-cuenta');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Guardar token y datos del usuario
      localStorage.setItem('usuario_token', data.token);
      localStorage.setItem('usuario_data', JSON.stringify(data.usuario));

      // Siempre ir a mi-cuenta después del login
      router.push('/mi-cuenta');

    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-usuario-container">
      <div className="login-usuario-card">
        <div className="login-usuario-header">
          <Link href="/" className="login-usuario-logo">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={180} 
              height={50}
              style={{ objectFit: 'contain' }}
            />
          </Link>
          <h1>Bienvenido de vuelta</h1>
          <p>Inicia sesión para ver tus puntos y recompensas</p>
        </div>

        {error && (
          <div className="login-usuario-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-usuario-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Tu contraseña"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <Link href="/recuperar-password-usuario" className="forgot-password-link">
            ¿Olvidaste tu contraseña?
          </Link>

          <button 
            type="submit" 
            className="btn-login-usuario"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="login-usuario-footer">
          <p>¿No tienes cuenta? <Link href="/registrarse">Regístrate gratis</Link></p>
        </div>

        <div className="login-usuario-divider">
          <span>o</span>
        </div>

        <Link href="/login" className="btn-login-comercio">
          🏪 Soy comercio / negocio
        </Link>
      </div>
    </div>
  );
}