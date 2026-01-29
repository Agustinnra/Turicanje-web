'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import './reset-password.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validando, setValidando] = useState(true);
  const [error, setError] = useState('');
  const [tokenValido, setTokenValido] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Validar token al cargar
  useEffect(() => {
    const validarToken = async () => {
      if (!token) {
        setError('No se proporcionó un token de recuperación');
        setValidando(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/validar-token-reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Token no válido');
        }

        setTokenValido(true);
      } catch (err: any) {
        setError(err.message || 'El link de recuperación no es válido o ha expirado');
      } finally {
        setValidando(false);
      }
    };

    validarToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!nuevaPassword || !confirmarPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nuevaPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar contraseña');
      }

      setSuccess(true);

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de carga mientras valida token
  if (validando) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <div className="reset-header">
            <div className="icono-loading">⏳</div>
            <h1>Verificando link...</h1>
            <p>Espera un momento mientras validamos tu solicitud</p>
          </div>
        </div>
      </div>
    );
  }

  // Token inválido o expirado
  if (!tokenValido && !validando) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <div className="reset-header">
            <div className="icono-error">❌</div>
            <h1>Link no válido</h1>
            <p>{error || 'El link de recuperación no es válido o ha expirado'}</p>
          </div>

          <div className="error-actions">
            <p className="error-hint">
              Los links de recuperación expiran después de 1 hora por seguridad.
            </p>
            <Link href="/recuperar-password" className="btn-solicitar-nuevo">
              Solicitar nuevo link
            </Link>
            <Link href="/login" className="link-volver">
              ← Volver al login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Éxito al cambiar contraseña
  if (success) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <div className="reset-header">
            <div className="icono-success">✓</div>
            <h1>¡Contraseña actualizada!</h1>
            <p>Tu contraseña ha sido cambiada exitosamente</p>
          </div>

          <div className="success-actions">
            <p className="redirect-text">
              Serás redirigido al login en unos segundos...
            </p>
            <Link href="/login" className="btn-ir-login">
              Ir al login ahora
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Formulario para nueva contraseña
  return (
    <div className="reset-container">
      <div className="reset-card">
        <div className="reset-header">
          <div className="icono-password">🔐</div>
          <h1>Crea tu nueva contraseña</h1>
          <p>Ingresa y confirma tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="form-group">
            <label htmlFor="nuevaPassword">Nueva contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={mostrarPassword ? "text" : "password"}
                id="nuevaPassword"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
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

          <div className="form-group">
            <label htmlFor="confirmarPassword">Confirmar contraseña</label>
            <input
              type={mostrarPassword ? "text" : "password"}
              id="confirmarPassword"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="password-requirements">
            <p className={nuevaPassword.length >= 6 ? 'valid' : ''}>
              {nuevaPassword.length >= 6 ? '✓' : '○'} Mínimo 6 caracteres
            </p>
            <p className={nuevaPassword && nuevaPassword === confirmarPassword ? 'valid' : ''}>
              {nuevaPassword && nuevaPassword === confirmarPassword ? '✓' : '○'} Las contraseñas coinciden
            </p>
          </div>

          <button 
            type="submit" 
            className="btn-reset"
            disabled={loading || nuevaPassword.length < 6 || nuevaPassword !== confirmarPassword}
          >
            {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>

        <div className="reset-footer">
          <Link href="/login" className="link-volver">
            ← Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}