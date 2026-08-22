import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const serviceWorker = readFileSync("public/sw.js", "utf8");

test("service worker precaches the official portal logo with the current cache generation", () => {
  assert.match(serviceWorker, /CACHE_VERSION = "tempo-pelotas-v8"/);
  assert.match(serviceWorker, /"\/brand\/tempo-pelotas-purple\.svg"/);
});

test("service worker coalesces simultaneous static asset revalidations", () => {
  assert.match(serviceWorker, /const IN_FLIGHT_ASSET_REQUESTS = new Map\(\)/);
  assert.match(serviceWorker, /function getAssetNetworkRequest\(request, cache\)/);
  assert.match(serviceWorker, /const existing = IN_FLIGHT_ASSET_REQUESTS\.get\(key\)/);
  assert.match(serviceWorker, /if \(existing\) return existing/);
  assert.match(serviceWorker, /IN_FLIGHT_ASSET_REQUESTS\.set\(key, networkPromise\)/);
  assert.match(serviceWorker, /IN_FLIGHT_ASSET_REQUESTS\.delete\(key\)/);
  assert.match(serviceWorker, /return networkResponse \? networkResponse\.clone\(\) : Response\.error\(\)/);
});
