import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import type { LagoonMonitoringNetworkData } from "@/lib/hydrology/lagoon-network.server";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { AggregatedWeatherData } from "@/lib/weather/aggregated-weather.types";
import { reconcileDailyTemperatures } from "../../lib/weather/daily-temperature-reconciliation.ts";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { InmetAlertsData } from "@/production/lib/inmet-alerts";
import { resolveMoonPhase } from "../lib/astronomy.ts";
import type { WeatherAiSummaries } from "@/production/lib/weather-ai-summary";
import type { AstronomyData, CurrentWeather, WeatherData } from "@/production/lib/weather-data";

const DATA_SOURCES_URL = "/status-dos-dados";

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function localDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function forecastTimeLabel(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR") === "agora" ? "Próxima hora" : value;
}

function resolveAstronomy(data: AggregatedWeatherData): AstronomyData {
  const inmetPeriod =
    data.inmetForecast.find((period) => period.sunrise || period.sunset || period.season) ?? null;
  const date = inmetPeriod?.date ?? localDateKey();
  const sunrise = inmetPeriod?.sunrise ?? null;
  const sunset = inmetPeriod?.sunset ?? null;
  const lunar = resolveMoonPhase(date);

  return {
    date,
    sunrise,
    sunset,
    moonPhase: lunar.name,
    season: inmetPeriod?.season ?? null,
    solarSource: sunrise || sunset ? "INMET" : null,
    seasonSource: inmetPeriod?.season ? "INMET" : null,
    lunarSource: lunar.source,
  };
}

function observationSourceName(data: AggregatedWeatherData) {
  return `${data.observation.source.name} · ${data.observation.station.name}`;
}

function unavailableCurrent(data: AggregatedWeatherData): CurrentWeather {
  return {
    available: false,
    city: "Pelotas",
    state: "RS",
    temperature: null,
    feelsLike: null,
    condition: null,
    humidity: null,
    pressure: null,
    windSpeed: null,
    windGust: null,
    windDirection: null,
    visibility: null,
    sunrise: null,
    sunset: null,
    updatedAt: null,
    icon: null,
    source: {
      name: data.observation.source.name,
      url: data.observation.source.url,
      kind: "unavailable",
      observedAt: null,
    },
  };
}

function hasCurrentTemperatureDiscrepancy(data: AggregatedWeatherData) {
  return (data.quality.discrepancies ?? []).some(
    (item) => item.scope === "current" && item.field === "temperature",
  );
}

function observedCurrent(data: AggregatedWeatherData): CurrentWeather {
  const current = data.current;
  const temperatureIsReliable =
    current?.temperature !== null && current?.temperature !== undefined && !hasCurrentTemperatureDiscrepancy(data);

  if (
    !current ||
    data.quality.currentSource !== "defesa-civil-rs" ||
    !temperatureIsReliable
  ) {
    return unavailableCurrent(data);
  }

  return {
    available: true,
    city: current.city,
    state: current.state,
    temperature: current.temperature,
    feelsLike: current.feelsLike,
    condition: null,
    humidity: current.humidity,
    pressure: current.pressure,
    windSpeed: current.windSpeed,
    windGust: current.windGust,
    windDirection: current.windDirection,
    visibility: null,
    sunrise: null,
    sunset: null,
    updatedAt: formatUpdatedAt(current.observedAt),
    icon: null,
    source: {
      name: observationSourceName(data),
      url: data.observation.source.url,
      kind: "observation",
      observedAt: data.observation.source.observedAt,
    },
  };
}

export function toProductionWeatherData(data: AggregatedWeatherData): WeatherData {
  const daily = reconcileDailyTemperatures(data.daily, data.inmetForecast);

  return {
    current: observedCurrent(data),
    hourly: data.hourly.map((hour) => ({
      time: forecastTimeLabel(hour.time),
      timestamp: hour.timestamp,
      temperature: hour.temperature,
      precipitation: hour.precipitationProbability,
      precipitationMm: hour.precipitationMm,
      windSpeed: hour.windSpeed,
      windGust: hour.windGust,
      windDirectionDegrees: hour.windDirectionDegrees,
      icon: hour.icon,
      relativeHumidity: hour.relativeHumidity,
      dewPoint: hour.dewPoint,
      pressure: hour.pressure,
      visibilityKm: hour.visibilityKm,
      cloudCover: hour.cloudCover,
      cloudCoverLow: hour.cloudCoverLow,
      cloudCoverMid: hour.cloudCoverMid,
      cloudCoverHigh: hour.cloudCoverHigh,
      cape: hour.cape,
      boundaryLayerHeight: hour.boundaryLayerHeight,
    })),
    daily: daily.map((day) => ({
      weekday: day.weekday,
      date: day.date,
      dateIso: day.dateIso,
      min: day.min,
      max: day.max,
      rainChance: day.rainChance,
      precipitation: day.precipitationMm,
      windGust: day.windGust,
      icon: day.icon,
    })),
    regional: [],
    astronomy: resolveAstronomy(data),
    source: {
      name: "MOBI Tempo Pelotas",
      url: DATA_SOURCES_URL,
      isFallback: data.status !== "live",
      observationName: observationSourceName(data),
      observationUrl: data.observation.source.url,
      forecastName: data.quality.forecastProvider ?? "Previsão meteorológica indisponível",
      forecastUrl: DATA_SOURCES_URL,
    },
  };
}

export function toProductionAlerts(data: AggregatedWeatherData): InmetAlertsData {
  const alerts = data.alerts;
  const sourceUrl = "https://avisos.inmet.gov.br/";
  return {
    status: data.sources.inmet.usable ? "live" : "unavailable",
    alerts,
    counts: {
      total: alerts.length,
      pelotas: alerts.filter((alert) => alert.relevance === "pelotas").length,
      regional: alerts.filter((alert) => alert.relevance === "regional").length,
      state: alerts.filter((alert) => alert.relevance === "state").length,
    },
    sourceUrl,
    source: {
      name: "INMET",
      feedUrl: "https://apiprevmet3.inmet.gov.br/avisos/rss",
      portalUrl: sourceUrl,
      fetchedAt: data.sources.inmet.fetchedAt,
    },
    error: data.sources.inmet.reason,
  };
}

export function toProductionSummaries(data: WeatherIntelligenceData): WeatherAiSummaries {
  return {
    status: data.intelligence.origin === "gemini" ? "generated" : "unavailable",
    today: { headline: data.brief.headline, summary: data.brief.summary },
    tomorrow: null,
    generatedAt: data.intelligence.generatedAt,
    model: data.intelligence.model,
  };
}

export type ProductionHomeHydrology = {
  laranjal: LaranjalLevelData;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
};