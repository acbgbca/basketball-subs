const CACHE_NAME = 'basketball-stats-v1';
const BASE_PATH = '/basketball-subs';

const urlsToCache = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/static/js/main.chunk.js',
  BASE_PATH + '/static/js/0.chunk.js',
  BASE_PATH + '/static/js/bundle.js',
  BASE_PATH + '/manifest.json',
  BASE_PATH + '/favicon.png',
  BASE_PATH + '/logo192.png',
  BASE_PATH + '/logo512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // For navigation requests, serve index.html (for PWA link capturing)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(BASE_PATH + '/index.html').then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (response) => {
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 