const CACHE_NAME = 'jarvis-v1';
const SHELL_URLS = [
  '/jarvis/',
  '/jarvis/index.html',
];
const FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap',
];
const FIREBASE_URLS = [
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
];

// Install: cache the app shell + Firebase SDK + fonts
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([...SHELL_URLS, ...FIREBASE_URLS, ...FONT_URLS]);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app shell & static assets, network-first for API calls
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls (OpenRouter, Firebase Firestore)
  if (
    url.hostname === 'openrouter.ai' ||
    url.hostname === 'firestore.googleapis.com' ||
    url.hostname === 'identitytoolkit.googleapis.com' ||
    url.hostname === 'securetoken.googleapis.com' ||
    url.pathname.includes('/v1/') ||
    event.request.method !== 'GET'
  ) {
    return; // Let browser handle normally
  }

  // Cache-first for everything else (HTML, JS, CSS, fonts)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Return cached version immediately, but update cache in background
        const fetchPromise = fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {});
        
        return cached;
      }

      // Not in cache — fetch from network and cache it
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
