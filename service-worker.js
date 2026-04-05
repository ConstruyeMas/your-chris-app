const CACHE_NAME = "your-chris-app-shell-v7";
const APP_SHELL = [
  "./",
  "./index.html",
  "./App_Recibo_Themes.html",
  "./App_Recibo_Themes.html?v=26a5d77",
  "./manifest.webmanifest",
  "./config/shared-config.js",
  "./core/app.css",
  "./core/app.css?v=26a5d77",
  "./core/app.js",
  "./core/app.js?v=26a5d77",
  "./core/config.js",
  "./core/storage.js",
  "./core/receipts.js",
  "./core/premium.js",
  "./core/themes.js",
  "./core/navigation.js",
  "./core/slider.js",
  "./screens/splash.js",
  "./screens/formulario.js",
  "./screens/suscripcion.js",
  "./screens/preview.js",
  "./screens/qr.js",
  "./screens/confirmacion.js",
  "./assets/chris/chris-avatar.png",
  "./assets/chris/chris-nombre.png",
  "./assets/chris/chris-concepto.png",
  "./assets/chris/chris-monto.png",
  "./assets/chris/chris-premium.png",
  "./assets/chris/chris-emitir.png",
  "./assets/chris/chris-confirmacion.png",
  "./assets/icons/app-icon-180.png",
  "./assets/icons/app-icon-180.png?v=20260404",
  "./assets/icons/app-icon-192.png",
  "./assets/icons/app-icon-192.png?v=20260404",
  "./assets/icons/app-icon-512.png",
  "./assets/icons/app-icon-512.png?v=20260404",
  "./assets/icons/app-icon-1024.png",
  "./assets/icons/app-icon-1024.png?v=20260404",
  "./assets/icons/slider-chris.png",
  "./assets/themes/nombre.png",
  "./assets/themes/concepto.png",
  "./assets/themes/monto.png",
  "./assets/themes/suscripcion.png",
  "./assets/themes/preview.png",
  "./assets/themes/confirmacion.png",
  "./assets/templates/receipt-preview.svg",
  "./assets/templates/receipt-output.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        const clonedResponse = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
        return networkResponse;
      });
    })
  );
});
