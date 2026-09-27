"use strict";

const CACHE_NAME = "wqc-v15";
const BASE_URL = new URL("./", self.location.href);
const APP_SHELL = [
  "./",
  "game.html",
  "styles.css?v=15",
  "app.js?v=15",
  "manifest.webmanifest?v=15",
  "icons/wqc-logo.svg",
  "icons/wqc-logo-192.png",
  "icons/wqc-logo-512.png",
  "data/countries.csv",
].map((path) => new URL(path, BASE_URL).href);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) return;
  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            await caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match(new URL("game.html", BASE_URL).href))),
    );
    return;
  }
  const isCountryData = requestUrl.pathname.endsWith("/data/countries.csv");
  if (isCountryData) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            await caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then(async (response) => {
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        await caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    })),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "World Quizz Challenge", body: "C’est à toi de jouer !", url: "./game.html" };
  try { data = { ...data, ...event.data.json() }; } catch { /* Notification par défaut. */ }
  const title = String(data.title || "World Quizz Challenge").slice(0, 80);
  const body = String(data.body || "C’est à toi de jouer !").slice(0, 240);
  const target = safeNotificationTarget(data.url);
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: new URL("icons/wqc-logo-192.png", BASE_URL).href,
    badge: new URL("icons/wqc-logo-192.png", BASE_URL).href,
    data: { url: target },
    tag: "wqc-turn",
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = safeNotificationTarget(event.notification.data?.url);
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
    for (const client of clients) {
      if ("focus" in client) { await client.navigate(target); return client.focus(); }
    }
    return self.clients.openWindow(target);
  }));
});

function safeNotificationTarget(value) {
  try {
    const target = new URL(typeof value === "string" ? value : "./game.html", BASE_URL);
    if (target.origin !== self.location.origin || !target.pathname.endsWith("/game.html")) throw new Error("unsafe target");
    target.hash = "";
    const duel = target.searchParams.get("duel");
    const validDuel = duel && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(duel);
    target.search = validDuel ? `?duel=${encodeURIComponent(duel)}` : "";
    return target.href;
  } catch {
    return new URL("game.html", BASE_URL).href;
  }
}
