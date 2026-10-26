/* Service worker del sitio: páginas siempre frescas desde la red; si no hay conexión
   se muestra la última versión guardada (útil con mala señal en sectores rurales). */
const CACHE = 'mlp-sitio-v4';
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
  const guardar = (res) => { if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(r, copia)); } return res; };
  // Estilos y scripts: sólo los que llevan la versión en la dirección (?v=…) se sirven desde la
  // caché; los demás (por ejemplo, los módulos que importa el panel) siempre desde la red, para
  // no mezclar archivos de versiones distintas.
  if (/^\/(css|js)\//.test(u.pathname)) {
    if (u.searchParams.has('v')) e.respondWith(caches.match(r).then((m) => m || fetch(r).then(guardar)));
    else e.respondWith(fetch(r).catch(() => caches.match(r)));
    return;
  }
  // Imágenes: se muestra la guardada y se actualiza en segundo plano.
  if (u.pathname.startsWith('/img/')) {
    const red = fetch(r).then(guardar);
    e.respondWith(caches.match(r).then((m) => m || red));
    e.waitUntil(red.catch(() => {}));
  }
});
