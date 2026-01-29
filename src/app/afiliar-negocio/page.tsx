'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import './afiliar.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'djaecf31x';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

const CATEGORIAS = [
  'Restaurante',
  'Taquería',
  'Cafetería',
  'Bar',
  'Dark Kitchen',
  'Antojitos',
  'Mariscos',
  'Pizzería',
  'Comida Rápida',
  'Comida Mexicana',
  'Comida Internacional',
  'Panadería',
  'Pastelería',
  'Food Truck',
  'Otro'
];

interface FormData {
  // Negocio
  nombre_negocio: string;
  categoria: string;
  direccion: string;
  telefono_negocio: string;
  productos: string;
  horario_texto: string;
  foto_fachada: string;
  // Propietario
  nombre_dueño: string;
  email_dueño: string;
  whatsapp_dueño: string;
  preferencia_contacto: 'email' | 'whatsapp';
  acepta_terminos: boolean;
}

interface DireccionData {
  direccion_completa: string;
  latitud: number | null;
  longitud: number | null;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

declare global {
  interface Window {
    cloudinary: any;
  }
}

export default function AfiliarNegocio() {
  const [formData, setFormData] = useState<FormData>({
    nombre_negocio: '',
    categoria: '',
    direccion: '',
    telefono_negocio: '',
    productos: '',
    horario_texto: '',
    foto_fachada: '',
    nombre_dueño: '',
    email_dueño: '',
    whatsapp_dueño: '',
    preferencia_contacto: 'whatsapp',
    acepta_terminos: false
  });

  const [direccionData, setDireccionData] = useState<DireccionData>({
    direccion_completa: '',
    latitud: null,
    longitud: null,
    neighborhood: '',
    city: '',
    state: '',
    country: '',
    postal_code: ''
  });

  const [enviando, setEnviando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [cloudinaryReady, setCloudinaryReady] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar Google Maps API
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;
    if (window.google?.maps?.places) {
      initAutocomplete();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=es`;
    script.async = true;
    script.onload = initAutocomplete;
    document.head.appendChild(script);
  }, []);

  const initAutocomplete = () => {
    if (!inputRef.current || !window.google) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment', 'geocode'],
      componentRestrictions: { country: 'mx' },
      fields: ['formatted_address', 'geometry', 'address_components', 'name']
    });

    autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
  };

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place) return;

    let neighborhood = '';
    let city = '';
    let state = '';
    let country = '';
    let postal_code = '';

    place.address_components?.forEach((component) => {
      const types = component.types;
      if (types.includes('sublocality') || types.includes('neighborhood')) {
        neighborhood = component.long_name;
      }
      if (types.includes('locality')) {
        city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
      if (types.includes('country')) {
        country = component.long_name;
      }
      if (types.includes('postal_code')) {
        postal_code = component.long_name;
      }
    });

    const direccionCompleta = place.formatted_address || '';

    setDireccionData({
      direccion_completa: direccionCompleta,
      latitud: place.geometry?.location?.lat() || null,
      longitud: place.geometry?.location?.lng() || null,
      neighborhood,
      city,
      state,
      country,
      postal_code
    });

    setFormData(prev => ({
      ...prev,
      direccion: direccionCompleta
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Subir foto con Cloudinary
  const handleUploadFoto = () => {
    if (!cloudinaryReady || !window.cloudinary) {
      alert('El sistema de carga de imágenes no está listo. Intenta de nuevo en unos segundos.');
      return;
    }

    setSubiendo(true);

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'camera'],
        multiple: false,
        maxFiles: 1,
        maxFileSize: 5000000, // 5MB
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        cropping: false,
        showSkipCropButton: true,
        language: 'es',
        text: {
          'es': {
            'or': 'o',
            'menu': {
              'files': 'Mis archivos',
              'camera': 'Cámara'
            },
            'local': {
              'browse': 'Seleccionar archivo',
              'dd_title_single': 'Arrastra una imagen aquí',
            }
          }
        }
      },
      (error: any, result: any) => {
        if (error) {
          console.error('Error Cloudinary:', error);
          setSubiendo(false);
          return;
        }

        if (result.event === 'success') {
          const url = result.info.secure_url;
          console.log('✅ Foto subida:', url);
          setFormData(prev => ({
            ...prev,
            foto_fachada: url
          }));
          setSubiendo(false);
        }

        if (result.event === 'close') {
          setSubiendo(false);
        }
      }
    );

    widget.open();
  };

  const handleRemoveFoto = () => {
    setFormData(prev => ({
      ...prev,
      foto_fachada: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    // Validaciones
    if (!formData.acepta_terminos) {
      setMensaje({ tipo: 'error', texto: 'Debes aceptar los términos y condiciones' });
      return;
    }

    if (!formData.foto_fachada) {
      setMensaje({ tipo: 'error', texto: 'Por favor sube una foto de la fachada de tu negocio' });
      return;
    }

    if (!formData.whatsapp_dueño) {
      setMensaje({ tipo: 'error', texto: 'El WhatsApp es obligatorio para poder contactarte' });
      return;
    }

    setEnviando(true);

    try {
      const payload = {
        nombre_negocio: formData.nombre_negocio.trim(),
        categoria: formData.categoria,
        direccion: direccionData.direccion_completa || formData.direccion,
        telefono_negocio: formData.telefono_negocio.trim(),
        productos: formData.productos.trim(),
        horario_texto: formData.horario_texto.trim(),
        foto_fachada: formData.foto_fachada,
        email_dueño: formData.email_dueño.trim().toLowerCase(),
        nombre_dueño: formData.nombre_dueño.trim(),
        whatsapp_dueño: formData.whatsapp_dueño.trim(),
        preferencia_contacto: formData.preferencia_contacto,
        latitud: direccionData.latitud,
        longitud: direccionData.longitud,
        neighborhood: direccionData.neighborhood,
        city: direccionData.city,
        state: direccionData.state,
        country: direccionData.country,
        postal_code: direccionData.postal_code
      };

      const res = await fetch(`${API_URL}/api/comercios/solicitud-afiliacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar solicitud');
      }

      setEnviado(true);
      setMensaje({ 
        tipo: 'exito', 
        texto: '¡Solicitud enviada correctamente!' 
      });

    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setEnviando(false);
    }
  };

  // Pantalla de éxito
  if (enviado) {
    return (
      <div className="afiliar-page">
        <Script
          src="https://widget.cloudinary.com/v2.0/global/all.js"
          strategy="lazyOnload"
        />
        
        <header className="afiliar-header">
          <Link href="/" className="logo-link">
            <Image 
              src="/icons/logo-turicanje.png" 
              alt="Turicanje" 
              width={150} 
              height={40}
              priority
            />
          </Link>
        </header>

        <main className="afiliar-main">
          <div className="success-container">
            <div className="success-icon">✅</div>
            <h1>¡Solicitud Recibida!</h1>
            <p className="success-message">
              Gracias por tu interés en Turicanje. Revisaremos la información de 
              <strong> {formData.nombre_negocio}</strong> y te contactaremos 
              {formData.preferencia_contacto === 'whatsapp' ? (
                <> por WhatsApp al <strong>{formData.whatsapp_dueño}</strong></>
              ) : (
                <> al email <strong>{formData.email_dueño}</strong></>
              )} en las próximas 24-48 horas.
            </p>
            <div className="success-steps">
              <h3>¿Qué sigue?</h3>
              <ol>
                <li>Revisaremos tu solicitud</li>
                <li>Te enviaremos un código de acceso</li>
                <li>Podrás completar tu perfil y activar beneficios</li>
              </ol>
            </div>
            <Link href="/" className="btn-volver">
              Volver al inicio
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="afiliar-page">
      <Script
        src="https://widget.cloudinary.com/v2.0/global/all.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('✅ Cloudinary widget cargado');
          setCloudinaryReady(true);
        }}
      />
      
      <header className="afiliar-header">
        <Link href="/" className="logo-link">
          <Image 
            src="/icons/logo-turicanje.png" 
            alt="Turicanje" 
            width={150} 
            height={40}
            priority
          />
        </Link>
      </header>

      <main className="afiliar-main">
        <div className="afiliar-container">
          <div className="afiliar-intro">
            <h1>Afilia tu Negocio</h1>
            <p>
              Únete a Turicanje y conecta con miles de clientes que buscan 
              lugares como el tuyo. <strong>Primer año GRATIS.</strong>
            </p>
            <div className="beneficios-lista">
              <div className="beneficio">
                <span className="beneficio-icon">📍</span>
                <span>Aparece en búsquedas locales</span>
              </div>
              <div className="beneficio">
                <span className="beneficio-icon">🔄</span>
                <span>Clientes que regresan con cashback</span>
              </div>
              <div className="beneficio">
                <span className="beneficio-icon">💰</span>
                <span>Sin comisiones por venta</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="afiliar-form">
            <h2>Información del Negocio</h2>

            <div className="form-group">
              <label htmlFor="nombre_negocio">Nombre del Negocio *</label>
              <input
                type="text"
                id="nombre_negocio"
                name="nombre_negocio"
                value={formData.nombre_negocio}
                onChange={handleChange}
                placeholder="Ej: Taquería El Güero"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="categoria">Categoría *</label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona una categoría</option>
                {CATEGORIAS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="direccion">Dirección *</label>
              <input
                ref={inputRef}
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Busca la dirección de tu negocio"
                required
              />
              <small>Escribe y selecciona de las sugerencias de Google</small>
            </div>

            <div className="form-group">
              <label htmlFor="telefono_negocio">Teléfono del Negocio *</label>
              <input
                type="tel"
                id="telefono_negocio"
                name="telefono_negocio"
                value={formData.telefono_negocio}
                onChange={handleChange}
                placeholder="55 1234 5678"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="productos">Productos / Especialidades *</label>
              <textarea
                id="productos"
                name="productos"
                value={formData.productos}
                onChange={handleChange}
                placeholder="Ej: Tacos al pastor, Quesadillas, Tortas, Aguas frescas..."
                rows={3}
                required
              />
              <small>Separa cada producto con coma</small>
            </div>

            <div className="form-group">
              <label htmlFor="horario_texto">Horario *</label>
              <textarea
                id="horario_texto"
                name="horario_texto"
                value={formData.horario_texto}
                onChange={handleChange}
                placeholder="Ej: Lunes a Viernes 9am a 10pm&#10;Sábados 10am a 11pm&#10;Domingos cerrado"
                rows={3}
                required
              />
              <small>Indica los días y horarios de apertura</small>
            </div>

            <div className="form-group">
              <label>Foto de la Fachada *</label>
              {formData.foto_fachada ? (
                <div className="foto-preview">
                  <img src={formData.foto_fachada} alt="Fachada del negocio" />
                  <button 
                    type="button" 
                    className="btn-remove-foto"
                    onClick={handleRemoveFoto}
                  >
                    ✕ Quitar foto
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-upload"
                  onClick={handleUploadFoto}
                  disabled={subiendo || !cloudinaryReady}
                >
                  {subiendo ? '📤 Subiendo...' : '📷 Subir foto'}
                </button>
              )}
              <small>Una foto clara del frente de tu negocio</small>
            </div>

            <h2>Información del Propietario</h2>

            <div className="form-group">
              <label htmlFor="nombre_dueño">Tu Nombre *</label>
              <input
                type="text"
                id="nombre_dueño"
                name="nombre_dueño"
                value={formData.nombre_dueño}
                onChange={handleChange}
                placeholder="Nombre completo"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email_dueño">Tu Email *</label>
              <input
                type="email"
                id="email_dueño"
                name="email_dueño"
                value={formData.email_dueño}
                onChange={handleChange}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="whatsapp_dueño">Tu WhatsApp *</label>
              <input
                type="tel"
                id="whatsapp_dueño"
                name="whatsapp_dueño"
                value={formData.whatsapp_dueño}
                onChange={handleChange}
                placeholder="55 1234 5678"
                required
              />
              <small>Número con WhatsApp para contactarte</small>
            </div>

            <div className="form-group">
              <label>¿Cómo prefieres que te contactemos? *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="preferencia_contacto"
                    value="whatsapp"
                    checked={formData.preferencia_contacto === 'whatsapp'}
                    onChange={handleChange}
                  />
                  <span>📱 WhatsApp</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="preferencia_contacto"
                    value="email"
                    checked={formData.preferencia_contacto === 'email'}
                    onChange={handleChange}
                  />
                  <span>📧 Email</span>
                </label>
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="acepta_terminos"
                  checked={formData.acepta_terminos}
                  onChange={handleChange}
                />
                <span>
                  Acepto los <Link href="/terminos-comercio" target="_blank">términos y condiciones</Link> para comercios
                </span>
              </label>
            </div>

            {mensaje && (
              <div className={`mensaje ${mensaje.tipo}`}>
                {mensaje.texto}
              </div>
            )}

            <button 
              type="submit" 
              className="btn-submit"
              disabled={enviando}
            >
              {enviando ? 'Enviando...' : '🚀 Enviar Solicitud'}
            </button>

            <p className="nota-revision">
              Tu solicitud será revisada en 24-48 horas. Te contactaremos por tu medio preferido.
            </p>
          </form>
        </div>
      </main>

      <footer className="afiliar-footer">
        <p>
          ¿Tienes dudas? <a href="mailto:soporte@turicanje.com">soporte@turicanje.com</a>
        </p>
      </footer>
    </div>
  );
}