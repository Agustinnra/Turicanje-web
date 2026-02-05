'use client';

import { useState } from 'react';
import Link from 'next/link';
import './reportar.css';

const TIPOS_REPORTE = [
  { value: 'cerrado_permanente', label: 'El lugar cerró permanentemente', icon: '🚫' },
  { value: 'cambio_horario', label: 'Cambió de horario', icon: '🕐' },
  { value: 'cambio_menu', label: 'Cambió su menú o precios', icon: '🍽️' },
  { value: 'info_incorrecta', label: 'La información es incorrecta', icon: '❌' },
  { value: 'recomendar_nuevo', label: 'Quiero recomendar un lugar nuevo', icon: '✨' },
  { value: 'otro', label: 'Otro', icon: '💬' },
];

// URL del backend Express
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

export default function ReportarPage() {
  const [formData, setFormData] = useState({
    nombre_negocio: '',
    tipo_reporte: '',
    descripcion: '',
    telefono_reportante: '',
    email_reportante: '',
  });
  const [fotos, setFotos] = useState<File[]>([]);
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRadioChange = (value: string) => {
    setFormData({ ...formData, tipo_reporte: value });
  };

  const handleFotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const espacioDisponible = 5 - fotos.length;
    const nuevasfotos = files.slice(0, espacioDisponible);
    
    if (nuevasfotos.length === 0) return;

    const nuevosArchivos = [...fotos, ...nuevasfotos];
    setFotos(nuevosArchivos);

    // Generar previews
    nuevasfotos.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input para poder subir el mismo archivo
    e.target.value = '';
  };

  const removeFoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
    setFotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar al menos 1 foto
    if (fotos.length === 0) {
      setError('Sube al menos 1 foto para enviar tu reporte');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre_negocio', formData.nombre_negocio);
      formDataToSend.append('tipo_reporte', formData.tipo_reporte);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('telefono_reportante', formData.telefono_reportante);
      formDataToSend.append('email_reportante', formData.email_reportante);
      
      // Agregar todas las fotos
      fotos.forEach(foto => {
        formDataToSend.append('fotos', foto);
      });

      const res = await fetch(`${API_URL}/api/reportes`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!res.ok) {
        throw new Error('Error al enviar el reporte');
      }

      setSubmitted(true);
    } catch (err) {
      setError('Hubo un problema al enviar tu reporte. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de éxito
  if (submitted) {
    return (
      <div className="success-container">
        <div className="success-card">
          <div className="icon">🎉</div>
          <h1>¡Gracias por tu ayuda!</h1>
          <p>Tu reporte nos ayuda a mantener Turicanje actualizado para todos los usuarios.</p>
          <div className="success-buttons">
            <a href="https://wa.me/5215522545216" className="btn-whatsapp">
              📲 Volver al Bot de WhatsApp
            </a>
            <Link href="/" className="btn-home">
              🏠 Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reportar-container">
      <div className="reportar-wrapper">
        {/* Header */}
        <div className="reportar-header">
          <div className="icon">🧠</div>
          <h1>Ayúdanos a mejorar Turicanje</h1>
          <p>Tu reporte ayuda a otros usuarios y a los negocios locales 💛</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="reportar-form">
          {/* Nombre del negocio */}
          <div className="form-group">
            <label>📍 Nombre del lugar <span className="required">*</span></label>
            <input
              type="text"
              name="nombre_negocio"
              value={formData.nombre_negocio}
              onChange={handleChange}
              required
              placeholder="Ej: Tacos El Güero, Café Roma, La Parroquia..."
            />
          </div>

          {/* Tipo de reporte */}
          <div className="form-group">
            <label>🏷️ ¿Qué quieres reportar? <span className="required">*</span></label>
            <div className="radio-options">
              {TIPOS_REPORTE.map((tipo) => (
                <label
                  key={tipo.value}
                  className={`radio-option ${formData.tipo_reporte === tipo.value ? 'selected' : ''}`}
                  onClick={() => handleRadioChange(tipo.value)}
                >
                  <input
                    type="radio"
                    name="tipo_reporte"
                    value={tipo.value}
                    checked={formData.tipo_reporte === tipo.value}
                    onChange={() => handleRadioChange(tipo.value)}
                    required
                  />
                  <span className="icon">{tipo.icon}</span>
                  <span>{tipo.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="form-group">
            <label>📝 Cuéntanos más <span className="required">*</span></label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              required
              placeholder="Ej: Ahora abren de 10am a 8pm en lugar de 9am a 10pm, el menú subió de precio, etc..."
            />
          </div>

          {/* Subir fotos - OBLIGATORIO */}
          <div className="form-group">
            <label>📷 Adjunta fotos <span className="required">*</span> <span className="foto-counter">({fotos.length}/5)</span></label>
            <p className="field-hint">Sube de 1 a 5 fotos del lugar, menú, horarios o evidencia del cambio</p>
            
            {/* Grid de previews */}
            {fotoPreviews.length > 0 && (
              <div className="fotos-grid">
                {fotoPreviews.map((preview, index) => (
                  <div key={index} className="foto-preview-container">
                    <img src={preview} alt={`Foto ${index + 1}`} className="foto-preview" />
                    <button type="button" onClick={() => removeFoto(index)} className="foto-remove">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Botón agregar más fotos */}
            {fotos.length < 5 && (
              <label className="foto-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotosChange}
                  multiple
                  className="foto-input"
                />
                <div className="foto-placeholder">
                  <span className="foto-icon">{fotos.length === 0 ? '📸' : '➕'}</span>
                  <span className="foto-text">{fotos.length === 0 ? 'Toca para subir fotos' : 'Agregar más fotos'}</span>
                  <span className="foto-hint">JPG, PNG hasta 5MB c/u • Máximo 5 fotos</span>
                </div>
              </label>
            )}
          </div>

          {/* Datos de contacto OBLIGATORIOS */}
          <div className="form-group contact-section">
            <label>📲 Tus datos de contacto <span className="required">*</span></label>
            <div className="reward-banner">
              🎁 Si tu reporte es válido, te enviaremos un <strong>código de 10 puntos</strong> que puedes canjear en tu cuenta de Turicanje
            </div>
            <div className="contact-grid">
              <div className="contact-field">
                <input
                  type="tel"
                  name="telefono_reportante"
                  value={formData.telefono_reportante}
                  onChange={handleChange}
                  placeholder="55 1234 5678"
                  required
                />
                <span className="field-label">Tu WhatsApp *</span>
              </div>
              <div className="contact-field">
                <input
                  type="email"
                  name="email_reportante"
                  value={formData.email_reportante}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                />
                <span className="field-label">Tu email *</span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && <div className="error-message">{error}</div>}

          {/* Submit */}
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? (
              <span className="spinner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/>
                </svg>
                Enviando...
              </span>
            ) : (
              '✅ Enviar reporte'
            )}
          </button>

          <p className="form-footer">Toma menos de 1 minuto • Tu info está segura 🔒</p>
        </form>

        {/* Footer */}
        <div className="page-footer">
          <p>¿Prefieres escribirnos directo?</p>
          <a href="https://wa.me/5215522545216">📲 Escríbenos por WhatsApp</a>
        </div>
      </div>
    </div>
  );
}