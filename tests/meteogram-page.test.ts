import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createGfsMeteogramUrl,
  createMeteogramUrl,
  fetchPelotasMeteogram,
} from "../src/lib/weather/meteogram.server.ts";

const route = readFileSync("src/routes/meteograma-pelotas.tsx", "utf8");
const page = readFileSync("src/components/weather/MeteogramPage.tsx", "utf8");
const highlights = readFileSync(
  "src/components/weather/MeteogramForecastHighlights.tsx",
  "utf8",
);
const highlightsStyles = readFileSync(
  "src/components/weather/MeteogramForecastHighlights.css",
  "utf8",
);
const styles = readFileSync("src/components/weather/MeteogramPage.css", "utf8");
const refinement = readFileSync("src/components/weather/MeteogramRefinement.css", "utf8");
const homeContract = readFileSync("src/components/weather/MeteogramHomeContract.css", "utf8");
const simagro = readFileSync("src/components/weather/SimagroModelProducts.tsx", "utf8");
const simagroStyles = readFileSync("src/components/weather/SimagroModelProducts.css", "utf8");
const functionSource = readFileSync("src/lib/weather/meteogram.functions.ts", "utf8");
const loaderSource = readFileSync("src/lib/weather/public-weather-page-loader.ts", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");
const todayAtmosphere = readFileSync("src/components/weather/TodayAtmosphericSignals.tsx", "utf8");
const header = readFileSync("src/production/components/home-editorial-header.tsx", "utf8");

function series(length: number, read: (index: number) => number | null) {
  return Array.from({ length }, (_, index) => read(index));
}

function payload(length = 48, includeBoundaryLayerHeight = false) {
  return {
    latitude: -31.77,
    longitude: -52.34,
    timezone: "America/Sao_Paulo",
    utc_offset_seconds: -10_800,
    generationtime_ms: 3.4,
    hourly: {
      time: Array.from(
        { length },
        (_, index) => `2026-09-${String(9 + Math.floor(index / 24)).padStart(2, "0")}T${String(index % 24).padStart(2, "0")}:00`,
      ),
      temperature_2m: series(length, (index) => 12 + index * 0.1),
      apparent_temperature: series(length, (index) => 11 + index * 0.1),
      relative_humidity_2m: series(length, (index) => 90 - (index % 20)),
      dew_point_2m: series(length, (index) => 10 + index * 0.08),
      precipitation_probability: series(length, (index) => (index === 5 ? 70 : 20)),
      precipitation: series(length, (index) => (index === 5 ? 2.4 : 0)),
      pressure_msl: series(length, (index) => 1015 + index * 0.05),
      cloud_cover: series(length, (index) => 60 + (index % 30)),
      cloud_cover_low: series(length, (index) => 40 + (index % 40)),
      cloud_cover_mid: series(length, (index) => 20 + (index % 35)),
      cloud_cover_high: series(length, (index) => 10 + (index % 45)),
      visibility: series(length, (index) => (index === 4 ? 2_500 : 18_000)),
      cape: series(length, (index) => (index === 9 ? 620 : 80)),
      ...(includeBoundaryLayerHeight
        ? { boundary_layer_height: series(length, (index) => 400 + index * 10) }
        : {}),
      wind_speed_10m: series(length, (index) => 8 + index * 0.2),
      wind_gusts_10m: series(length, (index) => 15 + index * 0.3),
      wind_direction_10m: series(length, (index) => 90 + index),
      weather_code: series(length, (index) => (index === 5 ? 61 : 3)),
      is_day: series(length, (index) => (index % 24 >= 7 && index % 24 <= 18 ? 1 : 0)),
    },
  };
}

test("meteograma usa perfil Best Match de 48h e GFS como contingência própria", () => {
  const bestMatch = new URL(createMeteogramUrl());
  const gfs = new URL(createGfsMeteogramUrl());

  assert.equal(bestMatch.origin, "https://api.open-meteo.com");
  assert.equal(bestMatch.pathname, "/v1/forecast");
  assert.equal(gfs.pathname, "/v1/gfs");
  assert.equal(bestMatch.searchParams.get("forecast_hours"), "48");
  assert.equal(gfs.searchParams.get("forecast_hours"), "48");
  assert.equal(bestMatch.searchParams.get("timezone"), "America/Sao_Paulo");

  const bestHourly = bestMatch.searchParams.get("hourly") ?? "";
  const gfsHourly = gfs.searchParams.get("hourly") ?? "";
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
    "wind_speed_10m",
    "wind_gusts_10m",
    "wind_direction_10m",
    "weather_code",
    "is_day",
  ]) {
    assert.match(bestHourly, new RegExp(variable));
    assert.match(gfsHourly, new RegExp(variable));
  }
  assert.doesNotMatch(bestHourly, /boundary_layer_height/);
  assert.match(gfsHourly, /boundary_layer_height/);
});

test("meteograma não cai inteiro quando uma série atmosférica opcional não vem", async () => {
  const originalFetch = globalThis.fetch;
  const body = payload(48, false);

  globalThis.fetch = (async (input) => {
    const url = String(input);
    if (url.includes("/v1/gfs")) {
      return new Response("indisponível", { status: 503 });
    }
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const data = await fetchPelotasMeteogram();
    assert.equal(data.status, "live");
    assert.equal(data.source.model, "Best Match");
    assert.equal(data.hours.length, 48);
    assert.equal(data.hours[0]?.feelsLike, 11);
    assert.equal(data.hours[5]?.precipitationMm, 2.4);
    assert.equal(data.hours[0]?.windDirectionDegrees, 90);
    assert.equal(data.hours[0]?.boundaryLayerHeight, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("NOAA GFS assume o meteograma quando Best Match falha", async () => {
  const originalFetch = globalThis.fetch;
  const gfsPayload = payload(48, true);

  globalThis.fetch = (async (input) => {
    const url = String(input);
    if (url.includes("/v1/forecast")) {
      return new Response("indisponível", { status: 502 });
    }
    return new Response(JSON.stringify(gfsPayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const data = await fetchPelotasMeteogram();
    assert.equal(data.status, "live");
    assert.equal(data.source.model, "NOAA GFS");
    assert.equal(data.hours.length, 48);
    assert.equal(data.hours[0]?.boundaryLayerHeight, 400);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("janela menor continua utilizável sem inventar os horários ausentes", async () => {
  const originalFetch = globalThis.fetch;
  const shortPayload = payload(30, false);

  globalThis.fetch = (async (input) => {
    const url = String(input);
    if (url.includes("/v1/gfs")) return new Response("indisponível", { status: 503 });
    return new Response(JSON.stringify(shortPayload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const data = await fetchPelotasMeteogram();
    assert.equal(data.status, "live");
    assert.equal(data.hours.length, 30);
    assert.match(data.message ?? "", /30 de 48 horários/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rota usa loader público com degradação independente e inclui o resumo de 48h", () => {
  assert.match(route, /createFileRoute\("\/meteograma-pelotas"\)/);
  assert.match(route, /loadPublicWeatherWithMeteogram/);
  assert.match(route, /MeteogramForecastHighlights/);
  assert.match(route, /Meteograma de Pelotas: previsão hora a hora por 48h/);
  assert.match(route, /NOAA GFS/);
  assert.match(route, /showOfficialAlerts=\{false\}/);
  assert.doesNotMatch(route, /getWeatherIntelligence\(\)|getPelotasMeteogram\(\)|Promise\.allSettled/);
  assert.match(loaderSource, /settlePageDependency/);
  assert.match(loaderSource, /PUBLIC_WEATHER_PAGE_DEADLINE_MS = 2_500/);
});

test("cache do meteograma não congela falha nem janela curta", () => {
  assert.match(functionSource, /data\.hours\.length >= data\.source\.forecastHours/);
  assert.match(functionSource, /max-age=300, stale-while-revalidate=600/);
  assert.match(functionSource, /max-age=60, stale-while-revalidate=120/);
  assert.match(functionSource, /no-store, max-age=0/);
});

test("destaques de 48h preservam ausência e trazem só derivados objetivos", () => {
  assert.match(highlights, /Destaques das próximas \{windowLabel\}/);
  assert.match(highlights, /Chuva prevista/);
  assert.match(highlights, /Maior chance de chuva/);
  assert.match(highlights, /Maior rajada/);
  assert.match(highlights, /Menor visibilidade/);
  assert.match(highlights, /Pressão/);
  assert.match(highlights, /Maior CAPE/);
  assert.match(highlights, /de \$\{hours\.length\} horários com volume informado/);
  assert.doesNotMatch(highlights, /\?\? 0|risco|perigo|alerta amarelo/i);
  assert.match(highlightsStyles, /grid-template-columns:\s*repeat\(7/);
  assert.match(highlightsStyles, /@media \(max-width: 720px\)/);
  assert.doesNotMatch(highlightsStyles, /radial-gradient|linear-gradient/);
});

test("página detalhada mantém os controles e gráficos horários existentes", () => {
  assert.match(page, /Meteograma de Pelotas/);
  assert.match(page, /Previsão por hora/);
  assert.match(page, /24 horas/);
  assert.match(page, /48 horas/);
  assert.match(page, /Temperatura, sensação e ponto de orvalho/);
  assert.match(page, /Chance de chuva e umidade/);
  assert.match(page, /Volume de chuva por hora/);
  assert.match(page, /Nuvens por camada/);
  assert.match(page, /Visibilidade/);
  assert.match(page, /Vento e rajadas/);
  assert.match(page, /title="Pressão"/);
  assert.match(page, /Volume não informado/);
  assert.doesNotMatch(page, /InternalPageChapters|internal-page-chapters/);
});

test("zero de chuva e rajada não vira horário de pico artificial", () => {
  assert.match(page, /function positiveMaximumHour/);
  assert.match(page, /maximumRainValue === 0 \? "Sem pico"/);
  assert.match(page, /maximumGustValue === 0 \? "Sem pico"/);
  assert.doesNotMatch(page, /Sem pico de chuva|Início da previsão/);
});

test("SIMAGRO mantém imagem oficial e oferece saída direta quando o embed falha", () => {
  assert.match(simagro, /Meteogramas do SIMAGRO RS/);
  assert.match(simagro, /Abrir imagem no SIMAGRO/);
  assert.match(simagro, /href=\{selected\.imageUrl\}/);
  assert.match(simagro, /Abrir SIMAGRO RS/);
  assert.match(simagro, /onError=/);
  assert.doesNotMatch(simagro, /OCR|canvas|getImageData|proxy/i);
  assert.match(simagroStyles, /simagro-model-products__unavailable > div/);
});

test("refino visual do meteograma continua editorial e acessível", () => {
  assert.match(styles, /internal-weather-shell--meteogram \.meteogram-hero/);
  assert.match(styles, /overflow-x: auto/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(refinement, /\.meteogram-overview[\s\S]*border:\s*0/);
  assert.match(refinement, /\.meteogram-footer/);
  assert.doesNotMatch(refinement, /radial-gradient/);
  assert.match(homeContract, /acento técnico mínimo/i);
});

test("meteograma permanece descobrível como página operacional", () => {
  assert.match(publicRoutes, /path: "\/meteograma-pelotas", changeFrequency: "hourly"/);
  assert.match(todayAtmosphere, /to="\/meteograma-pelotas"/);
  assert.match(todayAtmosphere, /Ver previsão detalhada de 24 e 48 horas/);
  assert.match(header, /label: "Meteograma"/);
  assert.match(header, /Temperatura, chuva, pressão, nuvens e vento hora a hora/);
});
