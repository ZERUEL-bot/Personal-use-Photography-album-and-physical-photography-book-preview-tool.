/* A Glimpse of Trees — Service Worker
 * 纯静态离线缓存：应用外壳 + 本地字体 + 默认示例图片。
 * 作品数据与上传照片保存在 IndexedDB，不经过 Service Worker。
 */
"use strict";

const CACHE_NAME = "photo-pwa-v1";

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./favicon.svg",
  "./css/style.css",
  "./js/main.js",
  "./js/storage.js",
  "./js/image-tools.js",
  "./js/pwa.js",
  "./lib/quill.js",
  "./lib/quill.snow.css",
  "./lib/Sortable.min.js",
  "./assets/fonts/Inter-var.woff2",
  "./assets/fonts/PlayfairDisplay-var.woff2",
  "./assets/fonts/PlayfairDisplay-italic-var.woff2",
  "./assets/textures/paper-noise.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-180.png",
  "./assets/images/manifest.json",
  "./assets/images/_placeholder.svg",
  "./data/default-portfolio.json",
  "./assets/images/01-still-water-1000.webp",
  "./assets/images/01-still-water-2000.webp",
  "./assets/images/02-morning-haze-1000.webp",
  "./assets/images/02-morning-haze-2000.webp",
  "./assets/images/03-the-long-field-1000.webp",
  "./assets/images/03-the-long-field-2000.webp",
  "./assets/images/04-between-pines-1000.webp",
  "./assets/images/04-between-pines-2000.webp",
  "./assets/images/05-quiet-current-1000.webp",
  "./assets/images/05-quiet-current-2000.webp",
  "./assets/images/06-after-the-rain-1000.webp",
  "./assets/images/06-after-the-rain-2000.webp",
  "./assets/images/07-low-light-1000.webp",
  "./assets/images/07-low-light-2000.webp",
  "./assets/images/08-a-slow-season-1000.webp",
  "./assets/images/08-a-slow-season-2000.webp",
  "./assets/images/09-edge-of-the-wood-1000.webp",
  "./assets/images/09-edge-of-the-wood-2000.webp",
  "./assets/images/10-wind-through-grass-1000.webp",
  "./assets/images/10-wind-through-grass-2000.webp",
  "./assets/images/11-first-frost-1000.webp",
  "./assets/images/11-first-frost-2000.webp",
  "./assets/images/12-distant-ridge-1000.webp",
  "./assets/images/12-distant-ridge-2000.webp",
  "./assets/images/13-last-light-1000.webp",
  "./assets/images/13-last-light-2000.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(url).catch(() => {
            /* a missing optional asset must not block installation */
          })
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put("./index.html", copy))
            .catch(() => {});
          return response;
        })
        .catch(async () => {
          const cached = await caches.match("./index.html");
          return cached || (await caches.match("./")) || Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
