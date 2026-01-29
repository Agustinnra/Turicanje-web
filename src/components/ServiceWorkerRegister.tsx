'use client';

import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration.scope);
        })
        .catch((error) => {
          console.error('❌ Error registrando Service Worker:', error);
        });
    }

    // Tracking de instalación PWA
    window.addEventListener('appinstalled', () => {
      console.log('📱 PWA instalada!');
      fetch(`${API_URL}/api/analytics/pwa-install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          platform: navigator.platform
        })
      }).catch(err => console.log('Error tracking PWA install:', err));
    });

  }, []);

  return null;
}
