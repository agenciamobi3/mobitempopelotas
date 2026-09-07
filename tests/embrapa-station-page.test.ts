import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/estacao-embrapa-pelotas.tsx", "utf8");
const loader = readFileSync("src/lib/weather/embrapa-station-page-loader.ts", "utf8");
const page = readFileSync("src/components/embrapa/EmbrapaStationPageV2.tsx", "utf8");
const styles = readFileSync("src/components/embrapa/EmbrapaStationPageV2.css", "utf8");
const homeContract = readFileSync(
  "src/components/embrapa/EmbrapaStationHomeContract.css",
  "utf8",
);

const stationSource = `${route}\n${page}`;

test("Embrapa route uses the shared shell and a failure-isolated source loader", () => {
  assert.match(route, /createFileRoute\("\/estacao-embrapa-pelotas"\)/);
  assert.match(route, /loadEmbrapaStationPageData/);
  assert.match(route, /loader: \(\) => loadEmbrapaStationPageData\(\)/);
  assert.match(loader, /getWeatherIntelligence\(\)/);
  assert.match(loader, /getEmbrapaHealthSnapshot\(\)/);
  assert.match(loader, /getEmbrapaHistory24h\(\)/);
  assert.match(loader, /Promise\.allSettled/);
  assert.doesNotMatch(loader, /await Promise\.all\(/);
  assert.match(loader, /createUnavailableWeatherIntelligence\(\)/);
  assert.match(loader, /createUnavailableEmbrapaHealthSnapshot\(\)/);
  assert.match(loader, /createUnavailableEmbrapaHistorySnapshot\(\)/);
  assert.match(loader, /status: "unavailable"/);
  assert.match(loader, /points: \[\]/);
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /EmbrapaStationHero/);
  assert.match(route, /EmbrapaStationPageV2/);
  assert.match(route, /EmbrapaStationHomeContract\.css/);
  assert.match(route, /pageClassName="internal-weather-shell--embrapa"/);
  assert.match(route, /showOfficialAlerts=\{false\}/);
  assert.match(route, /staleTime: 60 \* 1_000/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, EMBRAPA_PAGE_CONTENT\.faqs\)/);
});

test("station page distinguishes live, partial, stale and unavailable source states", () => {
  assert.match(page, /live:[\s\S]*Leitura disponível/);
  assert.match(page, /partial:[\s\S]*Alguns dados disponíveis/);
  assert.match(page, /stale:[\s\S]*Leitura atrasada/);
  assert.match(page, /unavailable:[\s\S]*Estação indisponível/);
  assert.match(page, /Última temperatura informada/);
  assert.match(page, /não mostra valores artificiais/);
  assert.match(page, /health\.reason \?\? statusCopy\[status\]\.description/);
  assert.match(page, /role="status"/);
  assert.doesNotMatch(page, /status === "stale"[^\n]{0,160}Temperatura agora/);
});

test("measurement time, query time and observation age remain separate", () => {
  assert.match(page, /observation\.source\.observationTime/);
  assert.match(page, /observation\.source\.fetchedAt/);
  assert.match(page, /quality\.observationAgeMinutes/);
  assert.match(page, /Horário informado pela estação/);
  assert.match(page, /Última atualização/);
  assert.match(page, /Tempo desde a medição/);
  assert.match(page, /Medição e atualização/);
  assert.match(route, /Uma consulta recente pode encontrar uma medição antiga/);
});

test("page exposes the full local observation set without replacing missing values", () => {
  assert.match(page, /observation\.current\.temperature/);
  assert.match(page, /observation\.current\.humidity/);
  assert.match(page, /observation\.current\.pressure/);
  assert.match(page, /observation\.current\.windSpeed/);
  assert.match(page, /observation\.current\.windDirection/);
  assert.match(page, /observation\.current\.dewPoint/);
  assert.match(page, /observation\.current\.sunrise/);
  assert.match(page, /observation\.current\.sunset/);
  assert.match(page, /Não informado/);
  assert.doesNotMatch(stationSource, /\|\|\s*0[^-9]/);
});

test("rain, evapotranspiration and daily extremes preserve station scope", () => {
  assert.match(page, /rainDaily/);
  assert.match(page, /rainMonthly/);
  assert.match(page, /rainAnnual/);
  assert.match(page, /evapotranspirationDaily/);
  assert.match(page, /evapotranspirationMonthly/);
  assert.match(page, /evapotranspirationAnnual/);
  assert.match(page, /temperatureMin/);
  assert.match(page, /temperatureMax/);
  assert.match(page, /humidityMin/);
  assert.match(page, /humidityMax/);
  assert.match(page, /windSpeedMax/);
  assert.match(page, /Pancadas isoladas podem gerar acumulados/);
  assert.match(route, /O acumulado descreve o pluviômetro da estação/);
});

test("field-level origin explains how Embrapa enters the current summary", () => {
  assert.match(page, /currentProvenance/);
  assert.match(page, /source === "embrapa"/);
  assert.match(page, /Informações usadas agora/);
  assert.match(page, /fieldsUsedByPortal\(data\)\.length > 0/);
  assert.match(page, /verifica cada informação separadamente/);
  assert.match(route, /A Embrapa pode fornecer parte das informações atuais/);
  assert.match(route, /Quando um valor não é informado/);
  assert.doesNotMatch(page, /quality\.currentSource === "embrapa"/);
});

test("station links and dataset metadata remain transparent and safe", () => {
  assert.match(page, /const datasetSchema = available/);
  assert.match(page, /"@type": "Dataset"/);
  assert.match(page, /GeoCoordinates/);
  assert.match(page, /observation\.source\.latitude/);
  assert.match(page, /observation\.source\.longitude/);
  assert.match(page, /observation\.source\.altitude/);
  assert.match(page, /isBasedOn: observation\.source\.url/);
  assert.doesNotMatch(page, /temporalCoverage:/);
  assert.match(page, /target="_blank" rel="noopener noreferrer"/);
  assert.match(page, /Página da Embrapa/);
});

test("unavailable state never renders measurement values as current", () => {
  assert.match(page, /const available = observation\.status !== "unavailable"/);
  assert.match(page, /\{available \? \([\s\S]*id="leitura-observada"/);
  assert.match(page, /embrapa-v2-unavailable/);
  assert.match(page, /As medições não puderam ser exibidas/);
  assert.match(page, /Última temperatura informada/);
});

test("Embrapa page follows the clean internal editorial system", () => {
  assert.match(styles, /internal-weather-shell--embrapa \.embrapa-v2-hero/);
  assert.match(styles, /max-width: var\(--internal-weather-frame-max/);
  assert.match(styles, /background:\s*var\(--embrapa-soft\)/);
  assert.match(styles, /\.embrapa-v2-chapters \{\s*display:\s*none/);
  assert.match(styles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /content-visibility:\s*auto/);
  assert.match(styles, /scroll-margin-top:\s*8rem/);
  assert.match(styles, /@media \(max-width: 1080px\)/);
  assert.match(styles, /@media \(max-width: 820px\)/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /:focus-visible/);
  assert.doesNotMatch(styles, /box-shadow:/);
  assert.doesNotMatch(styles, /radial-gradient|linear-gradient/);
  assert.doesNotMatch(styles, /font-size:\s*0\.[0-6][0-9]rem/);
});

test("Embrapa observation accent stays restrained and does not override health states", () => {
  assert.match(homeContract, /identidade de observação local/i);
  assert.match(homeContract, /\.embrapa-v2-hero__content,[\s\S]*\.embrapa-v2-reading[\s\S]*background:\s*transparent/);
  assert.match(homeContract, /\.embrapa-v2-reading__quick > span[\s\S]*box-shadow:\s*none/);
  assert.match(homeContract, /\.embrapa-v2-hero__actions a:first-child[\s\S]*background:\s*#071e2f/);
  assert.doesNotMatch(homeContract, /radial-gradient|linear-gradient/);
  assert.doesNotMatch(homeContract, /is-partial|is-stale|is-unavailable/);
  assert.match(homeContract, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(homeContract, /!important/);
});
