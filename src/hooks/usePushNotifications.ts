// src/hooks/usePushNotifications.ts
// Hook para manejar Push Notifications

import { useState, useEffect, useCallback } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BJDPD8cpDLr1X--plrczgCLlEqFPLZ6FnDdPHQXzpx1QNH4ooEiX1nMbFwhA-bZJE9S2-yIVjVo6S7JsKa3m4U0';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

interface PushState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  loading: boolean;
  error: string | null;
}

// Convertir VAPID key de base64 a Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    loading: true,
    error: null
  });

  // Verificar soporte y estado inicial
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      
      if (!isSupported) {
        setState(prev => ({ ...prev, isSupported: false, loading: false }));
        return;
      }

      const permission = Notification.permission;
      let isSubscribed = false;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        isSubscribed = subscription !== null;
      } catch (err) {
        console.error('Error verificando suscripción:', err);
      }

      setState({
        isSupported: true,
        isSubscribed,
        permission,
        loading: false,
        error: null
      });
    };

    checkSupport();
  }, []);

  // Registrar Service Worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker no soportado');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw-push.js');
      console.log('✅ Service Worker registrado:', registration);
      return registration;
    } catch (err) {
      console.error('❌ Error registrando Service Worker:', err);
      throw err;
    }
  }, []);

  // Suscribir a Push Notifications
  const subscribe = useCallback(async (userId: number, token: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Pedir permiso si no lo tenemos
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setState(prev => ({ ...prev, permission, loading: false }));
          return false;
        }
      }

      if (Notification.permission !== 'granted') {
        setState(prev => ({ ...prev, loading: false, error: 'Permiso denegado' }));
        return false;
      }

      // Registrar Service Worker si no está
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await registerServiceWorker();
      }
      await navigator.serviceWorker.ready;

      // Crear suscripción Push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('📬 Suscripción creada:', subscription);

      // Enviar suscripción al backend
      const response = await fetch(`${API_URL}/api/notificaciones/suscribir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          subscription: subscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error('Error guardando suscripción en servidor');
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        permission: 'granted',
        loading: false,
        error: null
      }));

      return true;
    } catch (err: any) {
      console.error('❌ Error suscribiendo:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Error al suscribirse'
      }));
      return false;
    }
  }, [registerServiceWorker]);

  // Desuscribir de Push Notifications
  const unsubscribe = useCallback(async (token: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notificar al backend
        await fetch(`${API_URL}/api/notificaciones/desuscribir`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        loading: false,
        error: null
      }));

      return true;
    } catch (err: any) {
      console.error('❌ Error desuscribiendo:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Error al desuscribirse'
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    registerServiceWorker
  };
}