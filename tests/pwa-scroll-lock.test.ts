import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pwaManager = readFileSync("src/components/pwa/PwaManager.tsx", "utf8");

test("PWA manager no longer owns modal or body-scroll state", () => {
  assert.match(pwaManager, /export function PwaManager\(\)/);
  assert.match(pwaManager, /return null/);
  assert.doesNotMatch(pwaManager, /shouldLockBodyScroll|document\.body\.style\.overflow|setIsOpen/);
});

test("PWA manager retires only the portal service worker and its own caches", () => {
  assert.match(pwaManager, /TEMPO_SERVICE_WORKER_PATH = "\/sw\.js"/);
  assert.match(pwaManager, /TEMPO_CACHE_PREFIX = "tempo-pelotas-"/);
  assert.match(pwaManager, /navigator\.serviceWorker\.getRegistrations\(\)/);
  assert.match(pwaManager, /\.filter\(isTempoPelotasRegistration\)/);
  assert.match(pwaManager, /registration\.unregister\(\)/);
  assert.match(pwaManager, /window\.caches\.keys\(\)/);
  assert.match(pwaManager, /cacheName\.startsWith\(TEMPO_CACHE_PREFIX\)/);
  assert.match(pwaManager, /Promise\.allSettled/);
  assert.doesNotMatch(pwaManager, /navigator\.serviceWorker\.register\(/);
});
