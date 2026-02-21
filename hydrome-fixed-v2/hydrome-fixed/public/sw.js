// HydroMe Service Worker v2.0
// Enhanced for iOS 16.4+ and Android
// Handles: push notifications, offline caching, PWA install

const CACHE = 'hydrome-v2';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png', '/icon-96.png'];

// ─── Install: cache assets ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS).catch(err => {
        console.warn('[SW] Cache failed for some assets:', err);
        return Promise.resolve();
      }))
  );
  self.skipWaiting();
});

// ─── Activate: clean old caches ─────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('[SW] Removing old cache:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

// ─── Fetch: serve from cache first, then network ────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request).catch(err => {
          console.warn('[SW] Fetch failed:', event.request.url);
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ─── Push: receive and display notification ──────────────────────────────────
self.addEventListener('push', event => {
  console.log('[SW] Push received:', event);
  
  let data = { 
    title: '💧 HydroMe', 
    body: 'Time to drink water!', 
    icon: '/icon-192.png' 
  };

  if (event.data) {
    try { 
      data = { ...data, ...JSON.parse(event.data.text()) }; 
    } catch (e) { 
      data.body = event.data.text(); 
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-96.png',
    tag: 'hydrome-reminder',
    renotify: true,  // Important for iOS - allows repeated notifications
    requireInteraction: false,
    silent: false,
    data: { 
      url: self.registration.scope,
      timestamp: Date.now()
    },
    actions: [
      { action: 'drink', title: '💧 Log 250ml' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    vibrate: [200, 100, 200, 100, 200],  // Enhanced vibration pattern
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log('[SW] Notification shown'))
      .catch(err => console.error('[SW] Notification failed:', err))
  );
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') return;

  const action = event.action === 'drink' ? 'add250' : 'open';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        // Focus existing window if open
        for (const client of list) {
          if (client.url.includes(self.registration.scope) || client.url === self.registration.scope) {
            return client.focus().then(() => {
              client.postMessage({ action });
            });
          }
        }
        // Otherwise open a new window
        return clients.openWindow(self.registration.scope + '?action=' + action);
      })
      .catch(err => console.error('[SW] Window open failed:', err))
  );
});

// ─── Notification close ──────────────────────────────────────────────────────
self.addEventListener('notificationclose', event => {
  console.log('[SW] Notification closed');
});

// ─── Handle messages from the page ───────────────────────────────────────────
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle test notification request
  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    self.registration.showNotification('💧 HydroMe Test', {
      body: 'Great! Your notifications are working perfectly!',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: 'hydrome-test',
      vibrate: [200, 100, 200],
      requireInteraction: false
    });
  }
});

console.log('[SW] Service Worker loaded');
