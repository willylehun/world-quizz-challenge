"use strict";

const CACHE_NAME = "wqc-v11";
const BASE_URL = new URL("./", self.location.href);
const APP_SHELL = [
  "./",
  "game.html",
  "styles.css?v=11",
  "app.js?v=11",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
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
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
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
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    })),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "World Quizz Challenge", body: "C’est à toi de jouer !", url: "./game.html" };
  try { data = { ...data, ...event.data.json() }; } catch { /* Notification par défaut. */ }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: new URL("icons/icon-192.png", BASE_URL).href,
    badge: new URL("icons/icon-192.png", BASE_URL).href,
    data: { url: data.url || "./game.html" },
    tag: "wqc-turn",
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./game.html", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
    for (const client of clients) {
      if ("focus" in client) { await client.navigate(target); return client.focus(); }
    }
    return self.clients.openWindow(target);
  }));
});
