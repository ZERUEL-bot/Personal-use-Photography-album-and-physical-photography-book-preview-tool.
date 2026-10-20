/* 注册 Service Worker（仅在 http/https 下，避免 file:// 报错） */
(() => {
  "use strict";

  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "http:" && location.protocol !== "https:") return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js", { scope: "./" })
      .then((registration) => {
        if (registration.waiting) registration.waiting.postMessage("SKIP_WAITING");
      })
      .catch((error) => {
        console.warn("Service Worker 注册失败：", error && error.message ? error.message : error);
      });
  });
})();
