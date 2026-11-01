// Осадок: сервис-воркер приложения.
// Сначала всегда берём свежую версию из сети (так обновления с GitHub приходят сразу),
// а сохранённую копию отдаём, только если интернета нет.
const CACHE = 'osadok-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const own = u.origin === self.location.origin;
  const cdn = u.hostname === 'cdn.jsdelivr.net';
  if (!own && !cdn) return;
  e.respondWith(
    fetch(r, own ? { cache: 'no-cache' } : undefined).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r, { ignoreSearch: own }).then(m => m || caches.match('./')))
  );
});
