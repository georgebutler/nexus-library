const CACHE_NAME = "nexus-library-shell-v1";
const APP_SHELL = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-48.png",
  "/icon-180-maskable.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-1024-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match("/offline.html")),
  );
});
