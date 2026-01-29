'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import './registro.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

interface NegocioInfo {
  id: string;
  nombre: string;
  categoria: string;
  direccion: string;
  imagen: string;
}

export default function RegistroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estados
  const [codigo, setCodigo] = useState('');
  const [codigoVerificado, setCodigoVerificado] = useState(false);
  const [negocioInfo, setNegocioInfo] = useState<NegocioInfo | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  
  // Datos del formulario
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmarPassword: ''
  });
  
  // Estados para mostrar/ocultar contraseñas
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);

  // Verificar si hay código en la URL
  useEffect(() => {
    const codigoUrl = searchParams.get('codigo');
    if (codigoUrl) {
      setCodigo(codigoUrl.toUpperCase());
      verificarCodigo(codigoUrl.toUpperCase());
    }
  }, [searchParams]);

  // Función para verificar código
  const verificarCodigo = async (codigoAVerificar: string) => {
    if (!codigoAVerificar || codigoAVerificar.length < 6) {
      setError('Ingresa un código válido');
      return;
    }

    setVerificando(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/comercios/verificar-codigo/${codigoAVerificar.toUpperCase()}`);
      const data = await res.json();

      if (!res.ok || !data.valido) {
        setError(data.error || 'Código no válido');
        setCodigoVerificado(false);
        setNegocioInfo(null);
        return;
      }

      setCodigoVerificado(true);
      setNegocioInfo(data.invitacion.negocio);
      
      // Pre-llenar nombre si viene en la invitación
      if (data.invitacion.nombre_invitado) {
        setForm(prev => ({ ...prev, nombre: data.invitacion.nombre_invitado }));
      }
      if (data.invitacion.email_invitado) {
        setForm(prev => ({ ...prev, email: data.invitacion.email_invitado }));
      }

    } catch (err) {
      console.error('Error verificando código:', err);
      setError('Error al verificar el código. Intenta de nuevo.');
    } finally {
      setVerificando(false);
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setExito('');

    // Validaciones
    if (!form.nombre || !form.email || !form.password) {
      setError('Todos los campos marcados con * son obligatorios');
      return;
    }

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (form.password !== form.confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setRegistrando(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          password: form.password,
          codigo: codigo
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Error al registrar');
      }

      setExito(`¡Cuenta creada exitosamente! Tu negocio "${data.negocio?.nombre}" está listo.`);
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push('/login?mensaje=registro_exitoso');
      }, 2500);

    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div className="registro-container">
      <div className="registro-card">
        {/* Logo/Header */}
        <div className="registro-header">
          <h1>🏪 Turicanje</h1>
          <p>Activa tu cuenta de comercio</p>
        </div>

        {/* Mensaje de éxito */}
        {exito && (
          <div className="mensaje exito">
            <span>✅</span>
            <p>{exito}</p>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="mensaje error">
            <span>❌</span>
            <p>{error}</p>
          </div>
        )}

        {/* PASO 1: Verificar código */}
        {!codigoVerificado && !exito && (
          <div className="codigo-section">
            <h2>Código de invitación</h2>
            <p className="codigo-instruccion">
              Para registrarte necesitas un código de invitación proporcionado por Turicanje.
            </p>
            
            <div className="codigo-input-wrapper">
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="TUR-XXXXXX"
                maxLength={10}
                className="codigo-input"
                disabled={verificando}
              />
              <button 
                onClick={() => verificarCodigo(codigo)}
                disabled={verificando || codigo.length < 6}
                className="btn-verificar"
              >
                {verificando ? '⏳ Verificando...' : '🔍 Verificar'}
              </button>
            </div>

            <div className="codigo-ayuda">
              <p>¿No tienes código?</p>
              <a href="mailto:contacto@turicanje.app">Contacta a contacto@turicanje.app</a>
            </div>
          </div>
        )}

        {/* PASO 2: Mostrar info del negocio y formulario */}
        {codigoVerificado && !exito && (
          <>
            {/* Info del negocio */}
            {negocioInfo && (
              <div className="negocio-preview">
                <div className="negocio-preview-header">
                  <span className="check-icon">✅</span>
                  <span>Código válido</span>
                </div>
                <div className="negocio-preview-content">
                  {negocioInfo.imagen && (
                    <img src={negocioInfo.imagen} alt={negocioInfo.nombre} className="negocio-imagen" />
                  )}
                  <div className="negocio-datos">
                    <h3>{negocioInfo.nombre}</h3>
                    <p className="negocio-categoria">{negocioInfo.categoria}</p>
                    {negocioInfo.direccion && (
                      <p className="negocio-direccion">📍 {negocioInfo.direccion}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Formulario de registro */}
            <form onSubmit={handleSubmit} className="registro-form">
              <h2>Crea tu cuenta</h2>
              
              <div className="form-group">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Teléfono (opcional)</label>
                <input
                  type="tel"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="55 1234 5678"
                />
              </div>

              <div className="form-group">
                <label>Contraseña *</label>
                <div className="password-input-wrapper">
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                  <button 
                    type="button" 
                    className="btn-toggle-password"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                  >
                    {mostrarPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirmar contraseña *</label>
                <div className="password-input-wrapper">
                  <input
                    type={mostrarConfirmarPassword ? "text" : "password"}
                    name="confirmarPassword"
                    value={form.confirmarPassword}
                    onChange={handleChange}
                    placeholder="Repite tu contraseña"
                    required
                  />
                  <button 
                    type="button" 
                    className="btn-toggle-password"
                    onClick={() => setMostrarConfirmarPassword(!mostrarConfirmarPassword)}
                  >
                    {mostrarConfirmarPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-registrar"
                disabled={registrando}
              >
                {registrando ? '⏳ Creando cuenta...' : '🚀 Activar mi cuenta'}
              </button>

              <button 
                type="button"
                className="btn-cambiar-codigo"
                onClick={() => {
                  setCodigoVerificado(false);
                  setNegocioInfo(null);
                  setCodigo('');
                }}
              >
                ← Usar otro código
              </button>
            </form>
          </>
        )}

        {/* Link a login */}
        <div className="registro-footer">
          <p>¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link></p>
        </div>
      </div>
    </div>
  );
}