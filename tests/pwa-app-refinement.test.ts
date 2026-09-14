import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rootRoute = readFileSync("src/routes/__root.tsx", "utf8");
const manager = readFileSync("src/components/pwa/PwaManager.tsx", "utf8");
const experience = readFileSync("src/components/pwa/PwaAppExperience.tsx", "utf8");
const experienceCss = readFileSync("src/components/pwa/pwa-app-experience.css", "utf8");
const pushManager = readFileSync("src/components/pwa/PushNotificationsManager.tsx", "utf8");
const serviceWorker = readFileSync("public/sw.js", "utf8");
const offlinePage = readFileSync("public/offline.html", "utf8");
const manifest = readFileSync("public/manifest.webmanifest", "utf8");

test("manifest e metadados moveis permanecem ativos", () => {
  assert.match(rootRoute, /import \{ PwaAppExperience \}/);
  assert.match(rootRoute, /import \{ PwaManager \}/);
  assert.match(rootRoute, /<PwaAppExperience \/>/);
  assert.match(rootRoute, /<PwaManager \/>/);
  assert.doesNotMatch(rootRoute, /PushNotificationsManager/);
  assert.match(rootRoute, /rel: "manifest", href: "\/manifest\.webmanifest"/);
  assert.match(rootRoute, /mobile-web-app-capable/);
  assert.match(rootRoute, /apple-mobile-web-app-capable/);
  assert.match(rootRoute, /viewport-fit=cover/);
  assert.match(rootRoute, /href: "\/brand\/tempo-pelotas-favicon-2026\.png"/);
});

test("PwaManager nao registra novo worker e remove apenas residuos do Tempo Pelotas", () => {
  assert.doesNotMatch(manager, /serviceWorker\.register/);
  assert.match(manager, /navigator\.serviceWorker\.getRegistrations\(\)/);
  assert.match(manager, /registration\.unregister\(\)/);
  assert.match(manager, /TEMPO_SERVICE_WORKER_PATH = "\/sw\.js"/);
  assert.match(manager, /window\.caches\.keys\(\)/);
  assert.match(manager, /cacheName\.startsWith\(TEMPO_CACHE_PREFIX\)/);
  assert.match(manager, /window\.caches\.delete\(cacheName\)/);
  assert.match(manager, /TEMPO_CACHE_PREFIX = "tempo-pelotas-"/);
  assert.doesNotMatch(manager, /window\.location\.reload/);
});

test("experiencia cliente preserva conectividade sem depender de worker ativo", () => {
  assert.match(experience, /import "\.\/pwa-app-experience\.css"/);
  assert.match(experienceCss, /@media \(display-mode: standalone\), \(display-mode: fullscreen\)/);
  assert.match(experience, /data\.pwaMode/);
  assert.match(experience, /data\.saveData/);
  assert.match(experience, /data\.effectiveConnection/);
  assert.match(experience, /data\.network/);
  assert.match(experience, /window\.addEventListener\("online"/);
  assert.match(experience, /window\.addEventListener\("offline"/);
  assert.match(experience, /registration\?\.update\(\)/);
  assert.match(experience, /Sem conexão/);
  assert.match(experience, /Conexão restabelecida/);
});

test("Web Push permanece fora do root", () => {
  assert.match(pushManager, /aria-expanded=\{isOpen\}/);
  assert.doesNotMatch(rootRoute, /PushNotificationsManager/);
});

test("arquivo do worker fica versionado apenas como artefato dormente", () => {
  assert.match(serviceWorker, /CACHE_NUMBER = 12/);
  assert.match(serviceWorker, /fetch\(event\.request, \{ cache: "no-store" \}\)/);
  assert.match(serviceWorker, /\/brand\/tempo-pelotas-favicon-2026\.png/);
  assert.doesNotMatch(serviceWorker, /tempo-pelotas-icon\.svg/);
  assert.doesNotMatch(manager, /serviceWorker\.register/);
});

test("manifest mantém atalhos públicos e o favicon PNG 2026", () => {
  assert.match(manifest, /"name": "Tempo Pelotas"/);
  assert.match(manifest, /"orientation": "any"/);
  assert.match(manifest, /"src": "\/brand\/tempo-pelotas-favicon-2026\.png"/);
  assert.match(manifest, /"type": "image\/png"/);
  assert.match(manifest, /"sizes": "512x512"/);
  assert.match(manifest, /"name": "Tempo agora em Pelotas"/);
  assert.match(manifest, /"name": "Radar e satélite"/);
  assert.match(manifest, /"name": "Situação das águas"/);
  assert.match(manifest, /"name": "Avisos meteorológicos"/);
});

test("offline page continua explicita sobre desatualizacao", () => {
  assert.match(offlinePage, /Aplicativo Tempo Pelotas/);
  assert.match(offlinePage, /Aguardando conexão/);
  assert.match(offlinePage, /Esta tela não representa a situação meteorológica atual/);
  assert.match(offlinePage, /src="\/brand\/tempo-pelotas-favicon-2026\.png"/);
});
