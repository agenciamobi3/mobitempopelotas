import { createUnavailableWeatherIntelligence } from "@/lib/weather/weather-intelligence-fallback";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

import { getInmetFrostOverview } from "./frost.functions";
import type { FrostMapData } from "./frost.types";

function localDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function subtractDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function createUnavailableFrostMap(): FrostMapData {
  const endDate = localDateKey();
  return {
    status: "unavailable",
    filters: {
      startDate: subtractDays(endDate, 29),
      endDate,
      days: 30,
      stationType: "AUTOMATICA",
      state: "RS",
    },
    summary: {
      stations: 0,
      observations: 0,
      lowestTemperature: null,
      strong: 0,
      moderate: 0,
      weak: 0,
      possible: 0,
      undefined: 0,
    },
    stations: [],
    source: {
      name: "INMET",
      endpoint: "https://apitempo.inmet.gov.br/geada",
      portalUrl: "https://portal.inmet.gov.br/paginas/geadas",
      fetchedAt: new Date().toISOString(),
    },
    message: "Os registros de geada do INMET estão temporariamente indisponíveis.",
  };
}

export async function loadFrostPageData() {
  const [frostResult, weatherResult] = await Promise.allSettled([
    getInmetFrostOverview(),
    getWeatherIntelligence(),
  ]);

  return {
    frost: frostResult.status === "fulfilled" ? frostResult.value : createUnavailableFrostMap(),
    weather:
      weatherResult.status === "fulfilled"
        ? weatherResult.value
        : createUnavailableWeatherIntelligence(),
  };
}
