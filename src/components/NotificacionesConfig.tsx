// src/components/NotificacionesConfig.tsx
// Componente para configurar preferencias de notificaciones

'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import './NotificacionesConfig.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

type PreferenciaNoti = 'todo' | 'puntos' | 'negocios' | 'pausado';

interface Props {
  userId: number;
  token: string;
  preferenciasIniciales?: PreferenciaNoti;
}

export default function NotificacionesConfig({ userId, token, preferenciasIniciales = 'todo' }: Props) {
  const { 
    isSupported, 
    isSubscribed, 
    permission, 
    loading, 
    error,
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  const [preferencia, setPreferencia] = useState<PreferenciaNoti>(preferenciasIniciales);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

  // Cargar preferencias del usuario
  useEffect(() => {
    const cargarPreferencias = async () => {
      try {
        const res = await fetch(`${API_URL}/api/usuarios/preferencias-notificaciones`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.preferencia) {
            setPreferencia(data.preferencia);
          }
        }
      } catch (err) {
        console.error('Error cargando preferencias:', err);
      }
    };
    
    if (token) {
      cargarPreferencias();
    }
  }, [token]);

  // Activar notificaciones
  const handleActivar = async () => {
    const success = await subscribe(userId, token);
    if (success) {
      setMensaje({ tipo: 'exito', texto: '¡Notificaciones activadas!' });
      // Guardar preferencia por defecto
      await guardarPreferencia('todo');
    }
  };

  // Desactivar notificaciones
  const handleDesactivar = async () => {
    const success = await unsubscribe(token);
    if (success) {
      setMensaje({ tipo: 'exito', texto: 'Notificaciones desactivadas' });
    }
  };

  // Guardar preferencia en backend
  const guardarPreferencia = async (nuevaPreferencia: PreferenciaNoti) => {
    setGuardando(true);
    setMensaje(null);
    
    try {
      const res = await fetch(`${API_URL}/api/usuarios/preferencias-notificaciones`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preferencia: nuevaPreferencia })
      });

      if (res.ok) {
        setPreferencia(nuevaPreferencia);
        setMensaje({ tipo: 'exito', texto: 'Preferencias guardadas' });
      } else {
        throw new Error('Error al guardar');
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar preferencias' });
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar preferencia
  const handlePreferenciaChange = (nueva: PreferenciaNoti) => {
    if (nueva === 'pausado') {
      // Si pausa, desuscribir
      handleDesactivar();
    }
    guardarPreferencia(nueva);
  };

  // Limpiar mensaje después de 3 segundos
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  // Si no soporta push
  if (!isSupported) {
    return (
      <div className="noti-config">
        <h3>🔔 Notificaciones</h3>
        <div className="noti-no-soportado">
          <p>😕 Tu navegador no soporta notificaciones push.</p>
          <p className="noti-hint">Prueba usando Chrome, Firefox, Edge o Safari en iOS 16.4+</p>
        </div>
      </div>
    );
  }

  return (
    <div className="noti-config">
      <h3>🔔 Notificaciones</h3>
      
      {/* Mensaje de éxito/error */}
      {mensaje && (
        <div className={`noti-mensaje ${mensaje.tipo}`}>
          {mensaje.tipo === 'exito' ? '✅' : '⚠️'} {mensaje.texto}
        </div>
      )}

      {/* Estado de permiso */}
      {permission === 'denied' && (
        <div className="noti-warning">
          <p>⚠️ Las notificaciones están bloqueadas en tu navegador.</p>
          <p className="noti-hint">Ve a la configuración de tu navegador para habilitarlas.</p>
        </div>
      )}

      {/* Botón activar/desactivar */}
      {!isSubscribed && permission !== 'denied' && (
        <div className="noti-activar">
          <p>Recibe notificaciones sobre tus puntos, promociones y restaurantes cercanos.</p>
          <button 
            className="btn-activar-noti"
            onClick={handleActivar}
            disabled={loading}
          >
            {loading ? 'Activando...' : '🔔 Activar notificaciones'}
          </button>
        </div>
      )}

      {/* Opciones de preferencia */}
      {isSubscribed && (
        <div className="noti-opciones">
          <p className="noti-opciones-titulo">¿Qué notificaciones quieres recibir?</p>
          
          <label className={`noti-opcion ${preferencia === 'todo' ? 'activa' : ''}`}>
            <input
              type="radio"
              name="preferencia"
              value="todo"
              checked={preferencia === 'todo'}
              onChange={() => handlePreferenciaChange('todo')}
              disabled={guardando}
            />
            <span className="noti-opcion-icon">📬</span>
            <span className="noti-opcion-texto">
              <strong>Todo</strong>
              <small>Puntos, promociones y restaurantes cerca</small>
            </span>
          </label>

          <label className={`noti-opcion ${preferencia === 'puntos' ? 'activa' : ''}`}>
            <input
              type="radio"
              name="preferencia"
              value="puntos"
              checked={preferencia === 'puntos'}
              onChange={() => handlePreferenciaChange('puntos')}
              disabled={guardando}
            />
            <span className="noti-opcion-icon">💰</span>
            <span className="noti-opcion-texto">
              <strong>Solo puntos</strong>
              <small>Cuando ganes o canjees puntos</small>
            </span>
          </label>

          <label className={`noti-opcion ${preferencia === 'negocios' ? 'activa' : ''}`}>
            <input
              type="radio"
              name="preferencia"
              value="negocios"
              checked={preferencia === 'negocios'}
              onChange={() => handlePreferenciaChange('negocios')}
              disabled={guardando}
            />
            <span className="noti-opcion-icon">📍</span>
            <span className="noti-opcion-texto">
              <strong>Solo negocios cerca</strong>
              <small>Promociones de restaurantes cercanos</small>
            </span>
          </label>

          <label className={`noti-opcion pausar ${preferencia === 'pausado' ? 'activa' : ''}`}>
            <input
              type="radio"
              name="preferencia"
              value="pausado"
              checked={preferencia === 'pausado'}
              onChange={() => handlePreferenciaChange('pausado')}
              disabled={guardando}
            />
            <span className="noti-opcion-icon">🔕</span>
            <span className="noti-opcion-texto">
              <strong>Pausar notificaciones</strong>
              <small>No recibir ninguna notificación</small>
            </span>
          </label>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="noti-error">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}