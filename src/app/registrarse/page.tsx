'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './registro-usuario.css';

export default function RegistroUsuario() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    codigo_postal: '',
    fecha_nacimiento: '',
    password: '',
    confirmar_password: '',
    acepta_terminos: false,
    acepta_promociones: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-back.onrender.com';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validarFormulario = () => {
    if (!formData.nombre.trim()) return 'El nombre es requerido';
    if (!formData.apellido.trim()) return 'El apellido es requerido';
    if (!formData.email.trim()) return 'El email es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Email inválido';
    if (!formData.telefono.trim()) return 'El teléfono es requerido';
    if (formData.telefono.length < 10) return 'Teléfono debe tener al menos 10 dígitos';
    if (!formData.password) return 'La contraseña es requerida';
    if (formData.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (formData.password !== formData.confirmar_password) return 'Las contraseñas no coinciden';
    if (!formData.acepta_terminos) return 'Debes aceptar los términos y condiciones';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validacion = validarFormulario();
    if (validacion) {
      setError(validacion);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/usuarios/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          telefono: formData.telefono,
          codigo_postal: formData.codigo_postal,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          password: formData.password,
          acepta_promociones: formData.acepta_promociones
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="registro-container">
        <div className="registro-card success-card">
          <div className="success-icon">🎉</div>
          <h1>¡Bienvenido a Turicanje!</h1>
          <p>Tu cuenta ha sido creada exitosamente.</p>
          <p className="success-sub">Ya puedes empezar a acumular puntos en tus restaurantes favoritos.</p>
          <Link href="/login-usuario" className="btn-iniciar-sesion">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="registro-container">
      <div className="registro-card">
        <div className="registro-header">
          <Link href="/" className="registro-logo">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={180} 
              height={50}
              style={{ objectFit: 'contain' }}
            />
          </Link>
          <h1>Crea tu cuenta</h1>
          <p>Únete a la comunidad Turicanje y empieza a ganar recompensas</p>
        </div>

        {error && (
          <div className="registro-error">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="registro-form">
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
              <label htmlFor="apellido">Apellido *</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Tu apellido"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="telefono">Teléfono *</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="55 1234 5678"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="codigo_postal">Código Postal</label>
              <input
                type="text"
                id="codigo_postal"
                name="codigo_postal"
                value={formData.codigo_postal}
                onChange={handleChange}
                placeholder="01234"
                maxLength={5}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
            <input
              type="date"
              id="fecha_nacimiento"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleChange}
            />
            <span className="form-hint">Para sorpresas en tu cumpleaños 🎂</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Contraseña *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
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
            <div className="form-group">
              <label htmlFor="confirmar_password">Confirmar *</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmar_password"
                  name="confirmar_password"
                  value={formData.confirmar_password}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          <div className="form-checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="acepta_terminos"
                checked={formData.acepta_terminos}
                onChange={handleChange}
                required
              />
              <span className="checkmark"></span>
              <span>Acepto los <Link href="/terminos">términos y condiciones</Link> *</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="acepta_promociones"
                checked={formData.acepta_promociones}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              <span>Quiero recibir ofertas y promociones exclusivas</span>
            </label>
          </div>

          <button 
            type="submit" 
            className="btn-registrar"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creando cuenta...
              </>
            ) : (
              'Crear mi cuenta'
            )}
          </button>
        </form>

        <div className="registro-footer">
          <p>¿Ya tienes cuenta? <Link href="/login-usuario">Inicia sesión</Link></p>
        </div>

        <div className="registro-beneficios">
          <h3>✨ Beneficios de unirte</h3>
          <ul>
            <li>🎁 Acumula puntos en cada visita</li>
            <li>💰 Cashback en restaurantes participantes</li>
            <li>🎂 Sorpresas especiales en tu cumpleaños</li>
            <li>📱 Revisa tu saldo desde WhatsApp</li>
          </ul>
        </div>
      </div>
    </div>
  );
}