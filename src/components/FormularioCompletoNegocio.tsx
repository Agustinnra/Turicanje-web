'use client';

import { useState, useEffect, useCallback } from 'react';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';
import ImageUploadManager from './ImageUploadManager';
import CreadorSelector from './CreadorSelector';
import EditorMenu from './EditorMenu';
import './formulario-completo.css';
import './CreadorSelector.css';



interface Props {
  negocio: any;
  onGuardar: (datos: any) => Promise<void>;
  onCancelar: () => void;
  modoAdmin?: boolean;
}

// ✅ FUNCIÓN: Formatear horario de BD (HH:MM:SS) a input (HH:MM)
const formatearHorarioParaInput = (horario: string | null | undefined): string => {
  if (!horario) return '';
  const str = String(horario).trim();
  if (str.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return str.substring(0, 5); // "09:00:00" → "09:00"
  }
  if (str.match(/^\d{2}:\d{2}$/)) {
    return str;
  }
  return str;
};

// ✅ FUNCIÓN: Formatear horario de input (HH:MM) a BD (HH:MM:SS)
const formatearHorarioParaBD = (horario: string): string => {
  if (!horario) return '';
  const str = String(horario).trim();
  if (str.match(/^\d{2}:\d{2}$/)) {
    return str + ':00'; // "09:00" → "09:00:00"
  }
  return str;
};

// Componente de sección colapsable
const SeccionColapsable = ({ 
  titulo, 
  icono, 
  children, 
  abierta = false 
}: { 
  titulo: string; 
  icono: string; 
  children: React.ReactNode;
  abierta?: boolean;
}) => {
  const [expandida, setExpandida] = useState(abierta);
  
  return (
    <div className={`seccion-colapsable ${expandida ? 'expandida' : ''}`}>
      <button 
        type="button"
        className="seccion-header"
        onClick={() => setExpandida(!expandida)}
      >
        <span className="seccion-titulo">
          <span className="seccion-icono">{icono}</span>
          {titulo}
        </span>
        <span className="seccion-arrow">{expandida ? '▼' : '▶'}</span>
      </button>
      {expandida && (
        <div className="seccion-contenido">
          {children}
        </div>
      )}
    </div>
  );
};

// ✅ COMPONENTE: Input de horario TEXTO con formato 24 horas (HH:MM)
const TimeInput24h = ({ 
  name, 
  value, 
  onChange 
}: { 
  name: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  // Manejar el cambio con validación de formato
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Permitir solo números y ":"
    val = val.replace(/[^0-9:]/g, '');
    
    // Auto-insertar ":" después de 2 dígitos
    if (val.length === 2 && !val.includes(':')) {
      val = val + ':';
    }
    
    // Limitar a 5 caracteres (HH:MM)
    if (val.length > 5) {
      val = val.substring(0, 5);
    }
    
    // Validar que las horas sean 00-23 y minutos 00-59
    if (val.length === 5) {
      const [hh, mm] = val.split(':');
      const hours = parseInt(hh, 10);
      const mins = parseInt(mm, 10);
      
      if (hours > 23) val = '23:' + mm;
      if (mins > 59) val = hh + ':59';
    }
    
    // Crear evento sintético con el valor formateado
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: name,
        value: val
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  };

  return (
    <input 
      type="text"
      inputMode="numeric"
      name={name} 
      value={value} 
      onChange={handleTimeChange}
      className="time-input-24h"
      placeholder="HH:MM"
      maxLength={5}
      pattern="[0-2][0-9]:[0-5][0-9]"
    />
  );
};

export default function FormularioCompletoNegocio({ negocio, onGuardar, onCancelar, modoAdmin = false }: Props) {
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [creadorId, setCreadorId] = useState<number | null>(null);
  
  // Estado del formulario con TODOS los campos
  const [form, setForm] = useState({
    // Información Básica
    name: '',
    name_en: '',
    category: '',
    products: '',
    caracteristicas: '', // ✅ NUEVO: Características destacadas (max 7)
    descripcion: '',
    
    // Ubicación
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    lat: '',
    lng: '',
    timezone: '',
    zona: '',
    
    // Contacto
    phone: '',
    whatsapp: '',
    url_order: '',
    url_extra: '',
    url_reservaciones: '',
    
    // Redes Sociales (columnas individuales)
    instagram: '',
    facebook: '',
    tiktok: '',
    x_twitter: '',
    youtube: '',
    
    // Horarios - Texto general
    hours: '',
    
    // Horarios - Por día
    mon_open: '',
    mon_close: '',
    tue_open: '',
    tue_close: '',
    wed_open: '',
    wed_close: '',
    thu_open: '',
    thu_close: '',
    fri_open: '',
    fri_close: '',
    sat_open: '',
    sat_close: '',
    sun_open: '',
    sun_close: '',
    
    // Comercial
    afiliado: false,
    cashback: false,
    cashback_pct: '',
    delivery: false,
    priority: '',
    is_active: true,
    
    // Suscripción (solo admin)
    plan_tipo: 'basico',
    plan_activo: true,
    plan_fecha_inicio: '',
    plan_fecha_vencimiento: '',
    
    // Imágenes
    imagen_url: '',
    galeria_lugar: '',
    galeria_menu: '',
    instagram_embed: '',
    
    // Amenidades
    area_fumar: false,
    terraza: false,
    area_infantil: false,
    pet_friendly: false,
    estacionamiento: false,
    acepta_reservaciones: false,
    
    // Extras
    promociones: '',
    eventos_proximos: '',
    opciones_menu: '',
    
    // Interno
    identificador_promotor: '',
    servicios: '',
    aforo: '',
    demo: false,
    comentarios: '',
    whats_for_delivery_same: '',
  });

  // ✅ Estado para contar características
  const [caracteristicasCount, setCaracteristicasCount] = useState(0);
  const MAX_CARACTERISTICAS = 7;

  // ✅ Extraer características de categories (excluyendo products)
  const extraerCaracteristicas = (categories: any, products: any): string => {
    if (!categories) return '';
    
    const categoriesArray = Array.isArray(categories) 
      ? categories 
      : String(categories).split(/[;,]/).map(c => c.trim()).filter(c => c);
    
    const productsArray = Array.isArray(products) 
      ? products 
      : String(products || '').split(/[;,]/).map(p => p.trim().toLowerCase()).filter(p => p);
    
    // Filtrar: categories que NO están en products
    const soloCaracteristicas = categoriesArray.filter(
      cat => !productsArray.includes(cat.toLowerCase())
    );
    
    return soloCaracteristicas.join('; ');
  };

  // Cargar datos del negocio al montar
  useEffect(() => {
    if (negocio) {
      const caracteristicasExtraidas = extraerCaracteristicas(negocio.categories, negocio.products);
      
      setForm({
        // Información Básica
        name: negocio.name || '',
        name_en: negocio.name_en || '',
        category: negocio.category || '',
        products: Array.isArray(negocio.products) ? negocio.products.join('; ') : (negocio.products || ''),
        caracteristicas: caracteristicasExtraidas, // ✅ Cargar características
        descripcion: negocio.descripcion || '',
        
        // Ubicación
        address: negocio.address || '',
        neighborhood: negocio.neighborhood || '',
        city: negocio.city || '',
        state: negocio.state || '',
        country: negocio.country || '',
        postal_code: negocio.postal_code || '',
        lat: negocio.lat?.toString() || '',
        lng: negocio.lng?.toString() || '',
        timezone: negocio.timezone || 'America/Mexico_City',
        zona: negocio.zona || '',
        
        // Contacto
        phone: negocio.phone || '',
        whatsapp: negocio.whatsapp || '',
        url_order: negocio.url_order || '',
        url_extra: negocio.url_extra || '',
        url_reservaciones: negocio.url_reservaciones || '',
        
        // Redes Sociales (columnas individuales)
        instagram: negocio.instagram || '',
        facebook: negocio.facebook || '',
        tiktok: negocio.tiktok || '',
        x_twitter: negocio.x_twitter || '',
        youtube: negocio.youtube || '',
        
        // Horarios
        hours: negocio.hours || '',
        mon_open: formatearHorarioParaInput(negocio.mon_open),
        mon_close: formatearHorarioParaInput(negocio.mon_close),
        tue_open: formatearHorarioParaInput(negocio.tue_open),
        tue_close: formatearHorarioParaInput(negocio.tue_close),
        wed_open: formatearHorarioParaInput(negocio.wed_open),
        wed_close: formatearHorarioParaInput(negocio.wed_close),
        thu_open: formatearHorarioParaInput(negocio.thu_open),
        thu_close: formatearHorarioParaInput(negocio.thu_close),
        fri_open: formatearHorarioParaInput(negocio.fri_open),
        fri_close: formatearHorarioParaInput(negocio.fri_close),
        sat_open: formatearHorarioParaInput(negocio.sat_open),
        sat_close: formatearHorarioParaInput(negocio.sat_close),
        sun_open: formatearHorarioParaInput(negocio.sun_open),
        sun_close: formatearHorarioParaInput(negocio.sun_close),
        
        // Comercial
        afiliado: negocio.afiliado || false,
        cashback: negocio.cashback || false,
        cashback_pct: negocio.cashback_pct?.toString() || '',
        delivery: negocio.delivery || false,
        priority: negocio.priority?.toString() || '',
        is_active: negocio.is_active !== false,
        
        // Suscripción (solo admin)
        plan_tipo: negocio.plan_tipo || 'basico',
        plan_activo: negocio.plan_activo !== false,
        plan_fecha_inicio: negocio.plan_fecha_inicio || '',
        plan_fecha_vencimiento: negocio.plan_fecha_vencimiento || '',
        
        // Imágenes
        imagen_url: negocio.imagen_url || '',
        galeria_lugar: Array.isArray(negocio.galeria_lugar) ? negocio.galeria_lugar.join('\n') : (negocio.galeria_lugar || ''),
        galeria_menu: Array.isArray(negocio.galeria_menu) ? negocio.galeria_menu.join('\n') : (negocio.galeria_menu || ''),
        instagram_embed: negocio.instagram_embed || '',
        
        // Amenidades
        area_fumar: negocio.area_fumar || false,
        terraza: negocio.terraza || false,
        area_infantil: negocio.area_infantil || false,
        pet_friendly: negocio.pet_friendly || false,
        estacionamiento: negocio.estacionamiento || false,
        acepta_reservaciones: negocio.acepta_reservaciones || false,
        
        // Extras
        promociones: Array.isArray(negocio.promociones) ? negocio.promociones.join('\n') : (negocio.promociones || ''),
        eventos_proximos: Array.isArray(negocio.eventos_proximos) ? negocio.eventos_proximos.join('\n') : (negocio.eventos_proximos || ''),
        opciones_menu: Array.isArray(negocio.opciones_menu) ? negocio.opciones_menu.join('; ') : (negocio.opciones_menu || ''),
        
        // Interno
        identificador_promotor: negocio.identificador_promotor || '',
        servicios: negocio.servicios || '',
        aforo: negocio.aforo || '',
        demo: negocio.demo || false,
        comentarios: negocio.comentarios || '',
        whats_for_delivery_same: negocio.whats_for_delivery_same || '',
      });

      // Actualizar contador
      const count = caracteristicasExtraidas 
        ? caracteristicasExtraidas.split(/[;,]/).filter(c => c.trim()).length 
        : 0;
      setCaracteristicasCount(count);
      
      // Cargar creador_id si existe
      setCreadorId(negocio.creador_id || null);
    }
  }, [negocio]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Handler especial para características (limita a 7)
  const handleCaracteristicasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const items = value.split(/[;,]/).filter(c => c.trim());
    
    if (items.length <= MAX_CARACTERISTICAS) {
      setForm(prev => ({ ...prev, caracteristicas: value }));
      setCaracteristicasCount(items.length);
    }
    // Si intenta agregar más de 7, no actualiza el valor
  };

  // ✅ NUEVO: Handler para Google Places Autocomplete
  const handlePlaceSelected = useCallback((place: {
    address: string;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    lat: number | null;
    lng: number | null;
    timezone: string;
  }) => {
    console.log('📍 Lugar seleccionado en formulario:', place);
    setForm(prev => ({
      ...prev,
      address: place.address,
      neighborhood: place.neighborhood || prev.neighborhood,
      city: place.city || prev.city,
      state: place.state || prev.state,
      country: place.country || prev.country,
      postal_code: place.postal_code || prev.postal_code,
      lat: place.lat?.toString() || prev.lat,
      lng: place.lng?.toString() || prev.lng,
      timezone: place.timezone || prev.timezone
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      // ✅ Preparar products array
      const productsArray = form.products 
        ? form.products.split(/[;,]/).map(p => p.trim()).filter(p => p) 
        : [];
      
      // ✅ Preparar características array
      const caracteristicasArray = form.caracteristicas 
        ? form.caracteristicas.split(/[;,]/).map(c => c.trim()).filter(c => c) 
        : [];
      
      // ✅ COMBINAR products + características para categories
      const categoriesArray = [...productsArray, ...caracteristicasArray];

      // Preparar datos para enviar
      const datosParaEnviar = {
        ...form,
        // ✅ Sincronizar name_en con name automáticamente
        name_en: form.name,
        // ✅ Convertir horarios a formato BD (HH:MM:SS)
        mon_open: formatearHorarioParaBD(form.mon_open),
        mon_close: formatearHorarioParaBD(form.mon_close),
        tue_open: formatearHorarioParaBD(form.tue_open),
        tue_close: formatearHorarioParaBD(form.tue_close),
        wed_open: formatearHorarioParaBD(form.wed_open),
        wed_close: formatearHorarioParaBD(form.wed_close),
        thu_open: formatearHorarioParaBD(form.thu_open),
        thu_close: formatearHorarioParaBD(form.thu_close),
        fri_open: formatearHorarioParaBD(form.fri_open),
        fri_close: formatearHorarioParaBD(form.fri_close),
        sat_open: formatearHorarioParaBD(form.sat_open),
        sat_close: formatearHorarioParaBD(form.sat_close),
        sun_open: formatearHorarioParaBD(form.sun_open),
        sun_close: formatearHorarioParaBD(form.sun_close),
        // ✅ products se mantiene igual (solo productos)
        products: productsArray,
        // ✅ categories = products + características (para el bot)
        categories: categoriesArray,
        // Convertir strings a arrays donde corresponda (maneja si ya es array)
        galeria_lugar: Array.isArray(form.galeria_lugar) 
          ? form.galeria_lugar 
          : (form.galeria_lugar ? form.galeria_lugar.split('\n').map(u => u.trim()).filter(u => u) : []),
        galeria_menu: Array.isArray(form.galeria_menu) 
          ? form.galeria_menu 
          : (form.galeria_menu ? form.galeria_menu.split('\n').map(u => u.trim()).filter(u => u) : []),
        promociones: Array.isArray(form.promociones) 
          ? form.promociones 
          : (form.promociones ? form.promociones.split('\n').map(p => p.trim()).filter(p => p) : []),
        eventos_proximos: Array.isArray(form.eventos_proximos) 
          ? form.eventos_proximos 
          : (form.eventos_proximos ? form.eventos_proximos.split('\n').map(e => e.trim()).filter(e => e) : []),
        opciones_menu: Array.isArray(form.opciones_menu) 
          ? form.opciones_menu 
          : (form.opciones_menu ? form.opciones_menu.split(/[;,]/).map(o => o.trim()).filter(o => o) : []),
        // Convertir números
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        priority: form.priority ? parseInt(form.priority) : null,
        cashback_pct: form.cashback_pct ? parseFloat(form.cashback_pct) : null,
        // Redes sociales como columnas individuales
        instagram: form.instagram || null,
        facebook: form.facebook || null,
        tiktok: form.tiktok || null,
        x_twitter: form.x_twitter || null,
        youtube: form.youtube || null,
        // Campos de suscripción (solo si es admin)
        plan_tipo: form.plan_tipo || 'basico',
        plan_activo: form.plan_activo,
        plan_fecha_inicio: form.plan_fecha_inicio || null,
        plan_fecha_vencimiento: form.plan_fecha_vencimiento || null,
      };

      // ✅ Eliminar el campo 'caracteristicas' antes de enviar (no existe en BD)
      delete (datosParaEnviar as any).caracteristicas;

      // ✅ Agregar creador_id
      (datosParaEnviar as any).creador_id = creadorId;

      await onGuardar(datosParaEnviar);
      setMensaje({ tipo: 'exito', texto: '✅ Negocio guardado correctamente' });
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setGuardando(false);
    }
  };

  const categorias = [
    'Restaurante', 'Cafetería', 'Bar', 'Puesto Fijo', 'Puesto Ambulante',
    'Dark Kitchen', 'Comida Callejera', 'Panadería', 'Pastelería', 
    'Heladería', 'Marisquería', 'Taquería', 'Pizzería', 'Otro'
  ];

  return (
    <form onSubmit={handleSubmit} className="formulario-completo">
      {/* Header con ID y nombre */}
      <div className="formulario-header">
        <div className="negocio-id-badge">
          <span className="id-label">ID:</span>
          <span className="id-value">{negocio?.id || 'Nuevo'}</span>
        </div>
        <h2 className="negocio-nombre">{form.name || 'Sin nombre'}</h2>
      </div>

      {mensaje && (
        <div className={`mensaje-formulario ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
      {/* ============================================================ */}
      <SeccionColapsable titulo="Información Básica" icono="📋" abierta={true}>
        <div className="campo-grid">
          <div className="campo">
            <label>Nombre del Negocio *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nombre del negocio"
              required
            />
          </div>
          
          <div className="campo">
            <label>Categoría</label>
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="">Seleccionar categoría</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="campo campo-full">
            <label>Productos / Tags (separados por ; o ,)</label>
            <input
              type="text"
              name="products"
              value={form.products}
              onChange={handleChange}
              placeholder="tacos; tortas; quesadillas; jugos"
            />
            <span className="campo-ayuda">Estos aparecerán visibles en tu página</span>
          </div>
          
          {/* ✅ NUEVO CAMPO: Características destacadas */}
          <div className="campo campo-full">
            <label>
              Características destacadas 
              <span className={`contador-caracteristicas ${caracteristicasCount >= MAX_CARACTERISTICAS ? 'limite' : ''}`}>
                ({caracteristicasCount}/{MAX_CARACTERISTICAS})
              </span>
            </label>
            <input
              type="text"
              name="caracteristicas"
              value={form.caracteristicas}
              onChange={handleCaracteristicasChange}
              placeholder="barato; cerca del metro; abierto tarde; familiar; para llevar"
              className={caracteristicasCount >= MAX_CARACTERISTICAS ? 'input-limite' : ''}
            />
            <span className="campo-ayuda">
              💡 Palabras clave que ayudan a encontrarte (máx. 7). Ej: "económico", "romántico", "vegano"
            </span>
          </div>
          
          <div className="campo campo-full">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Descripción del negocio..."
              rows={3}
            />
          </div>
        </div>
      </SeccionColapsable>

      {/* ============================================================ */}
      {/* SECCIÓN 2: UBICACIÓN */}
      {/* ============================================================ */}
      <SeccionColapsable titulo="Ubicación" icono="📍">
        <div className="campo-grid">
          <div className="campo campo-full">
            <label>Dirección Completa 🔍</label>
            <GooglePlacesAutocomplete
              onPlaceSelected={handlePlaceSelected}
              defaultValue={form.address}
              placeholder="Escribe la dirección y selecciona de la lista..."
              restrictToCountry="mx"
            />
            <span className="campo-ayuda">
              💡 Al seleccionar una dirección, se llenarán automáticamente los demás campos
            </span>
          </div>
          
          <div className="campo">
            <label>Colonia / Barrio</label>
            <input
              type="text"
              name="neighborhood"
              value={form.neighborhood}
              onChange={handleChange}
              placeholder="Ej: Narvarte Poniente"
            />
          </div>
          
          <div className="campo">
            <label>Ciudad</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Ej: Ciudad de México"
            />
          </div>
          
          <div className="campo">
            <label>Estado</label>
            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="Ej: CDMX"
            />
          </div>
          
          <div className="campo">
            <label>País</label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder="Ej: Mexico"
            />
          </div>
          
          <div className="campo">
            <label>Código Postal</label>
            <input
              type="text"
              name="postal_code"
              value={form.postal_code}
              onChange={handleChange}
              placeholder="Ej: 03020"
            />
          </div>
          
          <div className="campo">
            <label>Zona</label>
            <input
              type="text"
              name="zona"
              value={form.zona}
              onChange={handleChange}
              placeholder="Ej: Sur"
            />
          </div>
          
          <div className="campo">
            <label>Latitud</label>
            <input
              type="text"
              name="lat"
              value={form.lat}
              onChange={handleChange}
              placeholder="19.4326"
              readOnly
              style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
            />
          </div>
          
          <div className="campo">
            <label>Longitud</label>
            <input
              type="text"
              name="lng"
              value={form.lng}
              onChange={handleChange}
              placeholder="-99.1332"
              readOnly
              style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
            />
          </div>
          
          <div className="campo">
            <label>Zona Horaria</label>
            <select name="timezone" value={form.timezone} onChange={handleChange}>
              <option value="America/Mexico_City">Ciudad de México (CST)</option>
              <option value="America/Cancun">Cancún (EST)</option>
              <option value="America/Tijuana">Tijuana (PST)</option>
              <option value="America/Hermosillo">Hermosillo (MST)</option>
              <option value="America/Chihuahua">Chihuahua (MST)</option>
            </select>
          </div>
        </div>
      </SeccionColapsable>

      {/* ============================================================ */}
      {/* SECCIÓN 3: CONTACTO */}
      {/* ============================================================ */}
      <SeccionColapsable titulo="Contacto y Enlaces" icono="📞">
        <div className="campo-grid">
          <div className="campo">
            <label>Teléfono</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="55 1234 5678"
            />
          </div>
          
          <div className="campo">
            <label>WhatsApp</label>
            <input
              type="tel"
              name="whatsapp"
              value={form.whatsapp}
              onChange={handleChange}
              placeholder="5512345678"
            />
          </div>
          
          <div className="campo">
            <label>Pedidos</label>
            <input
              type="url"
              name="url_order"
              value={form.url_order}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
          
          <div className="campo">
            <label>URL Extra</label>
            <input
              type="url"
              name="url_extra"
              value={form.url_extra}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
          
          {/* REDES SOCIALES - CAMPOS INDIVIDUALES */}
          <div className="campo">
            <label>📸 Instagram</label>
            <input
              type="text"
              name="instagram"
              value={form.instagram}
              onChange={handleChange}
              placeholder="@usuario o URL"
            />
          </div>
          
          <div className="campo">
            <label>📘 Facebook</label>
            <input
              type="text"
              name="facebook"
              value={form.facebook}
              onChange={handleChange}
              placeholder="URL o nombre de página"
            />
          </div>
          
          <div className="campo">
            <label>🎵 TikTok</label>
            <input
              type="text"
              name="tiktok"
              value={form.tiktok}
              onChange={handleChange}
              placeholder="@usuario o URL"
            />
          </div>
          
          <div className="campo">
            <label>𝕏 Twitter / X</label>
            <input
              type="text"
              name="x_twitter"
              value={form.x_twitter}
              onChange={handleChange}
              placeholder="@usuario o URL"
            />
          </div>
          
          <div className="campo">
            <label>▶️ YouTube</label>
            <input
              type="text"
              name="youtube"
              value={form.youtube}
              onChange={handleChange}
              placeholder="URL del canal"
            />
          </div>
        </div>
      </SeccionColapsable>

      {/* ============================================================ */}
      {/* SECCIÓN 4: HORARIOS */}
      {/* ============================================================ */}
      <SeccionColapsable titulo="Horarios" icono="🕐">
        <div className="campo-grid">
          <div className="campo campo-full">
            <label>Horario General (texto libre)</label>
            <textarea
              name="hours"
              value={form.hours}
              onChange={handleChange}
              placeholder="LUNES A VIERNES 9:00 A 21:00 HRS, SÁBADOS 10:00 A 18:00 HRS"
              rows={2}
            />
          </div>
          
          <div className="horarios-grid">
            <p className="horarios-instruccion">
              ⏰ Horarios en formato 24 horas (ej: 09:00 = 9am, 21:00 = 9pm)
            </p>
            <div className="dia-horario">
              <span className="dia-label">Lunes</span>
              <TimeInput24h name="mon_open" value={form.mon_open} onChange={handleChange} />
              <span>a</span>
              <TimeInput24h name="mon_close" value={form.mon_close} onChange={handleChange} />
            </div>
            
            <div className="dia-horario">
              <span className="dia-label">Martes</span>
              <TimeInput24h name="tue_open" value={form.tue_open} onChange={handleChange} />
              <span>a</span>
              <TimeInput24h name="tue_close" value={form.tue_close} onChange={handleChange} />
            </div>
            
            <div className="dia-horario">
              <span className="dia-label">Miércoles</span>
              <TimeInput24h name="wed_open" value={form.wed_open} onChange={handleChange} />
              <span>a</span>
              <TimeInput24h name="wed_close" value={form.wed_close} onChange={handleChange} />
            </div>
            
            <div className="dia-horario">
              <span className="dia-label">Jueves</span>
              <TimeInput24h name="thu_open" value={form.thu_open} onChange={handleChange} />
              <span>a</span>
              <TimeInput24h name="thu_close" value={form.thu_close} onChange={handleChange} />
            </div>
            
            <div className="dia-horario">
              <span className="dia-label">Viernes</span>
              <TimeInput24h name="fri_open" value={form.fri_open} onChange={handleChange} />
              <span>a</span>
              <TimeInput24h name="fri_close" value={form.fri_close} onChange={handleChange} />
            </div>
            
            <div className="dia-horario">
              <span className="dia-label">Sábado</span>
              <TimeInput24h name="sat_open" value={form.sat_open} onChange={handleChange} />
              <span>a</span>
              <TimeInput24h name="sat_close" value={form.sat_close} onChange={handleChange} />
            </div>
            
            <div className="dia-horario">
              <span className="dia-label">Domingo</span>
              <TimeInput24h name="sun_open" value={form.sun_open} onChange={handleChange} />
              <span>a</span>
              <TimeInput24h name="sun_close" value={form.sun_close} onChange={handleChange} />
            </div>
          </div>
        </div>
      </SeccionColapsable>

      {/* ============================================================ */}
      {/* SECCIÓN 5: COMERCIAL */}
      {/* ============================================================ */}
      <SeccionColapsable titulo="Configuración Comercial" icono="💰">
        <div className="campo-grid">
          <div className="campo-checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              <span className="checkbox-text">✅ Activo</span>
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="afiliado"
                checked={form.afiliado}
                onChange={handleChange}
              />
              <span className="checkbox-text">🤝 Afiliado</span>
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="cashback"
                checked={form.cashback}
                onChange={handleChange}
              />
              <span className="checkbox-text">💵 Cashback</span>
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="delivery"
                checked={form.delivery}
                onChange={handleChange}
              />
              <span className="checkbox-text">🛵 Delivery</span>
            </label>
          </div>
          
          <div className="campo">
            <label>% Cashback</label>
            <input
              type="number"
              name="cashback_pct"
              value={form.cashback_pct}
              onChange={handleChange}
              placeholder="0"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
          
          <div className="campo">
            <label>Prioridad (1-10)</label>
            <input
              type="number"
              name="priority"
              value={form.priority}
              onChange={handleChange}
              placeholder="5"
              min="1"
              max="10"
            />
          </div>

          {/* Sección de Suscripción - Solo visible para admin */}
          {modoAdmin && (
            <>
              <div className="campo-full" style={{ 
                marginTop: '20px', 
                padding: '16px', 
                background: '#f0f9ff', 
                borderRadius: '8px',
                border: '1px solid #bae6fd'
              }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#0369a1' }}>📋 Suscripción del Comercio</h4>
                
                <div className="campo-grid">
                  <div className="campo">
                    <label>Tipo de Plan</label>
                    <select
                      name="plan_tipo"
                      value={form.plan_tipo}
                      onChange={handleChange}
                    >
                      <option value="basico">Básico</option>
                      <option value="pro">Pro (con Cashback)</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  
                  <div className="campo">
                    <label className="checkbox-label" style={{ marginTop: '24px' }}>
                      <input
                        type="checkbox"
                        name="plan_activo"
                        checked={form.plan_activo}
                        onChange={handleChange}
                      />
                      <span className="checkbox-text">✅ Plan Activo</span>
                    </label>
                  </div>
                  
                  <div className="campo">
                    <label>Fecha de Inicio</label>
                    <input
                      type="date"
                      name="plan_fecha_inicio"
                      value={form.plan_fecha_inicio}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="campo">
                    <label>Fecha de Vencimiento</label>
                    <input
                      type="date"
                      name="plan_fecha_vencimiento"
                      value={form.plan_fecha_vencimiento}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                {form.plan_fecha_vencimiento && new Date(form.plan_fecha_vencimiento) < new Date() && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '10px', 
                    background: '#fef2f2', 
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    color: '#dc2626',
                    fontSize: '14px'
                  }}>
                    ⚠️ <strong>Plan vencido.</strong> Este comercio no aparecerá en búsquedas hasta que renueve.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SeccionColapsable>

      {/* ============================================================ */}
      {/* SECCIÓN 6: IMÁGENES */}
      {/* ============================================================ */}
      <SeccionColapsable titulo="Imágenes y Multimedia" icono="🖼️">
        <div className="imagenes-section">
          {/* Foto de Fachada (Principal) */}
          <ImageUploadManager
            label="📸 Foto de Fachada"
            currentImages={form.imagen_url ? [form.imagen_url] : []}
            onImagesChange={(images) => setForm({ ...form, imagen_url: images[0] || '' })}
            multiple={false}
          />
          <p className="campo-hint">La foto principal que verán los usuarios. Debe mostrar claramente la entrada de tu negocio.</p>
          
          {/* Galería del Lugar */}
          <ImageUploadManager
            label="🏠 Fotos de tu local (interior y exterior)"
            currentImages={form.galeria_lugar ? form.galeria_lugar.split('\n').filter(Boolean) : []}
            onImagesChange={(images) => setForm({ ...form, galeria_lugar: images.join('\n') })}
            multiple={true}
            maxImages={10}
          />
          <p className="campo-hint">Sube fotos bonitas del interior, terraza, decoración, ambiente. Máximo 10 fotos.</p>
          
          {/* Galería del Menú */}
          <ImageUploadManager
            label="🍽️ Sube todas las fotos de tu menú"
            currentImages={form.galeria_menu ? form.galeria_menu.split('\n').filter(Boolean) : []}
            onImagesChange={(images) => setForm({ ...form, galeria_menu: images.join('\n') })}
            multiple={true}
            maxImages={15}
          />
          <p className="campo-hint">Fotos de tu menú completo: carta, platillos, bebidas, postres. Máximo 15 fotos.</p>
          
          {/* Instagram Embed */}
          <div className="campo campo-full" style={{ marginTop: '20px' }}>
            <label>📱 Embed Code (opcional)</label>
            <textarea
              name="instagram_embed"
              value={form.instagram_embed}
              onChange={handleChange}
              placeholder="Pega aquí el código embed de tu mejor post..."
              rows={2}
            />
            <p className="campo-hint">Copia el código embed desde Instagram para mostrar un post destacado.</p>
          </div>
        </div>
      </SeccionColapsable>
      {/* ============================================================ */}
      {/* SECCIÓN 6.5: MENÚ DEL NEGOCIO */}
      {/* ============================================================ */}
      {negocio?.id && (
        <SeccionColapsable titulo="Menú del Negocio" icono="🍽️">
          <div className="menu-section">
            <p className="campo-hint" style={{ marginBottom: '16px' }}>
              Los productos se extraen automáticamente cuando subes fotos de tu menú arriba. 
              Aquí puedes revisar, editar o agregar productos manualmente.
            </p>
            <EditorMenu placeId={negocio.id} modoAdmin={modoAdmin} />
          </div>
        </SeccionColapsable>
      )}

      {/* ============================================================ */}
      {/* SECCIÓN 7: AMENIDADES */}
      {/* ============================================================ */}
      <SeccionColapsable titulo="Amenidades" icono="🏷️">
        <div className="amenidades-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="area_fumar"
              checked={form.area_fumar}
              onChange={handleChange}
            />
            <span className="checkbox-text">🚬 Área de Fumar</span>
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="terraza"
              checked={form.terraza}
              onChange={handleChange}
            />
            <span className="checkbox-text">🌳 Terraza</span>
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="area_infantil"
              checked={form.area_infantil}
              onChange={handleChange}
            />
            <span className="checkbox-text">👶 Área Infantil</span>
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="pet_friendly"
              checked={form.pet_friendly}
              onChange={handleChange}
            />
            <span className="checkbox-text">🐕 Pet Friendly</span>
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="estacionamiento"
              checked={form.estacionamiento}
              onChange={handleChange}
            />
            <span className="checkbox-text">🅿️ Estacionamiento</span>
          </label>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="acepta_reservaciones"
              checked={form.acepta_reservaciones}
              onChange={handleChange}
            />
            <span className="checkbox-text">📅 Acepta Reservaciones</span>
          </label>
        </div>
      </SeccionColapsable>

      {/* ============================================================ */}
      {/* SECCIÓN 8: EXTRAS */}
      {/* ============================================================ */}
      <SeccionColapsable titulo="Promociones y Extras" icono="🎁">
        <div className="campo-grid">
          <div className="campo campo-full">
            <label>Promociones (una por línea)</label>
            <textarea
              name="promociones"
              value={form.promociones}
              onChange={handleChange}
              placeholder="2x1 en tacos los martes&#10;Postre gratis en tu cumpleaños"
              rows={3}
            />
          </div>
          
          <div className="campo campo-full">
            <label>Eventos Próximos (uno por línea)</label>
            <textarea
              name="eventos_proximos"
              value={form.eventos_proximos}
              onChange={handleChange}
              placeholder="Música en vivo - Viernes 8pm&#10;Noche de trivia - Sábado 7pm"
              rows={3}
            />
          </div>
          
          <div className="campo campo-full">
            <label>Opciones de Menú (separadas por ; o ,)</label>
            <input
              type="text"
              name="opciones_menu"
              value={form.opciones_menu}
              onChange={handleChange}
              placeholder="Vegano; Sin gluten; Orgánico"
            />
          </div>
        </div>
      </SeccionColapsable>

      {/* ============================================================ */}
      {/* SECCIÓN 9: INTERNO / ADMIN */}
      {/* ============================================================ */}
      <SeccionColapsable titulo="Información Interna" icono="📝">
        <div className="campo-grid">
          {/* ✅ SELECTOR DE CREADOR */}
          <div className="campo campo-full">
            <CreadorSelector
              value={creadorId}
              onChange={(id) => setCreadorId(id)}
            />
          </div>
        
          <div className="campo">
            <label>Servicios</label>
            <input
              type="text"
              name="servicios"
              value={form.servicios}
              onChange={handleChange}
              placeholder="Servicios que ofrece"
            />
          </div>
          
          <div className="campo">
            <label>Aforo</label>
            <input
              type="text"
              name="aforo"
              value={form.aforo}
              onChange={handleChange}
              placeholder="Capacidad"
            />
          </div>
          
        </div>
      </SeccionColapsable>

      {/* ============================================================ */}
      {/* BOTONES DE ACCIÓN */}
      {/* ============================================================ */}
      <div className="formulario-acciones">
        <button
          type="button"
          className="btn-cancelar"
          onClick={onCancelar}
          disabled={guardando}
        >
          ← Cancelar
        </button>
        
        <button
          type="submit"
          className="btn-guardar"
          disabled={guardando}
        >
          {guardando ? '⏳ Guardando...' : '💾 Guardar Cambios'}
        </button>
      </div>
    </form>
  );
}