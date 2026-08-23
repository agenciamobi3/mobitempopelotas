import { PUBLIC_REGIONAL_CITIES, type RegionalCity } from "@/lib/regional-cities";

import type {
  RegionalCitiesOverview,
  RegionalCityOverviewItem,
  RegionalOverviewItemStatus,
} from "./regional-cities-overview.types";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const TIMEZONE = "America/Sao_Paulo";
const REQUEST_TIMEOUT_MS = 12_000;

let regionalSnapshot: RegionalCitiesOverview | null = null;

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function numberValue(value: unknown) {
  if (value === null || value === undefined || typeof value === "boolean") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function rounded(value: number | null) {
  return value === null ? null : Math.round(value);
}

function numberArray(value: unknown): Array<number | null> {
  return Array.isArray(value) ? value.map(numberValue) : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function weatherLabel(code: number | null) {
  if (code === 0) return "Céu limpo";
  if (code === 1 || code === 2) return "Parcialmente nublado";
  if (code === 3) return "Céu nublado";
  if (code !== null && code >= 51 && code <= 86) return "Chuva";
  if (code !== null && code >= 95) return "Temporal";
  return "Condição em atualização";
}

function itemStatus(values: Array<number | null>): RegionalOverviewItemStatus {
  const available = values.filter((value) => value !== null).length;
  if (available === 0) return "unavailable";
  return available === values.length ? "live" : "partial";
}

function overviewItem(city: RegionalCity, payload: unknown): RegionalCityOverviewItem {
  const root = record(payload);
  const current = root ? record(root.current) : null;
  const daily = root ? record(root.daily) : null;
  const temperature = rounded(numberValue(current?.temperature_2m));
  const minimum = rounded(numberArray(daily?.temperature_2m_min)[0] ?? null);
  const maximum = rounded(numberArray(daily?.temperature_2m_max)[0] ?? null);
  const rainChance = rounded(numberArray(daily?.precipitation_probability_max)[0] ?? null);
  const windSpeed = rounded(numberValue(current?.wind_speed_10m));

  return {
    city,
    status: itemStatus([temperature, minimum, maximum, rainChance, windSpeed]),
    temperature,
    condition: weatherLabel(numberValue(current?.weather_code)),
    minimum,
    maximum,
    rainChance,
    windSpeed,
    validAt: stringValue(current?.time),
  };
}

function unavailableOverview(message: string): RegionalCitiesOverview {
  return {
    status: "unavailable",
    fetchedAt: new Date().toISOString(),
    items: PUBLIC_REGIONAL_CITIES.map((city) => overviewItem(city, null)),
    source: { name: "Open-Meteo" },
    message,
  };
}

export function buildRegionalCitiesOverviewUrl() {
  const params = new URLSearchParams({
    latitude: PUBLIC_REGIONAL_CITIES.map((city) => city.latitude).join(","),
    longitude: PUBLIC_REGIONAL_CITIES.map((city) => city.longitude).join(","),
    timezone: TIMEZONE,
    forecast_days: "1",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    current: "temperature_2m,weather_code,wind_speed_10m",
    daily: "temperature_2m_min,temperature_2m_max,precipitation_probability_max",
  });

  return `${FORECAST_ENDPOINT}?${params.toString()}`;
}

export function normalizeRegionalCitiesOverview(payload: unknown, fetchedAt = new Date().toISOString()) {
  const responses = Array.isArray(payload) ? payload : [payload];
  const items = PUBLIC_REGIONAL_CITIES.map((city, index) => overviewItem(city, responses[index]));

  return {
    status: items.some((item) => item.status !== "unavailable") ? "live" : "unavailable",
    fetchedAt,
    items,
    source: { name: "Open-Meteo" },
    message: null,
  } as RegionalCitiesOverview;
}

export async function fetchRegionalCitiesOverview(): Promise<RegionalCitiesOverview> {
  try {
    const response = await fetch(buildRegionalCitiesOverviewUrl(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      if (regionalSnapshot) return regionalSnapshot;
      return unavailableOverview(`A visão regional resumida está temporariamente indisponível (HTTP ${response.status}).`);
    }

    regionalSnapshot = normalizeRegionalCitiesOverview(await response.json());
    return regionalSnapshot;
  } catch {
    if (regionalSnapshot) return regionalSnapshot;
    return unavailableOverview("A visão regional resumida está temporariamente indisponível.");
  }
}
