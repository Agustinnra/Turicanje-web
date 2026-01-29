'use client';

import { useState } from 'react';
import Link from 'next/link';
import './recuperar-password.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Por favor ingresa tu email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('El email no es válido');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/solicitar-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar solicitud');
      }

      setEmailEnviado(email);
      setSuccess(true);
      setEmail('');

    } catch (err: any) {
      setError(err.message || 'Error al enviar solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recuperar-container">
      <div className="recuperar-card">
        <div className="recuperar-header">
          <div className="icono-password">🔑</div>
          <h1>¿Olvidaste tu contraseña?</h1>
          <p>No te preocupes, te enviaremos un link para recuperarla</p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="recuperar-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                required
              />
              <small className="helper-text">
                Ingresa el email con el que te registraste
              </small>
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn-recuperar"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperación'}
            </button>
          </form>
        ) : (
          <div className="success-container">
            <div className="success-icon">✓</div>
            <h2>¡Email enviado!</h2>
            <p className="success-text">
              Te hemos enviado un correo a <strong>{emailEnviado}</strong> con instrucciones 
              para recuperar tu contraseña.
            </p>
            <div className="success-info">
              <p>📧 Revisa tu bandeja de entrada</p>
              <p>🕐 El link expira en 1 hora</p>
              <p>📂 Si no lo ves, revisa tu carpeta de spam</p>
            </div>
          </div>
        )}

        <div className="recuperar-footer">
          <Link href="/login" className="link-volver">
            ← Volver al login
          </Link>
          
          {success && (
            <button 
              className="link-reenviar"
              onClick={() => setSuccess(false)}
            >
              ¿No recibiste el email? Enviar de nuevo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}