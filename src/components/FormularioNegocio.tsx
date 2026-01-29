'use client';

import { useState, useEffect } from 'react';
import './FormularioNegocio.css';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';

console.log('🔍 Cloud Name:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
console.log('🔍 Upload Preset:', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const CATEGORIAS = [
  'Restaurante', 
  'Bar', 
  'Cafetería', 
  'Comida Callejera', 
  'Dark Kitchen', 
  'Actividades', 
  'Eventos', 
  'Hotel', 
  'Spa', 
  'Tours'
];

interface FormularioNegocioProps {
  negocio: any;
  modoCrear: boolean;
  onNegocioCreado: (negocio: any) => void;
  onNegocioActualizado: (negocio: any) => void;
}

export default function FormularioNegocio({ 
  negocio, 
  modoCrear, 
  onNegocioCreado, 
  onNegocioActualizado 
}: FormularioNegocioProps) {

  // ========== ESTADO DEL FORMULARIO ==========
  const [formData, setFormData] = useState({
    // CAMPOS OBLIGATORIOS ✅
    nombre: '',
    categorias: '',
    productos: '',
    direccion: '',
    telefono: '',
    horario: '', // ✅ TEXTO SIMPLE: "Lunes a Viernes 11:00am a 6:00pm"
    
    // Galerías obligatorias
    galeria_lugar: [] as string[],
    galeria_menu: [] as string[],
    
    // CAMPOS OPCIONALES
    whatsapp: '',
    servicios: '', // Campo texto libre para servicios adicionales
    aforo: '',
    descripcion: '',
    redes_sociales: {
      instagram: '',
      facebook: '',
      tiktok: '',
      twitter: ''
    },
    
    // ✅ SERVICIOS CHECKBOXES (columnas individuales en BD)
    pet_friendly: false,
    terraza: false,
    estacionamiento: false,
    area_fumar: false,
    area_infantil: false,
    acepta_reservaciones: false,
    
    // Coordenadas
    latitud: null as number | null,
    longitud: null as number | null
  });

  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    basicos: true,
    contacto: false,
    horarios: false,
    multimedia: false,
    servicios: false,
    redes: false,
    otros: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para upload de imágenes
  const [uploadingFachada, setUploadingFachada] = useState(false);
  const [uploadingMenu, setUploadingMenu] = useState(false);

  // ========== CARGAR DATOS SI ES EDICIÓN ==========
  useEffect(() => {
    if (negocio && !modoCrear) {
      // Extraer horario_texto de hours JSONB
      let horarioTexto = '';
      if (negocio.hours && negocio.hours.horario_texto) {
        horarioTexto = negocio.hours.horario_texto;
      }

      setFormData({
        nombre: negocio.name || '',
        categorias: negocio.category || '',
        productos: Array.isArray(negocio.products) 
          ? negocio.products.join(', ') 
          : (typeof negocio.products === 'string' ? negocio.products : ''),
        direccion: negocio.address || '',
        telefono: negocio.phone || '',
        whatsapp: negocio.whatsapp || '',
        horario: horarioTexto,
        servicios: negocio.servicios || '',
        aforo: negocio.aforo || '',
        descripcion: negocio.descripcion || '',
        galeria_lugar: Array.isArray(negocio.galeria_lugar) ? negocio.galeria_lugar : [],
        galeria_menu: Array.isArray(negocio.galeria_menu) ? negocio.galeria_menu : [],
        redes_sociales: negocio.redes_sociales || {
          instagram: '',
          facebook: '',
          tiktok: '',
          twitter: ''
        },
        pet_friendly: negocio.pet_friendly || false,
        terraza: negocio.terraza || false,
        estacionamiento: negocio.estacionamiento || false,
        area_fumar: negocio.area_fumar || false,
        area_infantil: negocio.area_infantil || false,
        acepta_reservaciones: negocio.acepta_reservaciones || false,
        latitud: negocio.lat || null,
        longitud: negocio.lng || null
      });
    }
  }, [negocio, modoCrear]);

  // ========== FUNCIONES ==========
  const toggleSeccion = (seccion: string) => {
    setSeccionesAbiertas({
      ...seccionesAbiertas,
      [seccion]: !seccionesAbiertas[seccion]
    });
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('redes_sociales.')) {
      const red = name.split('.')[1];
      setFormData({
        ...formData,
        redes_sociales: {
          ...formData.redes_sociales,
          [red]: value
        }
      });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };


  // ✅ Upload de imágenes con Cloudinary Widget (script nativo)
  const handleUploadCloudinary = (campo: 'galeria_lugar' | 'galeria_menu') => {
    if (campo === 'galeria_lugar') setUploadingFachada(true);
    else setUploadingMenu(true);
  
    // @ts-ignore
    if (typeof window !== 'undefined' && window.cloudinary) {
      // @ts-ignore
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: 'djaecf31x',
          uploadPreset: 'ml_default',
          sources: ['local', 'camera'],  // ✅ Solo local y cámara
          multiple: true,
          maxFiles: 10
          // ❌ NO incluir: folder, cropping, ni otros parámetros
        },
        (error: any, result: any) => {
          if (error) {
            console.error('❌ Error upload:', error);
            if (campo === 'galeria_lugar') setUploadingFachada(false);
            else setUploadingMenu(false);
            return;
          }
  
          if (result.event === 'success') {
            const url = result.info.secure_url;
            console.log('✅ Imagen subida:', url);
            setFormData(prev => ({
              ...prev,
              [campo]: [...prev[campo], url]
            }));
          }
  
          if (result.event === 'close') {
            if (campo === 'galeria_lugar') setUploadingFachada(false);
            else setUploadingMenu(false);
          }
        }
      );
  
      widget.open();
    } else {
      console.error('❌ Cloudinary widget no disponible');
      alert('Error: Cloudinary no está cargado');
      if (campo === 'galeria_lugar') setUploadingFachada(false);
      else setUploadingMenu(false);
    }
  };

  const removeImage = (campo: 'galeria_lugar' | 'galeria_menu', index: number) => {
    setFormData({
      ...formData,
      [campo]: formData[campo].filter((_, i) => i !== index)
    });
  };

  // ========== VALIDACIÓN Y ENVÍO ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // VALIDACIONES OBLIGATORIAS
    if (!formData.nombre.trim()) {
      setError('El nombre del negocio es obligatorio');
      return;
    }
    if (!formData.categorias) {
      setError('La categoría es obligatoria');
      return;
    }
    if (!formData.direccion.trim()) {
      setError('La dirección es obligatoria');
      return;
    }
    if (!formData.telefono.trim()) {
      setError('El teléfono es obligatorio');
      return;
    }
    if (!formData.horario.trim()) {
      setError('El horario es obligatorio');
      return;
    }

    // Validar productos (mínimo 5 productos)
    const productosArray = formData.productos
      .split(',')
      .map(p => p.trim())
      .filter(p => p);
    
    if (productosArray.length < 5) {
      setError('Debes ingresar al menos 5 productos/servicios separados por comas');
      return;
    }

    // Validar fotos obligatorias
    if (formData.galeria_lugar.length === 0) {
      setError('Debes subir al menos una foto de la fachada/lugar');
      return;
    }
    if (formData.galeria_menu.length === 0) {
      setError('Debes subir al menos una foto del menú');
      return;
    }

    // PREPARAR DATOS PARA ENVIAR
    const dataToSend = {
      nombre: formData.nombre.trim(),
      categorias: formData.categorias,
      productos: productosArray.join(', '),
      direccion: formData.direccion.trim(),
      telefono: formData.telefono.trim(),
      whatsapp: formData.whatsapp.trim(),
      latitud: formData.latitud,
      longitud: formData.longitud,
      
      // ✅ Horario como JSONB con formato texto
      horario: formData.horario.trim(),
      
      // Servicios y descripción
      servicios: formData.servicios.trim(),
      aforo: formData.aforo.trim(),
      descripcion: formData.descripcion.trim(),
      
      // Galerías (arrays)
      galeria_lugar: formData.galeria_lugar,
      galeria_menu: formData.galeria_menu,
      
      // Redes sociales (JSONB)
      redes_sociales: formData.redes_sociales,
      
      // ✅ Servicios checkboxes (columnas individuales)
      pet_friendly: formData.pet_friendly,
      terraza: formData.terraza,
      estacionamiento: formData.estacionamiento,
      area_fumar: formData.area_fumar,
      area_infantil: formData.area_infantil,
      acepta_reservaciones: formData.acepta_reservaciones
    };

    console.log('📤 Datos a enviar:', dataToSend);

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No estás autenticado. Inicia sesión.');
        setLoading(false);
        return;
      }

      const url = modoCrear
        ? `${API_URL}/api/comercios/crear-negocio`
        : `${API_URL}/api/comercios/actualizar-negocio`;

      const method = modoCrear ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la operación');
      }

      setSuccess(modoCrear ? '✅ Negocio creado exitosamente' : '✅ Negocio actualizado exitosamente');
      
      if (modoCrear) {
        onNegocioCreado(data.negocio);
      } else {
        onNegocioActualizado(data.negocio);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  // ========== RENDER ==========
  return (
    <form className="formulario-negocio" onSubmit={handleSubmit}>
      {/* Script de Cloudinary */}
      <script src="https://upload-widget.cloudinary.com/global/all.js" type="text/javascript" async />

      {error && <div className="mensaje-error">{error}</div>}
      {success && <div className="mensaje-success">{success}</div>}

      {/* ===== SECCIÓN: INFORMACIÓN BÁSICA ===== */}
      <div className="seccion-form">
        <div className="seccion-header" onClick={() => toggleSeccion('basicos')}>
          <h3>
            📌 Información Básica
            <span className="obligatorio-badge">OBLIGATORIO</span>
          </h3>
          <span className="toggle-icon">{seccionesAbiertas.basicos ? '▼' : '▶'}</span>
        </div>
        {seccionesAbiertas.basicos && (
          <div className="seccion-content">
            <div className="form-group">
              <label>Nombre del Negocio <span className="required">*</span></label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Tacos El Güero"
                required
              />
            </div>

            <div className="form-group">
              <label>Categoría <span className="required">*</span></label>
              <select
                name="categorias"
                value={formData.categorias}
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
              <label>Productos / Servicios <span className="required">*</span></label>
              <input
                type="text"
                name="productos"
                value={formData.productos}
                onChange={handleChange}
                placeholder="Ej: tacos, quesadillas, tortas, refrescos, agua (mínimo 5, separados por comas)"
                required
              />
              <small>Escribe al menos 5 productos/servicios separados por comas</small>
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describe tu negocio..."
                rows={4}
              />
            </div>
          </div>
        )}
      </div>

      {/* ===== SECCIÓN: CONTACTO Y UBICACIÓN ===== */}
      <div className="seccion-form">
        <div className="seccion-header" onClick={() => toggleSeccion('contacto')}>
          <h3>
            📞 Contacto y Ubicación
            <span className="obligatorio-badge">OBLIGATORIO</span>
          </h3>
          <span className="toggle-icon">{seccionesAbiertas.contacto ? '▼' : '▶'}</span>
        </div>
        {seccionesAbiertas.contacto && (
          <div className="seccion-content">
            <div className="form-group">
              <label>Dirección <span className="required">*</span></label>
              <GooglePlacesAutocomplete
                key={formData.direccion} // 👈 CLAVE
                onPlaceSelected={(place: { address: string; lat: number | null; lng: number | null }) => {
                 setFormData(prev => ({
                    ...prev,
                    direccion: place.address,
                    latitud: place.lat,
                    longitud: place.lng
                }));
            }}
            defaultValue={formData.direccion}
          />

              <small>Busca y selecciona tu dirección del mapa</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Teléfono <span className="required">*</span></label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="55-1234-5678"
                  required
                />
              </div>

              <div className="form-group">
                <label>WhatsApp</label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="55-1234-5678"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== SECCIÓN: HORARIO ===== */}
      <div className="seccion-form">
        <div className="seccion-header" onClick={() => toggleSeccion('horarios')}>
          <h3>
            🕐 Horario
            <span className="obligatorio-badge">OBLIGATORIO</span>
          </h3>
          <span className="toggle-icon">{seccionesAbiertas.horarios ? '▼' : '▶'}</span>
        </div>
        {seccionesAbiertas.horarios && (
          <div className="seccion-content">
            <div className="form-group">
              <label>Horario de Atención <span className="required">*</span></label>
              <input
                type="text"
                name="horario"
                value={formData.horario}
                onChange={handleChange}
                placeholder="Ej: Lunes a Viernes 11:00am a 6:00pm"
                required
              />
              <small className="texto-horario-ejemplo">
                Ejemplo: "Lunes a Viernes 11:00am a 6:00pm" o "Todos los días 9:00am a 10:00pm"
              </small>
            </div>
          </div>
        )}
      </div>

      {/* ===== SECCIÓN: MULTIMEDIA ===== */}
      <div className="seccion-form">
        <div className="seccion-header" onClick={() => toggleSeccion('multimedia')}>
          <h3>
            📸 Fotos
            <span className="obligatorio-badge">OBLIGATORIO</span>
          </h3>
          <span className="toggle-icon">{seccionesAbiertas.multimedia ? '▼' : '▶'}</span>
        </div>
        {seccionesAbiertas.multimedia && (
          <div className="seccion-content">
            <div className="form-group">
              <label>Fotos de la Fachada/Lugar <span className="required">*</span></label>
              <button
                type="button"
                onClick={() => handleUploadCloudinary('galeria_lugar')}
                className="btn-upload-cloudinary"
                disabled={uploadingFachada}
              >
                {uploadingFachada ? 'Subiendo...' : '📤 Subir Fotos de Fachada'}
              </button>
              <small>Sube fotos de la fachada o interior de tu negocio</small>
              {formData.galeria_lugar.length > 0 && (
                <div className="image-preview-container">
                  {formData.galeria_lugar.map((url, idx) => (
                    <div key={idx} className="image-preview-item">
                      <img src={url} alt={`Lugar ${idx + 1}`} />
                      <button
                        type="button"
                        className="image-preview-remove"
                        onClick={() => removeImage('galeria_lugar', idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Fotos del Menú <span className="required">*</span></label>
              <button
                type="button"
                onClick={() => handleUploadCloudinary('galeria_menu')}
                className="btn-upload-cloudinary"
                disabled={uploadingMenu}
              >
                {uploadingMenu ? 'Subiendo...' : '📤 Subir Fotos del Menú'}
              </button>
              <small>Sube fotos de tus platillos, bebidas o productos</small>
              {formData.galeria_menu.length > 0 && (
                <div className="image-preview-container">
                  {formData.galeria_menu.map((url, idx) => (
                    <div key={idx} className="image-preview-item">
                      <img src={url} alt={`Menú ${idx + 1}`} />
                      <button
                        type="button"
                        className="image-preview-remove"
                        onClick={() => removeImage('galeria_menu', idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== SECCIÓN: SERVICIOS ===== */}
      <div className="seccion-form">
        <div className="seccion-header" onClick={() => toggleSeccion('servicios')}>
          <h3>🛎️ Servicios</h3>
          <span className="toggle-icon">{seccionesAbiertas.servicios ? '▼' : '▶'}</span>
        </div>
        {seccionesAbiertas.servicios && (
          <div className="seccion-content">
            <p className="seccion-info">Selecciona los servicios que ofreces</p>
            <div className="checkboxes-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="pet_friendly"
                  checked={formData.pet_friendly}
                  onChange={handleChange}
                />
                <span>🐶 Pet Friendly</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="terraza"
                  checked={formData.terraza}
                  onChange={handleChange}
                />
                <span>🌿 Terraza</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="estacionamiento"
                  checked={formData.estacionamiento}
                  onChange={handleChange}
                />
                <span>🅿️ Estacionamiento</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="area_fumar"
                  checked={formData.area_fumar}
                  onChange={handleChange}
                />
                <span>🚬 Área para Fumar</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="area_infantil"
                  checked={formData.area_infantil}
                  onChange={handleChange}
                />
                <span>👶 Área Infantil</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="acepta_reservaciones"
                  checked={formData.acepta_reservaciones}
                  onChange={handleChange}
                />
                <span>📅 Acepta Reservaciones</span>
              </label>
            </div>

            <div className="form-group" style={{marginTop: '20px'}}>
              <label>Servicios Adicionales</label>
              <input
                type="text"
                name="servicios"
                value={formData.servicios}
                onChange={handleChange}
                placeholder="Ej: Wi-Fi gratis, música en vivo"
              />
              <small>Otros servicios que ofreces</small>
            </div>
          </div>
        )}
      </div>

      {/* ===== SECCIÓN: REDES SOCIALES ===== */}
      <div className="seccion-form">
        <div className="seccion-header" onClick={() => toggleSeccion('redes')}>
          <h3>🌐 Redes Sociales</h3>
          <span className="toggle-icon">{seccionesAbiertas.redes ? '▼' : '▶'}</span>
        </div>
        {seccionesAbiertas.redes && (
          <div className="seccion-content">
            <div className="form-row">
              <div className="form-group">
                <label>Instagram</label>
                <input
                  type="text"
                  name="redes_sociales.instagram"
                  value={formData.redes_sociales.instagram}
                  onChange={handleChange}
                  placeholder="@tunegocio"
                />
              </div>
              <div className="form-group">
                <label>Facebook</label>
                <input
                  type="text"
                  name="redes_sociales.facebook"
                  value={formData.redes_sociales.facebook}
                  onChange={handleChange}
                  placeholder="facebook.com/tunegocio"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>TikTok</label>
                <input
                  type="text"
                  name="redes_sociales.tiktok"
                  value={formData.redes_sociales.tiktok}
                  onChange={handleChange}
                  placeholder="@tunegocio"
                />
              </div>
              <div className="form-group">
                <label>Twitter / X</label>
                <input
                  type="text"
                  name="redes_sociales.twitter"
                  value={formData.redes_sociales.twitter}
                  onChange={handleChange}
                  placeholder="@tunegocio"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== SECCIÓN: OTROS DATOS ===== */}
      <div className="seccion-form">
        <div className="seccion-header" onClick={() => toggleSeccion('otros')}>
          <h3>ℹ️ Información Adicional</h3>
          <span className="toggle-icon">{seccionesAbiertas.otros ? '▼' : '▶'}</span>
        </div>
        {seccionesAbiertas.otros && (
          <div className="seccion-content">
            <div className="form-group">
              <label>Aforo / Capacidad</label>
              <input
                type="text"
                name="aforo"
                value={formData.aforo}
                onChange={handleChange}
                placeholder="Ej: 50 personas"
              />
            </div>
          </div>
        )}
      </div>

      {/* ===== BOTÓN GUARDAR ===== */}
      <div className="form-actions">
        <button
          type="submit"
          className="btn-guardar"
          disabled={loading}
        >
          {loading ? 'Guardando...' : (modoCrear ? 'Crear Negocio' : 'Guardar Cambios')}
        </button>
      </div>
    </form>
  );
}