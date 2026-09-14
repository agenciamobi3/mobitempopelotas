import { useEffect, useState } from "react";

import { getPelotasExtendedForecast } from "@/lib/weather/extended-forecast.functions";
import type {
  ExtendedForecastData,
  ExtendedForecastModel,
} from "@/lib/weather/extended-forecast.types";
import type { DailyForecast, WeatherIconName } from "@/lib/weather/types";

const EXTENDED_FORECAST_DAYS = 15;
const REQUEST_TIMEOUT_MS = 12_000;
const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const GFS_ENDPOINT = "https://api.open-meteo.com/v1/gfs";
const OPEN_METEO_URL = "https://open-meteo.com/";

type BrowserForecastModel = Extract<
  ExtendedForecastModel,
  "Open-Meteo Best Match" | "NOAA GFS" | "ECMWF IFS"
>;

type BrowserForecastCandidate = {
  endpoint: string;
  model: BrowserForecastModel;
  models?: string;
  supportsPrecipitationProbability?: boolean;
};

type OpenMeteoExtendedPayload = {
  daily?: Record<string, unknown>;
};

const BROWSER_CANDIDATES: readonly BrowserForecastCandidate[] = [
  {
    endpoint: FORECAST_ENDPOINT,
    model: "Open-Meteo Best Match",
  },
  {
    endpoint: GFS_ENDPOINT,
    model: "NOAA GFS",
  },
  {
    endpoint: FORECAST_ENDPOINT,
    model: "ECMWF IFS",
    models: "ecmwf_ifs",
    supportsPrecipitationProbability: false,
  },
];

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null;
}

function numberArray(value: unknown): Array<number | null> | null {
  return Array.isArray(value) &&
    value.every((item) => item === null || (typeof item === "number" && Number.isFinite(item)))
    ? value
    : null;
}

function weatherCodeToIcon(code: number | null | undefined): WeatherIconName {
  if (code === 0) return "sun";
  if (code === 1 || code === 2) return "partly-cloudy";
  if (code === 3 || code === 45 || code === 48) return "cloud";
  if (code !== null && code !== undefined && code >= 51 && code <= 86) return "rain";
  if (code !== null && code !== undefined && code >= 95) return "storm";
  return "cloud";
}

function formatDay(date: string, index: number) {
  if (index === 0) return "Hoje";
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(".", "")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(" de ", " ")
    .replace(".", "");
}

function buildUrl(candidate: BrowserForecastCandidate) {
  const daily = [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    ...(candidate.supportsPrecipitationProbability === false
      ? []
      : ["precipitation_probability_max"]),
    "precipitation_sum",
    "wind_gusts_10m_max",
  ];

  const params = new URLSearchParams({
    latitude: "-31.7654",
    longitude: "-52.3376",
    timezone: "America/Sao_Paulo",
    forecast_days: String(EXTENDED_FORECAST_DAYS),
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timeformat: "iso8601",
    cell_selection: "land",
    daily: daily.join(","),
  });

  if (candidate.models) params.set("models", candidate.models);
  return `${candidate.endpoint}?${params.toString()}`;
}

function normalizeCandidate(
  payload: unknown,
  candidate: BrowserForecastCandidate,
): ExtendedForecastData | null {
  if (!payload || typeof payload !== "object") return null;
  const daily = (payload as OpenMeteoExtendedPayload).daily;
  if (!daily) return null;

  const times = stringArray(daily.time);
  const weatherCodes = numberArray(daily.weather_code);
  const maximums = numberArray(daily.temperature_2m_max);
  const minimums = numberArray(daily.temperature_2m_min);
  const rainChances = numberArray(daily.precipitation_probability_max);
  const precipitation = numberArray(daily.precipitation_sum);
  const windGusts = numberArray(daily.wind_gusts_10m_max);

  if (!times || !weatherCodes || !maximums || !minimums || !precipitation || !windGusts) {
    return null;
  }

  const days: DailyForecast[] = [];
  for (let index = 0; index < Math.min(EXTENDED_FORECAST_DAYS, times.length); index += 1) {
    const date = times[index];
    const minimum = minimums[index];
    const maximum = maximums[index];
    const precipitationMm = precipitation[index];
    if (!date || minimum === null || maximum === null || precipitationMm === null) continue;

    const rainChance = rainChances?.[index];
    const windGust = windGusts[index];

    days.push({
      weekday: formatDay(date, index),
      date: formatDate(date),
      dateIso: date,
      min: Math.round(minimum),
      max: Math.round(maximum),
      rainChance: rainChance === null || rainChance === undefined ? null : Math.round(rainChance),
      precipitationMm: Number(precipitationMm.toFixed(1)),
      windGust: windGust === null || windGust === undefined ? null : Math.round(windGust),
      icon: weatherCodeToIcon(weatherCodes[index]),
    });
  }

  if (days.length === 0) return null;

  const complete = days.length >= EXTENDED_FORECAST_DAYS;
  const fetchedAt = new Date().toISOString();
  return {
    status: complete ? "live" : "partial",
    days,
    source: {
      name: "Open-Meteo",
      url: OPEN_METEO_URL,
      fetchedAt,
      model: candidate.model,
      requestedDays: EXTENDED_FORECAST_DAYS,
      returnedDays: days.length,
    },
    message: complete
      ? null
      : `A recuperação no navegador retornou ${days.length} dos ${EXTENDED_FORECAST_DAYS} dias solicitados.`,
  };
}

function preferBroaderForecast(
  candidates: Array<ExtendedForecastData | null | undefined>,
): ExtendedForecastData | null {
  let selected: ExtendedForecastData | null = null;
  for (const candidate of candidates) {
    if (!candidate || candidate.status === "unavailable" || candidate.days.length === 0) continue;
    if (!selected || candidate.days.length > selected.days.length) selected = candidate;
  }
  return selected;
}

async function fetchCandidate(
  candidate: BrowserForecastCandidate,
  signal: AbortSignal,
): Promise<ExtendedForecastData | null> {
  try {
    const response = await fetch(buildUrl(candidate), {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) return null;
    return normalizeCandidate(await response.json(), candidate);
  } catch {
    return null;
  }
}

export function hasCompleteExtendedForecast(data: ExtendedForecastData) {
  return data.status === "live" && data.days.length >= EXTENDED_FORECAST_DAYS;
}

/**
 * O SSR continua rápido e auditável. Quando ele cai na contingência de 7 dias,
 * o navegador tenta novamente a função pública e, se necessário, consulta as
 * três fontes públicas de 15 dias diretamente. Assim uma falha transitória do
 * runtime não congela a página na janela curta até o próximo deploy/cache.
 */
export function useExtendedForecastBrowserRecovery(baseline: ExtendedForecastData) {
  const [forecast, setForecast] = useState(baseline);

  useEffect(() => {
    setForecast(baseline);
    if (hasCompleteExtendedForecast(baseline)) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let active = true;

    void (async () => {
      let best = baseline;

      try {
        const serverRecovered = await getPelotasExtendedForecast();
        best = preferBroaderForecast([best, serverRecovered]) ?? best;
        if (active) {
          setForecast((current) => preferBroaderForecast([current, best]) ?? current);
        }
        if (hasCompleteExtendedForecast(best)) return;
      } catch {
        // A recuperação direta abaixo não depende do sucesso da server function.
      }

      const recovered = await Promise.all(
        BROWSER_CANDIDATES.map((candidate) => fetchCandidate(candidate, controller.signal)),
      );
      best = preferBroaderForecast([best, ...recovered]) ?? best;
      if (active) {
        setForecast((current) => preferBroaderForecast([current, best]) ?? current);
      }
    })()
      .catch(() => {
        // O baseline continua publicável mesmo se todas as recuperações falharem.
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [baseline]);

  return forecast;
}
