'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import './registro-usuario.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function RegistroUsuarioPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    confirmarPassword: '',
    aceptaTerminos: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.nombre.trim()) {
      setError('Por favor ingresa tu nombre');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (!formData.aceptaTerminos) {
      setError('Debes aceptar los términos y condiciones');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStep2()) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/registro-usuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          telefono: formData.telefono,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrarse');
      }

      router.push('/login?registro=exitoso');

    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registro-usuario-container">
      <header className="registro-header">
        <Link href="/" className="logo-link">
          <Image 
            src="/icons/logo-turicanje.png" 
            alt="Turicanje" 
            width={180}
            height={63}
            priority
          />
        </Link>
      </header>

      <main className="registro-main">
        <div className="registro-card">
          <div className="registro-icon">🎉</div>
          <h1 className="registro-title">¡Prueba Gratis!</h1>
          <p className="registro-subtitle">
            Crea tu cuenta y empieza a ganar recompensas
          </p>

          {/* Progress Steps */}
          <div className="progress-steps">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Datos</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Seguridad</span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="registro-form">
            {step === 1 && (
              <div className="form-step">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nombre">Nombre *</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="apellido">Apellido</label>
                    <input
                      type="text"
                      id="apellido"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleChange}
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Correo electrónico *</label>
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
                  <label htmlFor="telefono">Teléfono (opcional)</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="55 1234 5678"
                  />
                </div>

                <button 
                  type="button" 
                  className="next-btn"
                  onClick={handleNextStep}
                >
                  Continuar →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="form-step">
                <div className="form-group">
                  <label htmlFor="password">Contraseña *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmarPassword">Confirmar contraseña *</label>
                  <input
                    type="password"
                    id="confirmarPassword"
                    name="confirmarPassword"
                    value={formData.confirmarPassword}
                    onChange={handleChange}
                    placeholder="Repite tu contraseña"
                    required
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="aceptaTerminos"
                      checked={formData.aceptaTerminos}
                      onChange={handleChange}
                    />
                    <span className="checkmark"></span>
                    <span>
                      Acepto los{' '}
                      <Link href="/terminos-usuarios" target="_blank">
                        términos y condiciones
                      </Link>
                      {' '}y la{' '}
                      <Link href="/privacidad" target="_blank">
                        política de privacidad
                      </Link>
                    </span>
                  </label>
                </div>

                <div className="form-buttons">
                  <button 
                    type="button" 
                    className="back-btn"
                    onClick={() => setStep(1)}
                  >
                    ← Atrás
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="login-link">
            <p>¿Ya tienes cuenta?</p>
            <Link href="/login">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </main>

      <footer className="registro-footer">
        <p>© {new Date().getFullYear()} Turicanje. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}