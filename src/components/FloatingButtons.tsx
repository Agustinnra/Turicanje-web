'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import './floating-buttons.css';

// Importar MapaUsuario dinámicamente para evitar SSR issues
const MapaUsuario = dynamic(() => import('@/components/MapaUsuario'), { 
  ssr: false,
  loading: () => <div className="mapa-loading">🗺️ Cargando mapa...</div>
});

interface FloatingButtonsProps {
  whatsappNumber?: string;
  whatsappMessage?: string;
}

export default function FloatingButtons({
  whatsappNumber = '525522545216', // Número del bot Turicanje
  whatsappMessage = 'Hola! ¿Qué me recomiendas para comer?',
}: FloatingButtonsProps) {
  const [showMap, setShowMap] = useState(false);
  const [negocios, setNegocios] = useState<any[]>([]);
  const [posicionUsuario, setPosicionUsuario] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

  // Cargar negocios activos cuando se abre el mapa
  const cargarNegocios = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/comercios/publico/negocios`);
      if (res.ok) {
        const data = await res.json();
        setNegocios(data);
      }
    } catch (error) {
      console.error('Error cargando negocios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener ubicación del usuario
  const obtenerUbicacion = () => {
    // Primero intentar desde localStorage
    const ubicacionGuardada = localStorage.getItem('ubicacion');
    if (ubicacionGuardada) {
      setPosicionUsuario(JSON.parse(ubicacionGuardada));
    }

    // Luego actualizar con ubicación real
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setPosicionUsuario(pos);
          localStorage.setItem('ubicacion', JSON.stringify(pos));
        },
        (error) => {
          console.warn('No se pudo obtener ubicación:', error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleMapClick = () => {
    setShowMap(true);
    cargarNegocios();
    obtenerUbicacion();
  };

  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  const handleCloseMap = () => {
    setShowMap(false);
  };

  // Cerrar modal con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMap(false);
    };
    if (showMap) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [showMap]);

  return (
    <>
      <div className="floating-buttons">
        {/* Botón Mapa - Glass effect */}
        <button 
          className="floating-btn map-btn"
          onClick={handleMapClick}
          aria-label="Ver mapa de restaurantes"
        >
          <span className="btn-icon">🗺️</span>
          <span className="btn-label">Encuentra algo cerca de ti...</span>
        </button>

        {/* Botón WhatsApp Bot - Grande y protagonista */}
        <button 
          className="floating-btn whatsapp-btn"
          onClick={handleWhatsAppClick}
          aria-label="Abrir WhatsApp para recomendaciones"
        >
          <div className="whatsapp-content">
            <span className="whatsapp-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </span>
            <div className="whatsapp-text">
              <span className="whatsapp-title">¿Qué se te antoja?</span>
              <span className="whatsapp-subtitle">Pregúntame 🌮</span>
            </div>
          </div>
          <div className="pulse-ring"></div>
        </button>
      </div>

      {/* Modal del Mapa */}
      {showMap && (
        <div className="map-modal-overlay" onClick={handleCloseMap}>
          <div className="map-modal" onClick={(e) => e.stopPropagation()}>
            <div className="map-modal-header">
              <h2>🌎 Explora restaurantes cerca de ti</h2>
              <button className="map-modal-close" onClick={handleCloseMap}>
                ✕
              </button>
            </div>
            <div className="map-modal-content">
              {loading ? (
                <div className="mapa-loading">
                  <div className="spinner"></div>
                  <p>Cargando restaurantes...</p>
                </div>
              ) : (
                <MapaUsuario
                  ref={mapRef}
                  negocios={negocios}
                  posicionUsuario={posicionUsuario}
                  onUbicacionActualizada={setPosicionUsuario}
                />
              )}
            </div>
            <div className="map-modal-footer">
              <p>📍 {negocios.length} lugares disponibles</p>
              <div className="footer-buttons">
                <button className="btn-location" onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const pos = {
                          lat: position.coords.latitude,
                          lng: position.coords.longitude,
                        };
                        setPosicionUsuario(pos);
                        localStorage.setItem('ubicacion', JSON.stringify(pos));
                        // Centrar mapa en la ubicación
                        if (mapRef.current?.centrarEnUbicacion) {
                          mapRef.current.centrarEnUbicacion(pos);
                        }
                      },
                      (error) => {
                        console.warn('Error de ubicación:', error);
                        alert('No pudimos obtener tu ubicación. Verifica que estés en HTTPS o localhost.');
                      },
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  } else {
                    alert('Tu navegador no soporta geolocalización.');
                  }
                }}>
                  📍 Mi ubicación
                </button>
                <button className="btn-whatsapp-alt" onClick={handleWhatsAppClick}>
                  💬 ¿Necesitas ayuda?
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}