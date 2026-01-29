/**
 * ============================================
 * TURICANJE - Analytics Provider
 * ============================================
 * Envuelve la app para inicializar tracking automático
 * ============================================
 */

'use client';

import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// ============================================
// CONFIGURACIÓN
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://turicanje-backend.onrender.com';
const HEARTBEAT_INTERVAL = 30000; // 30 segundos
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

// ============================================
// HELPERS
// ============================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  
  let visitorId = localStorage.getItem('turi_visitor_id');
  if (!visitorId) {
    visitorId = generateId('v');
    localStorage.setItem('turi_visitor_id', visitorId);
  }
  return visitorId;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const now = Date.now();
  const stored = sessionStorage.getItem('turi_session');
  
  if (stored) {
    const { id, lastActivity } = JSON.parse(stored);
    if (now - lastActivity < SESSION_TIMEOUT) {
      sessionStorage.setItem('turi_session', JSON.stringify({ id, lastActivity: now }));
      return id;
    }
  }
  
  const newId = generateId('s');
  sessionStorage.setItem('turi_session', JSON.stringify({ id: newId, lastActivity: now }));
  return newId;
}

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  return 'Other';
}

function getOS(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
}

function getUTMParams(): Record<string, string | null> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
    ref: params.get('ref'),
    place: params.get('place'),
  };
}

function getScrollDepth(): number {
  if (typeof window === 'undefined') return 0;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollHeight <= 0) return 100;
  return Math.round((scrollTop / scrollHeight) * 100);
}

// ============================================
// TIPOS
// ============================================

interface TrackClickOptions {
  elementId: string;
  elementType?: string;
  elementText?: string;
  elementCategory?: string;
  destinationUrl?: string;
  placeId?: string;
}

interface AnalyticsContextType {
  trackClick: (options: TrackClickOptions) => void;
  visitorId: string;
  sessionId: string;
}

// ============================================
// CONTEXT
// ============================================

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    // Retornar funciones dummy si no hay provider (para evitar errores)
    return {
      trackClick: () => {},
      visitorId: '',
      sessionId: '',
    };
  }
  return context;
}

// ============================================
// PROVIDER
// ============================================

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  
  const stateRef = useRef({
    visitorId: '',
    sessionId: '',
    currentPageviewId: null as number | null,
    previousPage: null as string | null,
    startTime: Date.now(),
    maxScrollDepth: 0,
    initialized: false,
  });
  
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // TRACK PAGEVIEW
  // ============================================
  
  const trackPageview = async () => {
    if (typeof window === 'undefined') return;
    
    const state = stateRef.current;
    
    // Inicializar IDs si es primera vez
    if (!state.initialized) {
      state.visitorId = getVisitorId();
      state.sessionId = getSessionId();
      state.initialized = true;
    }
    
    state.startTime = Date.now();
    state.maxScrollDepth = 0;
    
    const utmParams = getUTMParams();
    const cameFromBot = utmParams.ref === 'bot' || utmParams.utm_source === 'bot';
    
    const payload = {
      visitor_id: state.visitorId,
      session_id: state.sessionId,
      page_path: pathname,
      page_title: document.title,
      referrer: document.referrer || null,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      utm_content: utmParams.utm_content,
      utm_term: utmParams.utm_term,
      device_type: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      language: navigator.language,
      previous_page: state.previousPage,
      place_id: utmParams.place,
      came_from_bot: cameFromBot,
    };
    
    try {
      const response = await fetch(`${API_URL}/api/analytics/pageview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        const data = await response.json();
        state.currentPageviewId = data.pageview_id;
        console.log('[Analytics] ✅ Pageview:', pathname);
      }
    } catch (error) {
      console.error('[Analytics] ❌ Error:', error);
    }
    
    state.previousPage = pathname;
  };

  // ============================================
  // TRACK CLICK
  // ============================================
  
  const trackClick = async (options: TrackClickOptions) => {
    if (typeof window === 'undefined') return;
    
    const state = stateRef.current;
    
    const payload = {
      visitor_id: state.visitorId,
      session_id: state.sessionId,
      page_path: pathname,
      place_id: options.placeId,
      element_id: options.elementId,
      element_type: options.elementType || 'button',
      element_text: options.elementText,
      element_category: options.elementCategory,
      destination_url: options.destinationUrl,
      viewport_height: window.innerHeight,
      scroll_position: window.scrollY,
    };
    
    try {
      await fetch(`${API_URL}/api/analytics/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('[Analytics] ✅ Click:', options.elementId);
    } catch (error) {
      console.error('[Analytics] ❌ Click error:', error);
    }
  };

  // ============================================
  // HEARTBEAT
  // ============================================
  
  const sendHeartbeat = async () => {
    if (typeof window === 'undefined') return;
    
    const state = stateRef.current;
    if (!state.currentPageviewId) return;
    
    const timeOnPage = Math.round((Date.now() - state.startTime) / 1000);
    const scrollDepth = getScrollDepth();
    state.maxScrollDepth = Math.max(state.maxScrollDepth, scrollDepth);
    
    try {
      await fetch(`${API_URL}/api/analytics/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_id: state.visitorId,
          session_id: state.sessionId,
          pageview_id: state.currentPageviewId,
          time_on_page: timeOnPage,
          scroll_depth: state.maxScrollDepth,
        }),
      });
    } catch {
      // Silenciar errores de heartbeat
    }
  };

  // ============================================
  // EFECTOS
  // ============================================
  
  // Track pageview cuando cambia la ruta
  useEffect(() => {
    trackPageview();
    
    // Iniciar heartbeat
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      sendHeartbeat(); // Enviar último heartbeat al salir
    };
  }, [pathname]);

  // Track scroll depth
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      const scrollDepth = getScrollDepth();
      stateRef.current.maxScrollDepth = Math.max(stateRef.current.maxScrollDepth, scrollDepth);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ============================================
  // RENDER
  // ============================================
  
  const value: AnalyticsContextType = {
    trackClick,
    visitorId: stateRef.current.visitorId,
    sessionId: stateRef.current.sessionId,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export default AnalyticsProvider;