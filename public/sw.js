// Service Worker para Turicanje PWA
const CACHE_NAME = 'turicanje-v1';

// Archivos a cachear inicialmente
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/logo-turicanje.png'
];

// Instalar - cachear archivos estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando archivos estáticos');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar - limpiar cachés viejos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Eliminando caché viejo:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch - estrategia Network First con fallback a caché
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests a APIs externas y WebSockets
  if (
    url.origin !== self.location.origin ||
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clonar respuesta para guardar en caché
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Si falla la red, buscar en caché
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si no está en caché y es navegación, mostrar página offline
          if (request.mode === 'navigate') {
            return caches.match('/offline');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================

// Acciones según tipo de notificación
function getActionsForType(type) {
  switch(type) {
    case 'puntos':
      return [
        { action: 'ver-puntos', title: '💰 Ver mis puntos' },
        { action: 'cerrar', title: 'Cerrar' }
      ];
    case 'negocio':
      return [
        { action: 'ver-negocio', title: '🍽️ Ver restaurante' },
        { action: 'cerrar', title: 'Cerrar' }
      ];
    case 'promocion':
      return [
        { action: 'ver-promo', title: '🎁 Ver promoción' },
        { action: 'cerrar', title: 'Cerrar' }
      ];
    default:
      return [];
  }
}

// Recibir Push Notification
self.addEventListener('push', (event) => {
  console.log('[SW] 📬 Push recibido:', event);

  let data = {
    title: 'Turicanje',
    body: 'Tienes una nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'turicanje-notification',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || {}
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [100, 50, 100],
    data: data.data,
    actions: getActionsForType(data.data?.type),
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 👆 Click en notificación:', event.action);

  event.notification.close();

  let url = '/';

  switch(event.action) {
    case 'ver-puntos':
      url = '/mi-cuenta';
      break;
    case 'ver-negocio':
      url = event.notification.data?.negocio_url || '/blog';
      break;
    case 'ver-promo':
      url = event.notification.data?.promo_url || '/';
      break;
    case 'cerrar':
      return; // Solo cerrar, no navegar
    default:
      url = event.notification.data?.url || '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Si ya hay una ventana abierta de Turicanje, usarla
        for (let client of windowClients) {
          if (client.url.includes('turicanje.com') && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Cerrar notificación
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] ❌ Notificación cerrada');
});