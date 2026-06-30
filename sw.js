/* Mis Gastos — service worker
   Guarda una copia local de los archivos de la app para que funcione
   sin conexión. No realiza ninguna conexión a servidores externos. */
const CACHE = "mis-gastos-v4";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      // Precaché tolerante a fallos: si un archivo individual no se
      // puede descargar, no debe bloquear la instalación del SW entera
      // (addAll() es todo-o-nada y puede dejar la instalación colgada).
      Promise.allSettled(ASSETS.map((url) => c.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => {
          // sin conexión y sin cache: devolver la app principal para navegaciones
          if (req.mode === "navigate") return caches.match("./index.html");
        });
    })
  );
});
