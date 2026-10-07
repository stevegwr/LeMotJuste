// Le Mot Juste — service worker (mode hors ligne)
// ⚠ À chaque mise à jour du jeu, incrémentez VERSION pour que les téléphones récupèrent la nouvelle version.
const VERSION = "lemotjuste-v2";
const FILES = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png",
  "./fonts/fraunces-latin-400-normal.woff2", "./fonts/fraunces-latin-600-normal.woff2", "./fonts/fraunces-latin-800-normal.woff2",
  "./fonts/atkinson-hyperlegible-latin-400-normal.woff2", "./fonts/atkinson-hyperlegible-latin-700-normal.woff2"
];

self.addEventListener("install", e => {
  // cache:"reload" contourne le cache HTTP pour embarquer les fichiers vraiment à jour
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, {cache: "reload"})))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Page : on sert immédiatement la version en cache (démarrage instantané, même sur un réseau lent),
// et on la rafraîchit en arrière-plan. Les nouvelles versions du jeu arrivent via VERSION (voir plus haut).
// Autres fichiers : cache d'abord.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.mode === "navigate") {
    e.respondWith(caches.open(VERSION).then(async c => {
      const cached = await c.match("./index.html");
      const fresh = fetch(e.request).then(r => { if (r.ok) c.put("./index.html", r.clone()); return r; });
      if (cached) { e.waitUntil(fresh.catch(() => {})); return cached; }
      return fresh.catch(() => c.match("./"));
    }));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
