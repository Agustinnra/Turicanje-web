'use client';

import { useState, useEffect, Suspense } from 'react';
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

function RegistroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [codigo, setCodigo] = useState('');
  const [codigoVerificado, setCodigoVerificado] = useState(false);
  const [negocioInfo, setNegocioInfo] = useState<NegocioInfo | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmarPassword: ''
  });
  
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);

  useEffect(() => {
    const codigoUrl = searchParams.get('codigo');
    if (codigoUrl) {
      setCodigo(codigoUrl.toUpperCase());
      verificarCodigo(codigoUrl.toUpperCase());
    }
  }, [searchParams]);

  const verificarCodigo = async (codigoAVerificar: string) => {
    if (!codigoAVerificar || codigoAVerificar.length < 6) {
      setError('Ingresa un codigo valido');
      return;
    }

    setVerificando(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/comercios/verificar-codigo/${codigoAVerificar.toUpperCase()}`);
      const data = await res.json();

      if (!res.ok || !data.valido) {
        setError(data.error || 'Codigo no valido');
        setCodigoVerificado(false);
        setNegocioInfo(null);
        return;
      }

      setCodigoVerificado(true);
      setNegocioInfo(data.invitacion.negocio);
      
      if (data.invitacion.nombre_invitado) {
        setForm(prev => ({ ...prev, nombre: data.invitacion.nombre_invitado }));
      }
      if (data.invitacion.email_invitado) {
        setForm(prev => ({ ...prev, email: data.invitacion.email_invitado }));
      }

    } catch (err) {
      console.error('Error verificando codigo:', err);
      setError('Error al verificar el codigo. Intenta de nuevo.');
    } finally {
      setVerificando(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (!form.nombre || !form.email || !form.password) {
      setError('Todos los campos marcados con * son obligatorios');
      return;
    }

    if (form.password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    if (form.password !== form.confirmarPassword) {
      setError('Las contrasenas no coinciden');
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

      setExito(`Cuenta creada exitosamente! Tu negocio "${data.negocio?.nombre}" esta listo.`);
      
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
        <div className="registro-header">
          <h1>Turicanje</h1>
          <p>Activa tu cuenta de comercio</p>
        </div>

        {exito && (
          <div className="mensaje exito">
            <span>OK</span>
            <p>{exito}</p>
          </div>
        )}

        {error && (
          <div className="mensaje error">
            <span>X</span>
            <p>{error}</p>
          </div>
        )}

        {!codigoVerificado && !exito && (
          <div className="codigo-section">
            <h2>Codigo de invitacion</h2>
            <p className="codigo-instruccion">
              Para registrarte necesitas un codigo de invitacion proporcionado por Turicanje.
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
                {verificando ? 'Verificando...' : 'Verificar'}
              </button>
            </div>

            <div className="codigo-ayuda">
              <p>No tienes codigo?</p>
              <a href="mailto:contacto@turicanje.app">Contacta a contacto@turicanje.app</a>
            </div>
          </div>
        )}

        {codigoVerificado && !exito && (
          <>
            {negocioInfo && (
              <div className="negocio-preview">
                <div className="negocio-preview-header">
                  <span className="check-icon">OK</span>
                  <span>Codigo valido</span>
                </div>
                <div className="negocio-preview-content">
                  {negocioInfo.imagen && (
                    <img src={negocioInfo.imagen} alt={negocioInfo.nombre} className="negocio-imagen" />
                  )}
                  <div className="negocio-datos">
                    <h3>{negocioInfo.nombre}</h3>
                    <p className="negocio-categoria">{negocioInfo.categoria}</p>
                    {negocioInfo.direccion && (
                      <p className="negocio-direccion">{negocioInfo.direccion}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                <label>Telefono (opcional)</label>
                <input
                  type="tel"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="55 1234 5678"
                />
              </div>

              <div className="form-group">
                <label>Contrasena *</label>
                <div className="password-input-wrapper">
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimo 6 caracteres"
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
                <label>Confirmar contrasena *</label>
                <div className="password-input-wrapper">
                  <input
                    type={mostrarConfirmarPassword ? "text" : "password"}
                    name="confirmarPassword"
                    value={form.confirmarPassword}
                    onChange={handleChange}
                    placeholder="Repite tu contrasena"
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
                {registrando ? 'Creando cuenta...' : 'Activar mi cuenta'}
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
                Usar otro codigo
              </button>
            </form>
          </>
        )}

        <div className="registro-footer">
          <p>Ya tienes cuenta? <Link href="/login">Inicia sesion</Link></p>
        </div>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <RegistroContent />
    </Suspense>
  );
}
