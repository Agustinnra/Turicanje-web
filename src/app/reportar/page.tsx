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
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRadioChange = (value: string) => {
    setFormData({ ...formData, tipo_reporte: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/reportes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
            <label>📍 Nombre del lugar *</label>
            <input
              type="text"
              name="nombre_negocio"
              value={formData.nombre_negocio}
              onChange={handleChange}
              required
              placeholder="Ej: Tacos El Güero, Café Roma..."
            />
          </div>

          {/* Tipo de reporte */}
          <div className="form-group">
            <label>🏷️ ¿Qué quieres reportar? *</label>
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
            <label>📝 Cuéntanos más (opcional)</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              placeholder="Ej: Ahora abren de 10am a 8pm en lugar de 9am a 10pm..."
            />
          </div>

          {/* Datos de contacto opcionales */}
          <div className="form-group contact-section">
            <p>📧 Si quieres que te avisemos cuando actualicemos la info (opcional):</p>
            <div className="contact-grid">
              <input
                type="tel"
                name="telefono_reportante"
                value={formData.telefono_reportante}
                onChange={handleChange}
                placeholder="Tu WhatsApp"
              />
              <input
                type="email"
                name="email_reportante"
                value={formData.email_reportante}
                onChange={handleChange}
                placeholder="Tu email"
              />
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