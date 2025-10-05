/* eslint-disable no-console, no-undef */
const CACHE_NAME = 'xpr-delegation-demo-cache-v1';

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo/favicon.ico',
  '/logo/favicon-16x16.png',
  '/logo/favicon-32x32.png',
  '/logo/logo-192x192.png',
  '/logo/logo-512x512.png',
  '/logo/logo-apple-touch-icon.png',
  '/logo/logo.png',
  '/logo/logo.svg',
];

// Install event: cache static assets
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Pre-caching offline page and assets');
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch(() => {
        console.error('[ServiceWorker] Pre-caching failed');
      })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
          return undefined;
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: serve from cache or network
self.addEventListener('fetch', evt => {
  // Skip API requests and blockchain-related requests - let them go directly to network
  if (
    evt.request.url.includes('/v1/chain/') ||
    evt.request.url.includes('api.protonnz.com') ||
    evt.request.url.includes('testnet-api.chaininfra.net') ||
    evt.request.url.includes('anchor.link') ||
    evt.request.url.includes('cb.anchor.link') ||
    evt.request.url.includes('protonnz.com') ||
    evt.request.url.includes('chaininfra.net') ||
    evt.request.method === 'POST' // Skip all POST requests (likely API calls)
  ) {
    // Let API requests pass through without caching
    return;
  }

  // Handle other requests with simplified logic
  evt.respondWith(handleRequest(evt.request));
});

// Simplified request handler
async function handleRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.url, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    console.log('[ServiceWorker] Fetch failed, serving fallback');

    // Try to serve cached index.html
    const fallbackResponse = await caches.match('/index.html');
    if (fallbackResponse) {
      return fallbackResponse;
    }

    // Ultimate fallback - create a simple HTML response
    return new Response(
      '<!DOCTYPE html><html><head><title>XPR Delegation Demo</title></head><body><h1>Service Unavailable</h1><p>Please check your connection and try again.</p></body></html>',
      {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

// Message event
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-new-votes') {
    console.log('[ServiceWorker] Background sync triggered');
    event.waitUntil(
      new Promise(resolve => {
        console.log('Simulating background vote sync...');
        setTimeout(() => {
          console.log('Background vote sync complete');
          resolve(true);
        }, 2000);
      })
    );
  }
});

// Push Notifications
self.addEventListener('push', event => {
  const title = 'XPR Delegation Demo';
  const options = {
    body: event.data ? event.data.text() : 'You have new updates!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://your-app-url.com').catch(() => {
      console.log('Failed to open window');
    })
  );
});
