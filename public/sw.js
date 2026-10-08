// Perplexta Platform PWA Service Worker (v2.4.0)
const CACHE_NAME = 'perplexta-pwa-v2.4';
const STATIC_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: Cache critical app shell assets with non-blocking resilience
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_SHELL_ASSETS).catch((err) => {
        console.warn('[SW] Non-blocking static asset caching warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Cleanup old outdated caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Purging outdated cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Message listener to purge cache on demand
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'CLEAR_CACHE' || event.data.type === 'SKIP_WAITING')) {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => {
      if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
      }
    });
  }
});

// Fetch routing strategy: Resilient, non-interfering, safe
self.addEventListener('fetch', (event) => {
  // 1. Only intercept HTTP / HTTPS GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) {
    return;
  }

  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;

  // 2. Cross-origin requests handling
  if (!isSameOrigin) {
    // Only cache Google Fonts across origins with Stale-While-Revalidate
    const isGoogleFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
    if (isGoogleFont) {
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        })
      );
      return;
    }

    // For all other cross-origin requests (Google User avatars, Unsplash, Analytics, GTM, CDNs):
    // DO NOT intercept! Let the browser fetch natively with standard HTTP cache & CORS.
    return;
  }

  // 3. Same-origin bypasses (APIs, media uploads, streaming, websockets, dev server modules)
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/socket.io/') ||
    url.pathname.startsWith('/.well-known/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('@fs') ||
    url.pathname.endsWith('/sw.js') ||
    url.pathname.endsWith('/version.json') ||
    event.request.headers.has('range') ||
    event.request.destination === 'video' ||
    event.request.destination === 'audio'
  ) {
    return;
  }

  // 4. Navigation / HTML requests: Network-First ALWAYS with graceful offline fallback
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.status === 200 && (url.pathname === '/' || url.pathname === '/index.html')) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseClone));
          }
          return response;
        })
        .catch(async () => {
          const fallback = await caches.match('/index.html') || await caches.match('/');
          if (fallback) return fallback;
          return new Response('<h1>Perplexta Offline</h1><p>You are currently offline. Please check your network connection.</p>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 5. Static code assets (JS, CSS chunks): Network-First to guarantee fresh code on normal page reload
  const isCodeAsset = url.pathname.startsWith('/assets/') && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'));
  if (isCodeAsset) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            return networkResponse;
          }
          if (networkResponse.status === 404) {
            caches.open(CACHE_NAME).then((cache) => cache.delete(event.request));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response('', { status: 408, statusText: 'Asset fetch timeout' });
        })
    );
    return;
  }

  // 6. Same-origin brand assets & icons: Cache-First / Stale-While-Revalidate
  const isBrandOrIcon = url.pathname.startsWith('/brand/') || url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json' || url.pathname === '/favicon.ico';
  if (isBrandOrIcon) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 7. For any other same-origin requests, let browser handle natively (do not intercept)
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-chat-messages') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: 'SYNC_CHAT_MESSAGES',
            timestamp: Date.now()
          });
        }
      })
    );
  }
});
