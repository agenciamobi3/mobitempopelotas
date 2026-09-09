import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import type { AggregatedWeatherData } from "../src/lib/weather/aggregated-weather.types.ts";
import { toProductionWeatherData } from "../src/production/adapters/home.ts";

const HERO_FACTS_CSS = new URL(
  "../src/production/components/weather-hero-facts.css",
  import.meta.url,
);
const HOME_STATUS_CSS = new URL(
  "../src/production/styles/home-editorial-status-refinements.css",
  import.meta.url,
);

function weatherWithObservedTemperatureDiscrepancy(): AggregatedWeatherData {
  return {
    status: "degraded",
    current: {
      city: "Pelotas",
      state: "RS",
      temperature: 11,
      feelsLike: 10,
      condition: null,
      humidity: 94,
      pressure: 1019,
      windSpeed: 14,
      windGust: null,
      windDirection: "E",
      visibilityKm: null,
      sunrise: null,
      sunset: null,
      observedAt: "2026-09-09T03:21:00-03:00",
      icon: null,
    },
    currentProvenance: {},
    hourly: [
      {
        time: "Agora",
        timestamp: "2026-09-09T04:00:00-03:00",
        temperature: 7,
        precipitationProbability: 0,
        precipitationMm: 0,
        windSpeed: 12,
        windGust: null,
        windDirectionDegrees: 90,
        icon: "cloud",
      },
    ],
    daily: [],
    observation: {
      status: "live",
      station: {
        code: "Z3",
        name: "Pelotas - Colônia Z3",
        basin: null,
        region: "Pelotas",
        latitude: null,
        longitude: null,
        altitudeM: null,
        distanceFromPelotasKm: null,
      },
      current: {
        temperature: 11,
        feelsLike: 10,
        humidity: 94,
        dewPoint: null,
        pressure: 1019,
        windSpeed: 14,
        windGust: null,
        windDirection: "E",
        windDirectionDegrees: 90,
      },
      rain: { h1Mm: 0, h3Mm: 0, h6Mm: 0, h12Mm: 0, h24Mm: 0 },
      source: {
        name: "Defesa Civil RS — Rede de Monitoramento Hidrometeorológico",
        url: "https://redehidrometeorologica.defesacivil.rs.gov.br/Mapa",
        documentationUrl: "https://redehidrometeorologica.defesacivil.rs.gov.br/Mapa",
        fetchedAt: "2026-09-09T06:21:00.000Z",
        observedAt: "2026-09-09T03:21:00-03:00",
      },
      error: null,
    },
    alerts: [],
    inmetForecast: [],
    inmetStation: null,
    officialForecast: [],
    sources: {} as AggregatedWeatherData["sources"],
    quality: {
      score: 80,
      confidence: "medium",
      currentSource: "defesa-civil-rs",
      forecastSource: "open-meteo",
      forecastProvider: "Open-Meteo",
      degradedSources: [],
      observationAgeMinutes: 4,
      discrepancies: [
        {
          scope: "current",
          field: "temperature",
          severity: "notice",
          referenceSource: "open-meteo",
          comparisonSource: "defesa-civil-rs",
          referenceValue: 7,
          comparisonValue: 11,
          difference: 4,
          unit: "°C",
          day: null,
        },
      ],
      notes: [],
    },
    source: {
      name: "MOBI Tempo Pelotas",
      kind: "aggregated",
      fetchedAt: "2026-09-09T06:21:00.000Z",
    },
    message: null,
  };
}

test("divergência da previsão não apaga uma observação atual válida", () => {
  const weather = toProductionWeatherData(weatherWithObservedTemperatureDiscrepancy());

  assert.equal(weather.current.available, true);
  assert.equal(weather.current.temperature, 11);
  assert.equal(weather.hourly[0]?.time, "Próxima hora");
  assert.equal(weather.hourly[0]?.temperature, 7);
});

test("overlay do hero usa preto neutro mais leve e blur que termina antes da direita", async () => {
  const css = await readFile(HERO_FACTS_CSS, "utf8");

  assert.match(css, /\.site-shell--home-editorial \.tp-home-hero__overlay\s*\{/);
  assert.match(css, /rgb\(0 0 0 \/ 74%\)/);
  assert.match(css, /rgb\(0 0 0 \/ 3%\)/);
  assert.match(css, /backdrop-filter: blur\(10px\)/);
  assert.match(css, /transparent 82%/);
  assert.doesNotMatch(css, /rgb\(0 0 0 \/ 82%\) 0%/);
  assert.doesNotMatch(css, /rgb\(4 18 31 \/ 88%\)/);
});

test("falha total não volta ao card branco de atualização", async () => {
  const css = await readFile(HOME_STATUS_CSS, "utf8");

  assert.match(css, /\.production-weather-unavailable\s*\{/);
  assert.match(css, /background: #071b2c/);
  assert.match(css, /min-height: 590px/);
  assert.match(css, /tp-home-empty-skeleton-shimmer/);
  assert.match(css, /\.production-weather-unavailable > \*\s*\{\s*opacity: 0;/);
});
