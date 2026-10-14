const CACHE = 'cds-menu-v1';
const ASSETS = [
  '/restaurant-menu/',
  '/restaurant-menu/index.html',
  '/restaurant-menu/store.webp',
  '/restaurant-menu/icon.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
