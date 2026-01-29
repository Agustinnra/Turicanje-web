'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verificar si ya se rechazó antes
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) return;

    // Verificar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA instalada');
    }
    
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      zIndex: 9999,
      maxWidth: '90%',
      width: '400px',
      border: '1px solid rgba(209, 0, 125, 0.3)'
    }}>
      <div style={{ fontSize: '36px' }}>📱</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          Instala Turicanje
        </div>
        <div style={{ fontSize: '13px', opacity: 0.8 }}>
          Accede mas rapido desde tu pantalla de inicio
        </div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: 'linear-gradient(135deg, #d1007d 0%, #ff006e 100%)',
          color: 'white',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '10px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Instalar
      </button>
      <button
        onClick={handleDismiss}
        style={{
          background: 'transparent',
          color: 'rgba(255,255,255,0.6)',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          padding: '4px'
        }}
      >
        ×
      </button>
    </div>
  );
}
