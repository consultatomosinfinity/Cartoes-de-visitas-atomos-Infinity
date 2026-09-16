const CACHE = "card-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      );
    }).then(() => clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // NUNCA interceptar nem cachear chamadas de API, SSE ou rotas dinâmicas
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/live-updates") ||
    url.searchParams.has("_t") ||
    url.searchParams.has("t")
  ) {
    return;
  }

  // Apenas recursos estáticos (imagens, fontes, css, js)
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff|woff2|ttf|ico|css|js)$/i)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networked = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200 && response.type === "basic") {
              const cacheCopy = response.clone();
              caches.open(CACHE).then((cache) => {
                cache.put(event.request, cacheCopy);
              });
            }
            return response;
          })
          .catch(() => cached);
        return cached || networked;
      })
    );
  }
});
