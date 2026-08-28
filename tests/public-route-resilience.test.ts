import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createUnavailableWeatherIntelligence } from "../src/lib/weather/weather-intelligence-fallback.ts";

const weatherFunctions = readFileSync(
  "src/lib/weather/weather-intelligence.functions.ts",
  "utf8",
);
const sourcePolicy = readFileSync("src/lib/weather/source-policy.ts", "utf8");
const openMeteoDirect = readFileSync("src/lib/weather/open-meteo.server.ts", "utf8");
const openMeteoResilient = readFileSync(
  "src/lib/weather/open-meteo-resilient.server.ts",
  "utf8",
);
const openMeteoEdge = readFileSync("src/lib/weather/open-meteo-edge.server.ts", "utf8");
const metNorway = readFileSync("src/lib/weather/met-norway.server.ts", "utf8");
const embrapaCentral = readFileSync("src/lib/weather/embrapa-central.server.ts", "utf8");
const inmetStable = readFileSync("src/lib/weather/inmet-stable.server.ts", "utf8");
const staleClientRecovery = readFileSync("src/lib/stale-client-recovery.ts", "utf8");
const publicNavigationGuard = readFileSync(
  "src/components/navigation/PublicDocumentNavigationGuard.tsx",
  "utf8",
);
const regionalMapDeferred = readFileSync(
  "src/components/regional/RegionalCitiesMapDeferred.tsx",
  "utf8",
);
const publicWeatherPageLoader = readFileSync(
  "src/lib/weather/public-weather-page-loader.ts",
  "utf8",
);
const windRoute = readFileSync("src/routes/vento-em-pelotas.tsx", "utf8");
const rainRoute = readFileSync("src/routes/chuva-em-pelotas.tsx", "utf8");
const rootRoute = readFileSync("src/routes/__root.tsx", "utf8");

test("fallback meteorologico final preserva o contrato sem inventar valores", () => {
  const fallback = createUnavailableWeatherIntelligence();

  assert.equal(fallback.weather.status, "unavailable");
  assert.equal(fallback.weather.current, null);
  assert.deepEqual(fallback.weather.hourly, []);
  assert.deepEqual(fallback.weather.daily, []);
  assert.deepEqual(fallback.weather.alerts, []);
  assert.deepEqual(fallback.weather.inmetForecast, []);
  assert.deepEqual(fallback.weather.officialForecast, []);
  assert.equal(fallback.weather.quality.score, 0);
  assert.equal(fallback.weather.quality.confidence, "low");
  assert.equal(fallback.intelligence.origin, "deterministic");
  assert.equal(fallback.intelligence.geminiStatus, "unavailable");

  for (const source of Object.values(fallback.weather.sources)) {
    assert.equal(source.status, "unavailable");
    assert.equal(source.usable, false);
  }
});

test("server fn meteorologica possui ultima barreira e prazo maximo", () => {
  assert.match(weatherFunctions, /WEATHER_INTELLIGENCE_DEADLINE_MS = 3_000/);
  assert.match(weatherFunctions, /Promise\.race/);
  assert.match(weatherFunctions, /fetchWeatherIntelligence\(\)/);
  assert.match(weatherFunctions, /createUnavailableWeatherIntelligence\(\)/);
  assert.match(weatherFunctions, /catch \(error\)/);
});

test("fontes oficiais ficam abaixo do budget global da rota", () => {
  assert.match(sourcePolicy, /embrapa: 1_600/);
  assert.match(sourcePolicy, /inmet: 1_600/);
  assert.match(sourcePolicy, /cppmet: 1_500/);
  assert.match(sourcePolicy, /embrapa: 1_900/);
  assert.match(sourcePolicy, /inmet: 1_900/);
  assert.match(sourcePolicy, /cppmet: 1_800/);
});

test("open meteo publico prioriza origem direta validada e curta antes da edge", () => {
  assert.match(openMeteoDirect, /REQUEST_TIMEOUT_MS = 1_800/);
  assert.match(openMeteoDirect, /openMeteoResponseSchema\.safeParse\(payload\)/);
  assert.match(openMeteoDirect, /controller\.abort\(\)/);

  const publicFlow = openMeteoResilient.slice(
    openMeteoResilient.indexOf("export async function fetchPelotasWeather"),
  );
  const directIndex = publicFlow.indexOf("fetchOpenMeteoDirect()");
  const edgeIndex = publicFlow.indexOf("fetchOpenMeteoPayloadViaEdge()");
  assert.ok(directIndex >= 0 && edgeIndex > directIndex);
  assert.match(publicFlow, /if \(direct\.status !== "unavailable"\) return direct/);
  assert.match(publicFlow, /return direct;/);
});

test("contingencia edge possui um unico budget incluindo consulta ao supabase", () => {
  assert.match(openMeteoEdge, /REQUEST_TIMEOUT_MS = 900/);
  assert.match(openMeteoEdge, /const signal = AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
  assert.match(openMeteoEdge, /\.abortSignal\(signal\)/);
  assert.match(openMeteoEdge, /signal,/);
  assert.doesNotMatch(openMeteoEdge, /REQUEST_TIMEOUT_MS = 35_000/);
});

test("met norway possui timeout curto para nao reter o baseline", () => {
  assert.match(metNorway, /REQUEST_TIMEOUT_MS = 1_800/);
  assert.match(metNorway, /AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
});

test("embrapa no pageview apenas le cache central e nunca dispara refresh persistente", () => {
  assert.match(embrapaCentral, /PUBLIC_READ_TIMEOUT_MS = 800/);
  assert.match(embrapaCentral, /\.abortSignal\(querySignal\)/);
  assert.match(embrapaCentral, /export async function refreshCentralEmbrapaObservation/);

  const publicGetter = embrapaCentral
    .split("export async function getCentralEmbrapaObservation")[1]
    ?.split("function safeTokenEqual")[0] ?? "";
  assert.match(publicGetter, /readCurrentRow\(AbortSignal\.timeout\(PUBLIC_READ_TIMEOUT_MS\)\)/);
  assert.doesNotMatch(publicGetter, /refreshCentralEmbrapaObservation/);
});

test("inmet limita, prioriza e aborta enriquecimento rss dentro do deadline", () => {
  assert.match(inmetStable, /MAX_RSS_DETAIL_REQUESTS = 8/);
  assert.match(inmetStable, /RSS_ENRICHMENT_DEADLINE_MS = 1_800/);
  assert.match(inmetStable, /const preferred = new Set\(preferredIds\)/);
  assert.match(inmetStable, /ids\.filter\(\(id\) => preferred\.has\(id\)\)/);
  assert.match(inmetStable, /const rssSignal = AbortSignal\.timeout\(RSS_ENRICHMENT_DEADLINE_MS\)/);
  assert.match(inmetStable, /fetchRssAlerts\(baseAlerts, rssSignal\)/);
  assert.match(inmetStable, /fetchText\(detailUrl, signal\)/);
  assert.doesNotMatch(inmetStable, /MAX_RSS_DETAIL_REQUESTS = 48/);
});

test("cliente recupera bundles antigos com documento fresco e cache buster", () => {
  assert.match(staleClientRecovery, /vite:preloadError/);
  assert.match(staleClientRecovery, /failed to fetch dynamically imported module/i);
  assert.match(staleClientRecovery, /chunkloaderror/i);
  assert.match(staleClientRecovery, /RECOVERY_PARAM = "__tp_recover"/);
  assert.match(staleClientRecovery, /sessionStorage/);
  assert.match(staleClientRecovery, /RECOVERY_WINDOW_MS = 60_000/);
  assert.match(staleClientRecovery, /window\.location\.replace\(recoveryUrl\(\)\)/);
  assert.match(staleClientRecovery, /window\.history\.replaceState/);
  assert.doesNotMatch(staleClientRecovery, /window\.location\.reload\(\)/);

  assert.match(rootRoute, /installVitePreloadRecovery/);
  assert.match(rootRoute, /markClientRuntimeReady\(\)/);
  assert.match(rootRoute, /recoverClientNavigationFailure\(error\)/);
});

test("qualquer falha de runtime hidratado recebe no maximo uma tentativa fresca", () => {
  assert.match(staleClientRecovery, /TRANSIENT_NAVIGATION_PATTERNS/);
  assert.match(staleClientRecovery, /server function/i);
  assert.match(staleClientRecovery, /serverfn/i);
  assert.match(staleClientRecovery, /failed to fetch/i);
  assert.match(staleClientRecovery, /clientRuntimeReady/);
  assert.match(staleClientRecovery, /navigator\.onLine === false/);
  assert.match(staleClientRecovery, /"asset" \| "navigation" \| "runtime"/);
  assert.match(staleClientRecovery, /navigateToFreshDocument/);
  assert.doesNotMatch(staleClientRecovery, /while\s*\(/);
});

test("navegacao publica usa documento completo e preserva areas autenticadas", () => {
  assert.match(rootRoute, /<PublicDocumentNavigationGuard \/>/);
  assert.match(publicNavigationGuard, /document\.addEventListener\("click", handleClick, true\)/);
  assert.match(publicNavigationGuard, /window\.location\.assign\(destination\.href\)/);
  assert.match(publicNavigationGuard, /destination\.origin !== window\.location\.origin/);
  assert.match(publicNavigationGuard, /SPA_ALLOWED_PREFIXES/);
  assert.match(publicNavigationGuard, /"\/conta"/);
  assert.match(publicNavigationGuard, /"\/painel"/);
  assert.match(publicNavigationGuard, /data-spa-navigation/);
});

test("boundary global nao exibe mais a tela fatal ao publico", () => {
  assert.doesNotMatch(rootRoute, /Não foi possível carregar esta página/);
  assert.doesNotMatch(rootRoute, /Erro inesperado/);
  assert.match(rootRoute, /Carregando a versão mais recente do Tempo Pelotas/);
  assert.match(rootRoute, /href="\/tempo-na-regiao-sul-rs"/);
  assert.match(rootRoute, /href="\/situacao-hidrologica-pelotas"/);
  assert.match(rootRoute, /reportLovableError/);
});

test("mapa regional e opcional e nao pode derrubar a rota", () => {
  assert.match(regionalMapDeferred, /import \{ RegionalCitiesMap \} from "\.\/RegionalCitiesMap"/);
  assert.doesNotMatch(regionalMapDeferred, /import\("\.\/RegionalCitiesMap"\)/);
  assert.match(regionalMapDeferred, /class RegionalMapErrorBoundary extends Component/);
  assert.match(regionalMapDeferred, /getDerivedStateFromError/);
  assert.match(regionalMapDeferred, /A lista de cidades continua disponível/);
});

test("vento e chuva degradam chamadas secundarias sem abrir o boundary global", () => {
  assert.match(publicWeatherPageLoader, /Promise\.allSettled/);
  assert.match(publicWeatherPageLoader, /createUnavailableWeatherIntelligence\(\)/);
  assert.match(publicWeatherPageLoader, /status:\s*"unavailable"/);
  assert.match(publicWeatherPageLoader, /hours:\s*\[\]/);

  for (const routeSource of [windRoute, rainRoute]) {
    assert.match(routeSource, /loadPublicWeatherWithMeteogram/);
    assert.doesNotMatch(routeSource, /Promise\.all\(/);
    assert.doesNotMatch(routeSource, /getPelotasMeteogram/);
    assert.doesNotMatch(routeSource, /getWeatherIntelligence/);
  }
});
