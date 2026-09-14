import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const serviceWorker = readFileSync("public/sw.js", "utf8");
const productionServer = readFileSync("src/server-brazil.ts", "utf8");

test("service worker usa nova geracao e precacheia a marca oficial", () => {
  assert.match(serviceWorker, /CACHE_NUMBER = 10/);
  assert.match(serviceWorker, /CACHE_VERSION = `tempo-pelotas-v\$\{CACHE_NUMBER\}`/);
  assert.match(serviceWorker, /"\/brand\/tempo-pelotas-icon\.svg"/);
  assert.match(serviceWorker, /"\/brand\/tempo-pelotas-purple\.svg"/);
  assert.match(serviceWorker, /await self\.skipWaiting\(\)/);
});

test("service worker preserva uma geracao anterior durante transicao de deploy", () => {
  assert.match(serviceWorker, /function cacheGeneration\(cacheName\)/);
  assert.match(serviceWorker, /previousGeneration/);
  assert.match(serviceWorker, /keep\.add\(`tempo-pelotas-v\$\{previousGeneration\}-runtime`\)/);
  assert.match(serviceWorker, /key\.startsWith\(CACHE_PREFIX\)/);
  assert.doesNotMatch(serviceWorker, /\.filter\(\(key\) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE\)/);
});

test("assets com hash podem usar cache de geracao anterior sem misturar HTML", () => {
  assert.match(serviceWorker, /function isVersionedApplicationAsset\(url\)/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/assets\/"\)/);
  assert.match(serviceWorker, /const cached = await caches\.match\(request\)/);
  assert.match(serviceWorker, /cacheFirstVersionedAsset\(request, event\)/);
  assert.match(serviceWorker, /response\.status !== 404 && response\.status !== 410/);
  assert.match(serviceWorker, /client\.navigate\(client\.url\)/);
  assert.match(serviceWorker, /RECOVERING_CLIENT_IDS/);
});

test("navegacao de documento ignora cache HTTP e worker atualiza abas antigas", () => {
  assert.match(serviceWorker, /fetch\(event\.request, \{ cache: "no-store" \}\)/);
  assert.match(serviceWorker, /navigationPreload\?\.disable\(\)/);
  assert.match(serviceWorker, /refreshClientsAfterWorkerUpgrade/);
  assert.match(serviceWorker, /await self\.clients\.claim\(\)/);
});

test("HTML SSR nao pode permanecer em cache entre publicacoes", () => {
  assert.match(productionServer, /function isHtmlDocumentRequest\(request: Request, response: Response\)/);
  assert.match(productionServer, /fetchMode === "navigate"/);
  assert.match(productionServer, /contentType\.toLowerCase\(\)\.includes\("text\/html"\)/);
  assert.match(productionServer, /Cache-Control", "no-store, no-cache, max-age=0, must-revalidate"/);
  assert.match(productionServer, /CDN-Cache-Control", "no-store"/);
  assert.match(productionServer, /Expires", "0"/);
});

test("service worker continua coalescendo requests simultaneos de asset", () => {
  assert.match(serviceWorker, /const IN_FLIGHT_ASSET_REQUESTS = new Map\(\)/);
  assert.match(serviceWorker, /function getAssetNetworkRequest\(request, cache\)/);
  assert.match(serviceWorker, /const existing = IN_FLIGHT_ASSET_REQUESTS\.get\(key\)/);
  assert.match(serviceWorker, /if \(existing\) return existing/);
  assert.match(serviceWorker, /IN_FLIGHT_ASSET_REQUESTS\.set\(key, networkPromise\)/);
  assert.match(serviceWorker, /IN_FLIGHT_ASSET_REQUESTS\.delete\(key\)/);
});
