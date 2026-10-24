/* Service worker del sitio: páginas siempre frescas desde la red; si no hay conexión
   se muestra la última versión guardada (útil con mala señal en sectores rurales). */
const CACHE = 'mlp-sitio-v2';
const BASE = ['/', '/contacto/', '/tramites/', '/img/emblema-crema.svg', '/img/emblema-azul.svg', '/img/favicon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin || u.pathname.startsWith('/admin') || u.pathname.startsWith('/api/')) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then((res) => { if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(r, copia)); } return res; })
      .catch(() => caches.match(r).then((m) => m || caches.match('/contacto/') || caches.match('/'))));
    return;
  }
  if (/^\/(css|js|img)\//.test(u.pathname)) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => { if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(r, copia)); } return res; })));
  }
});
