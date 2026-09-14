/* global self, caches, fetch, Response, URL */

const CACHE_NUMBER = 10;
const CACHE_VERSION = `tempo-pelotas-v${CACHE_NUMBER}`;
const CACHE_PREFIX = "tempo-pelotas-v";
const APP_SHELL_CACHE = `${CACHE_VERSION}-app-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_FALLBACK_URL = "/offline.html";
const OPTIONAL_APP_SHELL_URLS = [
  "/manifest.webmanifest",
  "/brand/tempo-pelotas-icon.svg",
  "/brand/tempo-pelotas-purple.svg",
];
const IN_FLIGHT_ASSET_REQUESTS = new Map();
const RECOVERING_CLIENT_IDS = new Set();

function cacheGeneration(cacheName) {
  const match = /^tempo-pelotas-v(\d+)-(?:app-shell|runtime)$/.exec(cacheName);
  return match ? Number(match[1]) : null;
}

async function installCurrentShell() {
  const cache = await caches.open(APP_SHELL_CACHE);
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
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await installCurrentShell();
      // Atualizacao de runtime e cache e tratada como correcao de coerencia.
      // Nao deixa um worker novo aguardando enquanto a aba continua no deploy antigo.
      await self.skipWaiting();
    })(),
  );
});

async function cleanOldTempoPelotasCaches() {
  const keys = await caches.keys();
  const generations = keys
    .map(cacheGeneration)
    .filter((value) => value !== null && value < CACHE_NUMBER);
  const previousGeneration = generations.length ? Math.max(...generations) : null;
  const keep = new Set([APP_SHELL_CACHE, RUNTIME_CACHE]);

  if (previousGeneration !== null) {
    keep.add(`tempo-pelotas-v${previousGeneration}-app-shell`);
    keep.add(`tempo-pelotas-v${previousGeneration}-runtime`);
  }

  await Promise.all(
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && !keep.has(key))
      .map((key) => caches.delete(key)),
  );

  return previousGeneration !== null;
}

async function refreshClientsAfterWorkerUpgrade() {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

  await Promise.allSettled(
    clients.map(async (client) => {
      let clientUrl;
      try {
        clientUrl = new URL(client.url);
      } catch {
        return;
      }

      if (clientUrl.origin !== self.location.origin || !("navigate" in client)) return;
      await client.navigate(client.url);
    }),
  );
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const upgrading = await cleanOldTempoPelotasCaches();

      // A navegacao do portal precisa ignorar uma copia HTTP antiga do HTML.
      // O proprio fetch handler usa cache:no-store, portanto preload nao agrega
      // valor aqui e poderia competir com a requisicao fresca.
      await self.registration.navigationPreload?.disable();
      await self.clients.claim();

      // Ao trocar a geracao do worker, abas ainda abertas podem estar executando
      // JavaScript do deploy anterior. Recarregue-as uma vez para alinhar HTML,
      // runtime e server functions antes da proxima navegacao SPA.
      if (upgrading) await refreshClientsAfterWorkerUpgrade();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

async function onlineOnlyNavigation(event) {
  try {
    return await fetch(event.request, { cache: "no-store" });
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

async function recoverClientAfterMissingVersionedAsset(event, response) {
  if (!response || (response.status !== 404 && response.status !== 410)) return;
  const clientId = event.clientId;
  if (!clientId || RECOVERING_CLIENT_IDS.has(clientId)) return;

  const client = await self.clients.get(clientId);
  if (!client || !("navigate" in client)) return;

  let clientUrl;
  try {
    clientUrl = new URL(client.url);
  } catch {
    return;
  }
  if (clientUrl.origin !== self.location.origin) return;

  RECOVERING_CLIENT_IDS.add(clientId);
  await client.navigate(client.url);
}

async function cacheFirstVersionedAsset(request, event) {
  // /assets usa nomes com hash. Uma copia de geracao anterior com a mesma URL
  // continua sendo o mesmo artefato e pode manter uma aba antiga funcional
  // durante a pequena janela de transicao entre deploys.
  const cached = await caches.match(request);
  if (cached) return cached;

  const cache = await caches.open(RUNTIME_CACHE);
  const networkResponse = await getAssetNetworkRequest(request, cache);

  if (networkResponse && (networkResponse.status === 404 || networkResponse.status === 410)) {
    event.waitUntil(recoverClientAfterMissingVersionedAsset(event, networkResponse));
  }

  return networkResponse ? networkResponse.clone() : Response.error();
}

async function staleWhileRevalidateBrand(request, event) {
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

function isVersionedApplicationAsset(url) {
  return url.pathname.startsWith("/assets/");
}

function isBrandAsset(url) {
  return url.pathname.startsWith("/brand/");
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

  if (isVersionedApplicationAsset(url)) {
    event.respondWith(cacheFirstVersionedAsset(request, event));
    return;
  }

  if (isBrandAsset(url)) {
    event.respondWith(staleWhileRevalidateBrand(request, event));
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
    icon: data.icon || "/brand/tempo-pelotas-icon.svg",
    badge: data.badge || "/brand/tempo-pelotas-icon.svg",
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
