import type { EmbrapaHealthSnapshot } from "./embrapa-health.server";
import { getEmbrapaHealthSnapshot } from "./embrapa-health.functions";
import type { EmbrapaHistorySnapshot } from "./embrapa-history.server";
import { getEmbrapaHistory24h } from "./embrapa-history.functions";
import { createUnavailableWeatherIntelligence } from "./weather-intelligence-fallback";
import { getWeatherIntelligence } from "./weather-intelligence.functions";

function createUnavailableEmbrapaHealthSnapshot(): EmbrapaHealthSnapshot {
  return {
    stationId: "embrapa-cpact-sede-pelotas",
    stationName: "Posto Meteorológico da Sede",
    level: "unavailable",
    collector: {
      enabled: false,
      lastAttemptAt: null,
      lastSuccessAt: null,
      attemptAgeMinutes: null,
      successAgeMinutes: null,
      consecutiveFailures: 0,
      lastDurationMs: null,
      lastOutcome: null,
      successfulCollects: 0,
      failedCollects: 0,
    },
    data: {
      status: "unavailable",
      fetchedAt: null,
      observationTime: null,
      lastDataChangeAt: null,
      temperatureAvailable: false,
      humidityAvailable: false,
      pressureAvailable: false,
      windAvailable: false,
      rainAvailable: false,
    },
    history: {
      total: 0,
      last24Hours: 0,
      firstAt: null,
      latestAt: null,
    },
    alerts: {
      openCount: 0,
      criticalCount: 0,
      warningCount: 0,
      items: [],
    },
    generatedAt: new Date().toISOString(),
  };
}

function createUnavailableEmbrapaHistorySnapshot(): EmbrapaHistorySnapshot {
  return {
    status: "unavailable",
    windowHours: 24,
    bucketMinutes: 10,
    sampleCount: 0,
    pointCount: 0,
    coverageMinutes: 0,
    from: null,
    to: null,
    generatedAt: new Date().toISOString(),
    points: [],
    summary: {
      temperatureMin: null,
      temperatureMax: null,
      humidityMin: null,
      humidityMax: null,
      pressureMin: null,
      pressureMax: null,
      windMax: null,
      rainTotal: null,
    },
  };
}

export async function loadEmbrapaStationPageData() {
  const [dataResult, healthResult, historyResult] = await Promise.allSettled([
    getWeatherIntelligence(),
    getEmbrapaHealthSnapshot(),
    getEmbrapaHistory24h(),
  ]);

  return {
    data:
      dataResult.status === "fulfilled"
        ? dataResult.value
        : createUnavailableWeatherIntelligence(),
    health:
      healthResult.status === "fulfilled"
        ? healthResult.value
        : createUnavailableEmbrapaHealthSnapshot(),
    history:
      historyResult.status === "fulfilled"
        ? historyResult.value
        : createUnavailableEmbrapaHistorySnapshot(),
  };
}
