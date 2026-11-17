// Arise offline support. When you upload a new index.html, change v1 to v2 (v3, ...) so phones update.
const VERSION = 'arise-v2';
const CORE = ['./', './index.html', './config.js', './firebase-cloud.js', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache Google sign-in or database traffic.
  if (/googleapis\.com|firebaseapp\.com|identitytoolkit|securetoken|firestore/.test(url.host + url.pathname) && !url.host.includes('gstatic')) return;
  const sameOrigin = url.origin === location.origin;
  // App files: network first (so updates arrive), saved copy when offline.
  if (req.mode === 'navigate' || (sameOrigin && /\.(html|js)$/.test(url.pathname))) {
    // Network first so updates arrive, but on a weak signal use the saved copy after 3 seconds.
    const net = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; });
    const saved = () => caches.match(req).then(h => h || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
    e.respondWith(Promise.race([net.catch(() => null), new Promise(res => setTimeout(() => res(null), 3000))])
      .then(r => r || saved().then(h => h || net)));
    return;
  }
  // Icons, fonts and the Firebase library: saved copy first, refreshed in the background.
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
