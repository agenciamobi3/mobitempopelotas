import { z } from "zod";

import type { ExtendedForecastData } from "./extended-forecast.types";
import { fetchOpenMeteoPayloadViaEdge } from "./open-meteo-edge.server";
import type { DailyForecast, WeatherIconName } from "./types";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_URL = "https://open-meteo.com/";
const TIMEZONE = "America/Sao_Paulo";
const REQUEST_TIMEOUT_MS = 2_200;
export const EXTENDED_FORECAST_DAYS = 15 as const;

const PELOTAS = {
  latitude: -31.7654,
  longitude: -52.3376,
} as const;

const finiteNumber = z.number().finite();
const nullableFiniteNumberArray = z.array(finiteNumber.nullable()).min(1);
const timeArray = z.array(z.string().min(1)).min(1);

const extendedForecastResponseSchema = z
  .object({
    daily: z.object({
      time: timeArray,
      weather_code: nullableFiniteNumberArray,
      temperature_2m_max: nullableFiniteNumberArray,
      temperature_2m_min: nullableFiniteNumberArray,
      precipitation_probability_max: nullableFiniteNumberArray,
      precipitation_sum: nullableFiniteNumberArray,
      wind_gusts_10m_max: nullableFiniteNumberArray,
    }),
  })
  .superRefine((data, context) => {
    const expectedLength = data.daily.time.length;
    for (const [key, values] of Object.entries(data.daily)) {
      if (values.length !== expectedLength) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["daily", key],
          message: "Série diária incompleta",
        });
      }
    }
  });

type ExtendedForecastResponse = z.infer<typeof extendedForecastResponseSchema>;

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

function createSource(returnedDays: number): ExtendedForecastData["source"] {
  return {
    name: "Open-Meteo",
    url: OPEN_METEO_URL,
    fetchedAt: new Date().toISOString(),
    model: "Open-Meteo Best Match",
    requestedDays: EXTENDED_FORECAST_DAYS,
    returnedDays,
  };
}

export function createUnavailableExtendedForecast(message: string): ExtendedForecastData {
  return {
    status: "unavailable",
    days: [],
    source: createSource(0),
    message,
  };
}

function normalizeDays(response: ExtendedForecastResponse): DailyForecast[] {
  const days: DailyForecast[] = [];

  response.daily.time.slice(0, EXTENDED_FORECAST_DAYS).forEach((date, index) => {
    const minimum = response.daily.temperature_2m_min[index];
    const maximum = response.daily.temperature_2m_max[index];
    const precipitationMm = response.daily.precipitation_sum[index];

    if (
      minimum === null ||
      minimum === undefined ||
      maximum === null ||
      maximum === undefined ||
      precipitationMm === null ||
      precipitationMm === undefined
    ) {
      return;
    }

    const rainChance = response.daily.precipitation_probability_max[index];
    const windGust = response.daily.wind_gusts_10m_max[index];

    days.push({
      weekday: formatDay(date, index),
      date: formatDate(date),
      dateIso: date,
      min: Math.round(minimum),
      max: Math.round(maximum),
      rainChance: rainChance === null || rainChance === undefined ? null : Math.round(rainChance),
      precipitationMm: Number(precipitationMm.toFixed(1)),
      windGust: windGust === null || windGust === undefined ? null : Math.round(windGust),
      icon: weatherCodeToIcon(response.daily.weather_code[index]),
    });
  });

  return days;
}

export function normalizeExtendedForecast(response: ExtendedForecastResponse): ExtendedForecastData {
  const days = normalizeDays(response);
  if (days.length === 0) {
    return createUnavailableExtendedForecast(
      "O Open-Meteo respondeu, mas não forneceu dias utilizáveis para a previsão estendida.",
    );
  }

  const complete = days.length >= EXTENDED_FORECAST_DAYS;
  return {
    status: complete ? "live" : "partial",
    days,
    source: createSource(days.length),
    message: complete
      ? null
      : `A fonte retornou ${days.length} dos ${EXTENDED_FORECAST_DAYS} dias solicitados.`,
  };
}

export function createExtendedForecastUrl() {
  const params = new URLSearchParams({
    latitude: String(PELOTAS.latitude),
    longitude: String(PELOTAS.longitude),
    timezone: TIMEZONE,
    forecast_days: String(EXTENDED_FORECAST_DAYS),
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timeformat: "iso8601",
    cell_selection: "land",
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_gusts_10m_max",
    ].join(","),
  });

  return `${FORECAST_ENDPOINT}?${params.toString()}`;
}

function logExtendedForecastError(error: unknown) {
  console.error("[weather/extended-forecast] Falha ao carregar previsão de 15 dias", {
    message: error instanceof Error ? error.message : String(error),
  });
}

function logInvalidPayload(prefix: string, error: z.ZodError) {
  console.error(prefix, {
    issues: error.issues.slice(0, 10).map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}

async function fetchExtendedForecastEdgeFallback(): Promise<ExtendedForecastData | null> {
  try {
    const edge = await fetchOpenMeteoPayloadViaEdge();
    const parsed = extendedForecastResponseSchema.safeParse(edge.payload);
    if (!parsed.success) {
      logInvalidPayload(
        "[weather/extended-forecast] Contingência Edge sem série diária compatível",
        parsed.error,
      );
      return null;
    }

    const fallback = normalizeExtendedForecast(parsed.data);
    if (fallback.status === "unavailable") return null;

    return {
      ...fallback,
      source: {
        ...fallback.source,
        fetchedAt: edge.fetchedAt ?? fallback.source.fetchedAt,
      },
      message: `A consulta direta de 15 dias não respondeu; exibindo ${fallback.days.length} dias preservados pela contingência Open-Meteo.`,
    };
  } catch (error) {
    console.warn("[weather/extended-forecast] Contingência Edge indisponível", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function fetchPelotasExtendedForecast(): Promise<ExtendedForecastData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(createExtendedForecastUrl(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "MOBI-Tempo-Pelotas/2.0 (+https://tempopelotas.com.br)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo respondeu com status ${response.status}`);
    }

    const payload: unknown = await response.json();
    const parsed = extendedForecastResponseSchema.safeParse(payload);
    if (!parsed.success) {
      logInvalidPayload("[weather/extended-forecast] Resposta inválida", parsed.error);
      const fallback = await fetchExtendedForecastEdgeFallback();
      return (
        fallback ??
        createUnavailableExtendedForecast(
          "A previsão estendida foi recebida, mas não pôde ser processada.",
        )
      );
    }

    const direct = normalizeExtendedForecast(parsed.data);
    if (direct.status !== "unavailable") return direct;

    const fallback = await fetchExtendedForecastEdgeFallback();
    return fallback ?? direct;
  } catch (error) {
    logExtendedForecastError(error);
    const fallback = await fetchExtendedForecastEdgeFallback();
    return (
      fallback ??
      createUnavailableExtendedForecast(
        "A previsão de 15 dias está temporariamente indisponível.",
      )
    );
  } finally {
    clearTimeout(timeout);
  }
}
