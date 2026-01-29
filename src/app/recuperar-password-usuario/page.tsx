'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './recuperar-password.css';

export default function RecuperarPasswordUsuario() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/usuarios/recuperar-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar correo');
      }

      setEnviado(true);

    } catch (err: any) {
      setError(err.message || 'Error al procesar solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="recuperar-container">
        <div className="recuperar-card">
          <div className="recuperar-header">
            <Link href="/" className="recuperar-logo">
              <Image 
                src="/icons/logo-turicanje.png" 
                alt="Turicanje" 
                width={180} 
                height={50}
                style={{ objectFit: 'contain' }}
              />
            </Link>
          </div>

          <div className="success-state">
            <div className="success-icon">📧</div>
            <h1>¡Revisa tu correo!</h1>
            <p>
              Si existe una cuenta asociada a <strong>{email}</strong>, 
              recibirás un enlace para restablecer tu contraseña.
            </p>
            <div className="success-tips">
              <p>💡 <strong>¿No lo encuentras?</strong></p>
              <ul>
                <li>Revisa tu carpeta de spam o correo no deseado</li>
                <li>Verifica que el correo esté bien escrito</li>
                <li>El enlace expira en 1 hora</li>
              </ul>
            </div>
            <Link href="/login" className="btn-volver">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recuperar-container">
      <div className="recuperar-card">
        <div className="recuperar-header">
          <Link href="/" className="recuperar-logo">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={180} 
              height={50}
              style={{ objectFit: 'contain' }}
            />
          </Link>
          <h1>Recuperar contraseña</h1>
          <p>Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña</p>
        </div>

        {error && (
          <div className="recuperar-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="recuperar-form">
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="tu@email.com"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-recuperar"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Enviando...
              </>
            ) : (
              'Enviar enlace de recuperación'
            )}
          </button>
        </form>

        <div className="recuperar-footer">
          <Link href="/login" className="back-link">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}