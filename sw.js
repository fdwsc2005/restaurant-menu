// Conte di Savoia menu — offline support
// Pages: always try the internet first (so price changes show right away),
//        fall back to the saved copy only when offline.
// Images: show the saved copy instantly, refresh it in the background.

const CACHE = 'cds-menu-v2';
const ASSETS = [
  '/restaurant-menu/',
  '/restaurant-menu/index.html',
  '/restaurant-menu/store.webp',
  '/restaurant-menu/icon.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting(); // take over right away instead of waiting for old tabs to close
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', function (e) {
  // Delete old saved copies (like cds-menu-v1) so stale prices can't come back
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // leave fonts, analytics, ChowNow alone

  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  if (isPage) {
    // Network first: newest menu whenever online
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(function (res) {
        const copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('/restaurant-menu/index.html');
        });
      })
    );
    return;
  }

  // Images and other files: saved copy first, update it in the background
  e.respondWith(
    caches.match(req).then(function (hit) {
      const update = fetch(req).then(function (res) {
        const copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
        return res;
      }).catch(function () { return hit; });
      return hit || update;
    })
  );
});
