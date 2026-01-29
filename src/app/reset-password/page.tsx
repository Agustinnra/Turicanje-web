'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import './reset-password.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function ResetPasswordContent() {
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

  useEffect(() => {
    const validarToken = async () => {
      if (!token) {
        setError('No se proporciono un token de recuperacion');
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
          throw new Error(data.error || 'Token no valido');
        }

        setTokenValido(true);
      } catch (err: any) {
        setError(err.message || 'El link de recuperacion no es valido o ha expirado');
      } finally {
        setValidando(false);
      }
    };

    validarToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nuevaPassword || !confirmarPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (nuevaPassword.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contrasenas no coinciden');
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
        throw new Error(data.error || 'Error al cambiar contrasena');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Error al cambiar contrasena');
    } finally {
      setLoading(false);
    }
  };

  if (validando) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <div className="reset-header">
            <div className="icono-loading">Cargando...</div>
            <h1>Verificando link...</h1>
            <p>Espera un momento mientras validamos tu solicitud</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValido && !validando) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <div className="reset-header">
            <div className="icono-error">X</div>
            <h1>Link no valido</h1>
            <p>{error || 'El link de recuperacion no es valido o ha expirado'}</p>
          </div>
          <div className="error-actions">
            <p className="error-hint">
              Los links de recuperacion expiran despues de 1 hora por seguridad.
            </p>
            <Link href="/recuperar-password" className="btn-solicitar-nuevo">
              Solicitar nuevo link
            </Link>
            <Link href="/login" className="link-volver">
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <div className="reset-header">
            <div className="icono-success">OK</div>
            <h1>Contrasena actualizada!</h1>
            <p>Tu contrasena ha sido cambiada exitosamente</p>
          </div>
          <div className="success-actions">
            <p className="redirect-text">
              Seras redirigido al login en unos segundos...
            </p>
            <Link href="/login" className="btn-ir-login">
              Ir al login ahora
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-container">
      <div className="reset-card">
        <div className="reset-header">
          <div className="icono-password">Clave</div>
          <h1>Crea tu nueva contrasena</h1>
          <p>Ingresa y confirma tu nueva contrasena</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="form-group">
            <label htmlFor="nuevaPassword">Nueva contrasena</label>
            <div className="password-input-wrapper">
              <input
                type={mostrarPassword ? "text" : "password"}
                id="nuevaPassword"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Minimo 6 caracteres"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setMostrarPassword(!mostrarPassword)}
              >
                {mostrarPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmarPassword">Confirmar contrasena</label>
            <input
              type={mostrarPassword ? "text" : "password"}
              id="confirmarPassword"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              placeholder="Repite tu contrasena"
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="password-requirements">
            <p className={nuevaPassword.length >= 6 ? 'valid' : ''}>
              {nuevaPassword.length >= 6 ? 'OK' : 'o'} Minimo 6 caracteres
            </p>
            <p className={nuevaPassword && nuevaPassword === confirmarPassword ? 'valid' : ''}>
              {nuevaPassword && nuevaPassword === confirmarPassword ? 'OK' : 'o'} Las contrasenas coinciden
            </p>
          </div>

          <button 
            type="submit" 
            className="btn-reset"
            disabled={loading || nuevaPassword.length < 6 || nuevaPassword !== confirmarPassword}
          >
            {loading ? 'Guardando...' : 'Guardar nueva contrasena'}
          </button>
        </form>

        <div className="reset-footer">
          <Link href="/login" className="link-volver">
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
