/* global self, caches, fetch, Response, URL */

const CACHE_VERSION = "tempo-pelotas-v8";
const APP_SHELL_CACHE = `${CACHE_VERSION}-app-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_FALLBACK_URL = "/offline.html";
const OPTIONAL_APP_SHELL_URLS = [
  "/manifest.webmanifest",
  "/brand/tempo-pelotas-icon.png",
  "/brand/tempo-pelotas-purple.svg",
];
const IN_FLIGHT_ASSET_REQUESTS = new Map();

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then(async (cache) => {
      const offlineResponse = await fetch(OFFLINE_FALLBACK_URL, {
        cache: "reload",
      });

      if (!offlineResponse.ok) {
        throw new Error(`Fallback offline respondeu HTTP ${offlineResponse.status}`);
      }

      await cache.put(OFFLINE_FALLBACK_URL, offlineResponse);
      await Promise.allSettled(
        OPTIONAL_APP_SHELL_URLS.map(async (url) => {
          const response = await fetch(url, { cache: "reload" });
          if (response.ok) await cache.put(url, response);
        }),
      );
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
              .map((key) => caches.delete(key)),
          ),
        ),
      self.registration.navigationPreload?.enable(),
    ]).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

async function onlineOnlyNavigation(event) {
  try {
    const preloadResponse = await event.preloadResponse;
    if (preloadResponse) return preloadResponse;
    return await fetch(event.request);
  } catch {
    return (await caches.match(OFFLINE_FALLBACK_URL)) || Response.error();
  }
}

function getAssetNetworkRequest(request, cache) {
  const key = request.url;
  const existing = IN_FLIGHT_ASSET_REQUESTS.get(key);
  if (existing) return existing;

  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    })
    .catch(() => null)
    .finally(() => {
      IN_FLIGHT_ASSET_REQUESTS.delete(key);
    });

  IN_FLIGHT_ASSET_REQUESTS.set(key, networkPromise);
  return networkPromise;
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = getAssetNetworkRequest(request, cache);

  if (cached) {
    event.waitUntil(networkPromise.then(() => undefined));
    return cached;
  }

  const networkResponse = await networkPromise;
  return networkResponse ? networkResponse.clone() : Response.error();
}

function isCacheableStaticAsset(url) {
  return url.pathname.startsWith("/assets/") || url.pathname.startsWith("/brand/");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(onlineOnlyNavigation(event));
    return;
  }

  if (isCacheableStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, event));
  }
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Tempo Pelotas";
  const options = {
    body: data.body || "Há uma nova informação para Pelotas.",
    icon: data.icon || "/brand/tempo-pelotas-icon.png",
    badge: data.badge || "/brand/tempo-pelotas-icon.png",
    tag: data.tag || "tempo-pelotas",
    renotify: Boolean(data.renotify),
    requireInteraction: Boolean(data.requireInteraction),
    data: {
      url: typeof data.url === "string" ? data.url : "/",
      receivedAt: Date.now(),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  let destination = new URL("/", self.location.origin);
  try {
    const candidate = new URL(event.notification.data?.url || "/", self.location.origin);
    if (candidate.origin === self.location.origin) destination = candidate;
  } catch {
    destination = new URL("/", self.location.origin);
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if (client.url === destination.href && "focus" in client) return client.focus();
      }

      const sameOriginClient = clients.find((client) =>
        client.url.startsWith(self.location.origin),
      );
      if (sameOriginClient && "navigate" in sameOriginClient) {
        await sameOriginClient.navigate(destination.href);
        return sameOriginClient.focus();
      }

      return self.clients.openWindow(destination.href);
    }),
  );
});
