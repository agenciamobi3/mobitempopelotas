import { useEffect } from "react";

const TEMPO_CACHE_PREFIX = "tempo-pelotas-";
const TEMPO_SERVICE_WORKER_PATH = "/sw.js";

function isTempoPelotasRegistration(registration: ServiceWorkerRegistration) {
  const workers = [registration.active, registration.waiting, registration.installing].filter(
    (worker): worker is ServiceWorker => Boolean(worker),
  );

  return workers.some((worker) => {
    try {
      const scriptUrl = new URL(worker.scriptURL);
      return (
        scriptUrl.origin === window.location.origin &&
        scriptUrl.pathname === TEMPO_SERVICE_WORKER_PATH
      );
    } catch {
      return false;
    }
  });
}

async function retireTempoPelotasServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(
        registrations
          .filter(isTempoPelotasRegistration)
          .map((registration) => registration.unregister()),
      );
    } catch (error) {
      console.warn("Não foi possível concluir a retirada do service worker do Tempo Pelotas:", error);
    }
  }

  if ("caches" in window) {
    try {
      const cacheNames = await window.caches.keys();
      await Promise.allSettled(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(TEMPO_CACHE_PREFIX))
          .map((cacheName) => window.caches.delete(cacheName)),
      );
    } catch (error) {
      console.warn("Não foi possível limpar os caches antigos do Tempo Pelotas:", error);
    }
  }
}

/**
 * O service worker foi temporariamente retirado do caminho crítico do portal.
 * O manifest e a experiência de conectividade permanecem, mas nenhuma nova
 * registration é criada. Esta limpeza remove somente registrations do /sw.js
 * do próprio origin e caches prefixados pelo Tempo Pelotas.
 */
export function PwaManager() {
  useEffect(() => {
    void retireTempoPelotasServiceWorker();
  }, []);

  return null;
}
