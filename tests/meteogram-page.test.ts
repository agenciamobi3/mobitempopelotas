import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createMeteogramUrl, fetchPelotasMeteogram } from "../src/lib/weather/meteogram.server.ts";

const route = readFileSync("src/routes/meteograma-pelotas.tsx", "utf8");
const page = readFileSync("src/components/weather/MeteogramPage.tsx", "utf8");
const styles = readFileSync("src/components/weather/MeteogramPage.css", "utf8");
const refinement = readFileSync("src/components/weather/MeteogramRefinement.css", "utf8");
const homeContract = readFileSync("src/components/weather/MeteogramHomeContract.css", "utf8");
const simagro = readFileSync("src/components/weather/SimagroModelProducts.tsx", "utf8");
const simagroStyles = readFileSync("src/components/weather/SimagroModelProducts.css", "utf8");
const functionSource = readFileSync("src/lib/weather/meteogram.functions.ts", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");
const todayAtmosphere = readFileSync("src/components/weather/TodayAtmosphericSignals.tsx", "utf8");
const header = readFileSync("src/production/components/home-editorial-header.tsx", "utf8");

function series(length: number, read: (index: number) => number | null) {
  return Array.from({ length }, (_, index) => read(index));
}

test("meteogram URL requests a dedicated 48-hour atmospheric profile", () => {
  const url = new URL(createMeteogramUrl());
  assert.equal(url.origin, "https://api.open-meteo.com");
  assert.equal(url.pathname, "/v1/forecast");
  assert.equal(url.searchParams.get("latitude"), "-31.7654");
  assert.equal(url.searchParams.get("longitude"), "-52.3376");
  assert.equal(url.searchParams.get("timezone"), "America/Sao_Paulo");
  assert.equal(url.searchParams.get("forecast_hours"), "48");
  assert.equal(url.searchParams.get("precipitation_unit"), "mm");

  const hourly = url.searchParams.get("hourly") ?? "";
  for (const variable of [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "dew_point_2m",
    "precipitation_probability",
    "precipitation",
    "pressure_msl",
    "cloud_cover_low",
    "cloud_cover_mid",
    "cloud_cover_high",
    "visibility",
    "cape",
    "boundary_layer_height",
    "wind_speed_10m",
    "wind_gusts_10m",
    "wind_direction_10m",
  ]) {
    assert.match(hourly, new RegExp(variable));
  }
});

test("meteogram normalizer preserves hourly volume and atmospheric variables", async () => {
  const originalFetch = globalThis.fetch;
  const length = 48;
  const payload = {
    latitude: -31.77,
    longitude: -52.34,
    timezone: "America/Sao_Paulo",
    utc_offset_seconds: -10_800,
    generationtime_ms: 3.4,
    hourly: {
      time: Array.from({ length }, (_, index) => `2026-07-${String(28 + Math.floor(index / 24)).padStart(2, "0")}T${String(index % 24).padStart(2, "0")}:00`),
      temperature_2m: series(length, (index) => 12 + index * 0.1),
      apparent_temperature: series(length, (index) => 11 + index * 0.1),
      relative_humidity_2m: series(length, (index) => 90 - (index % 20)),
      dew_point_2m: series(length, (index) => 10 + index * 0.08),
      precipitation_probability: series(length, (index) => index === 5 ? 70 : 20),
      precipitation: series(length, (index) => index === 5 ? 2.4 : 0),
      pressure_msl: series(length, (index) => 1015 + index * 0.05),
      cloud_cover: series(length, (index) => 60 + (index % 30)),
      cloud_cover_low: series(length, (index) => 40 + (index % 40)),
      cloud_cover_mid: series(length, (index) => 20 + (index % 35)),
      cloud_cover_high: series(length, (index) => 10 + (index % 45)),
      visibility: series(length, (index) => index === 4 ? 2_500 : 18_000),
      cape: series(length, (index) => index === 9 ? 620 : 80),
      boundary_layer_height: series(length, (index) => 400 + index * 10),
      wind_speed_10m: series(length, (index) => 8 + index * 0.2),
      wind_gusts_10m: series(length, (index) => 15 + index * 0.3),
      wind_direction_10m: series(length, (index) => 90 + index),
      weather_code: series(length, (index) => index === 5 ? 61 : 3),
      is_day: series(length, (index) => index % 24 >= 7 && index % 24 <= 18 ? 1 : 0),
    },
  };

  globalThis.fetch = (async () =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;

  try {
    const data = await fetchPelotasMeteogram();
    assert.equal(data.status, "live");
    assert.equal(data.hours.length, 48);
    assert.equal(data.source.model, "Best Match");
    assert.equal(data.source.temporalResolutionMinutes, 60);
    assert.equal(data.source.generationTimeMs, 3.4);
    assert.equal(data.hours[5]?.precipitationProbability, 70);
    assert.equal(data.hours[5]?.precipitationMm, 2.4);
    assert.equal(data.hours[4]?.visibilityKm, 2.5);
    assert.equal(data.hours[9]?.cape, 620);
    assert.equal(data.hours[0]?.windDirectionDegrees, 90);
    assert.equal(data.hours[0]?.isDay, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("meteogram route keeps SEO and separate forecast loading without a duplicate editorial layer", () => {
  assert.match(route, /createFileRoute\("\/meteograma-pelotas"\)/);
  assert.match(route, /MeteogramRefinement\.css/);
  assert.match(route, /MeteogramHomeContract\.css/);
  assert.ok(route.indexOf("MeteogramRefinement.css") > route.indexOf("MeteogramHomeContract.css"));
  assert.ok(route.indexOf("MeteogramRefinement.css") > route.indexOf("MeteogramStateContract.css"));
  assert.match(route, /getWeatherIntelligence\(\)/);
  assert.match(route, /getPelotasMeteogram\(\)/);
  assert.match(route, /Promise\.all/);
  assert.match(route, /Meteograma de Pelotas: previsão hora a hora por 48h/);
  assert.match(route, /temperatura, chuva, nuvens, visibilidade, pressão, vento e rajadas hora a hora/i);
  assert.match(route, /createEditorialPageJsonLd/);
  assert.match(route, /about:\s*\[/);
  assert.match(route, /showOfficialAlerts=\{false\}/);
  assert.match(route, /A previsão detalhada não respondeu\. Mostrando os dados horários disponíveis/);
  assert.doesNotMatch(route, /EditorialContentSection|createFaqPageJsonLd|METEOGRAM_CONTENT|como-interpretar-meteograma/);
});

test("meteogram page uses direct copy and keeps the useful 24/48-hour controls", () => {
  assert.match(page, /Meteograma de Pelotas/);
  assert.match(page, /Temperatura, chuva, nuvens, visibilidade, pressão e vento hora a hora/);
  assert.match(page, /Previsão por hora/);
  assert.match(page, /24 horas/);
  assert.match(page, /48 horas/);
  assert.doesNotMatch(page, /InternalPageChapters|internal-page-chapters/);
  assert.match(page, /Horário/);
  assert.match(page, /Temperatura, sensação e ponto de orvalho/);
  assert.match(page, /Chance de chuva e umidade/);
  assert.match(page, /Volume de chuva por hora/);
  assert.match(page, /Nuvens por camada/);
  assert.match(page, /Visibilidade/);
  assert.match(page, /Vento e rajadas/);
  assert.match(page, /title="Pressão"/);

  assert.doesNotMatch(page, /Como o tempo pode mudar nas próximas horas/);
  assert.doesNotMatch(page, /Escolha um horário/);
  assert.doesNotMatch(page, /meteogram-quick-actions/);
  assert.doesNotMatch(page, /meteogram-insights/);
  assert.doesNotMatch(page, /Maior possibilidade de tempestade/);
  assert.doesNotMatch(page, /Esta página mostra previsão, não medição/);
});

test("meteogram selected hour is compact without dropping missing-data semantics", () => {
  assert.match(page, /selectedMetric\("Temperatura"/);
  assert.match(page, /selectedMetric\("Chuva"/);
  assert.match(page, /selectedMetric\("Umidade"/);
  assert.match(page, /selectedMetric\("Vento"/);
  assert.match(page, /selectedMetric\("Pressão"/);
  assert.match(page, /selectedMetric\("Visibilidade"/);
  assert.match(page, /selectedMetric\("Instabilidade"/);
  assert.match(page, /Volume não informado/);
  assert.match(page, /Ponto de orvalho não informado/);
  assert.match(page, /Direção não informada/);
  assert.match(page, /Camada próxima ao solo não informada/);
  assert.doesNotMatch(page, /selectedMetric\("Nuvens baixas"/);
});

test("meteogram precipitation volume preserves partial and unavailable states", () => {
  assert.match(page, /const availableHours = hours\.filter\(\(hour\) => hour\.precipitationMm !== null\)/);
  assert.match(page, /const complete = availableHours\.length === hours\.length/);
  assert.match(page, /Volume não informado/);
  assert.match(page, /em \$\{availableHours\.length\} de \$\{hours\.length\} horários/);
  assert.doesNotMatch(page, /total \+ \(hour\.precipitationMm \?\? 0\)/);
});

test("meteogram zero rain and zero gust do not invent peak times", () => {
  assert.match(page, /function positiveMaximumHour/);
  assert.match(page, /const maximumRain = positiveMaximumHour/);
  assert.match(page, /const maximumGust = positiveMaximumHour/);
  assert.match(page, /maximumRainValue === 0 \? "Sem pico"/);
  assert.match(page, /maximumGustValue === 0 \? "Sem pico"/);
  assert.doesNotMatch(page, /Sem pico de chuva|Início da previsão/);
});

test("meteogram keeps forecast separate from real measurements with one concise note", () => {
  assert.match(page, /Previsão: \{sourceLabel\(weather, meteogram\)\}/);
  assert.match(page, /Medições reais ficam separadas no Tempo de hoje/);
  assert.match(page, /Previsão detalhada indisponível; usando os dados horários disponíveis/);
  assert.doesNotMatch(page, /A previsão pode mudar entre atualizações/);
  assert.doesNotMatch(page, /Valores futuros não são chuva já medida/);
  assert.doesNotMatch(`${route}\n${page}`, /SACE|Guaíba|Lagoa dos Patos|nível da água/i);
});

test("meteogram visual refinement removes the old megacard layers without flattening charts", () => {
  assert.match(styles, /internal-weather-shell--meteogram \.meteogram-hero/);
  assert.match(styles, /overflow-x: auto/);
  assert.match(styles, /min-width: 920px/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /:focus-visible/);

  assert.doesNotMatch(refinement, /\.internal-page-chapters/);
  assert.match(refinement, /\.meteogram-overview[\s\S]*border:\s*0/);
  assert.match(refinement, /\.meteogram-selected-grid[\s\S]*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(refinement, /\.meteogram-chart-card,[\s\S]*\.meteogram-volume[\s\S]*box-shadow:\s*none/);
  assert.match(refinement, /\.meteogram-footer/);
  assert.match(refinement, /\.meteogram-related[\s\S]*background:\s*transparent/);
  assert.doesNotMatch(refinement, /radial-gradient/);
});

test("meteogram SIMAGRO block stays complementary and direct", () => {
  assert.match(simagro, /Meteogramas do SIMAGRO RS/);
  assert.match(simagro, /Abrir SIMAGRO RS/);
  assert.match(simagro, /Imagem do SIMAGRO RS\. Data e ciclo aparecem no gráfico/);
  assert.doesNotMatch(simagro, /Gráficos oficiais de modelagem para Pelotas|Os valores principais da página continuam/);
  assert.doesNotMatch(simagro, /<span>\{product\.title\}<\/span>/);
  assert.match(simagroStyles, /border-top:/);
  assert.match(simagroStyles, /display:\s*flex/);
  assert.doesNotMatch(simagroStyles, /radial-gradient/);
});

test("meteogram hero keeps only a minimal technical accent while refinement owns the final surface", () => {
  assert.match(homeContract, /acento técnico mínimo/i);
  assert.match(homeContract, /\.meteogram-hero__panel/);
  assert.match(homeContract, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(homeContract, /radial-gradient|linear-gradient/);
  assert.doesNotMatch(homeContract, /!important/);
  assert.match(refinement, /\.meteogram-hero__content[\s\S]*background:\s*#fff/);
  assert.match(refinement, /\.meteogram-hero__panel[\s\S]*background:\s*#f8fbfc/);
});

test("meteogram is discoverable and cached as an operational page", () => {
  assert.match(publicRoutes, /path: "\/meteograma-pelotas", changeFrequency: "hourly"/);
  assert.match(todayAtmosphere, /to="\/meteograma-pelotas"/);
  assert.match(todayAtmosphere, /Ver previsão detalhada de 24 e 48 horas/);
  assert.match(header, /label: "Meteograma"/);
  assert.match(header, /Temperatura, chuva, pressão, nuvens e vento hora a hora/);
  assert.match(header, /"\/meteograma-pelotas"/);
  assert.match(functionSource, /max-age=300/);
  assert.match(functionSource, /stale-while-revalidate=600/);
});
