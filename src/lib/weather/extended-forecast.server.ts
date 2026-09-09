import { z } from "zod";

import type {
  ExtendedForecastData,
  ExtendedForecastModel,
} from "./extended-forecast.types";
import { fetchOpenMeteoExtendedPayloadViaEdge } from "./open-meteo-extended-edge.server";
import { fetchOpenMeteoPayloadViaEdge } from "./open-meteo-edge.server";
import type { DailyForecast, WeatherIconName } from "./types";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const GFS_FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/gfs";
const OPEN_METEO_URL = "https://open-meteo.com/";
const TIMEZONE = "America/Sao_Paulo";
const REQUEST_TIMEOUT_MS = 2_200;
const TOTAL_FETCH_BUDGET_MS = 2_550;
const EXTENDED_EDGE_MAX_WAIT_MS = 900;
const LEGACY_EDGE_MAX_WAIT_MS = 500;
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

type DirectForecastCandidate = {
  endpoint: string;
  model: Extract<ExtendedForecastModel, "Open-Meteo Best Match" | "NOAA GFS">;
};

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

function createSource(
  returnedDays: number,
  model: ExtendedForecastModel = "Open-Meteo Best Match",
  fetchedAt = new Date().toISOString(),
): ExtendedForecastData["source"] {
  return {
    name: "Open-Meteo",
    url: OPEN_METEO_URL,
    fetchedAt,
    model,
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

export function normalizeExtendedForecast(
  response: ExtendedForecastResponse,
  model: ExtendedForecastModel = "Open-Meteo Best Match",
  fetchedAt = new Date().toISOString(),
): ExtendedForecastData {
  const days = normalizeDays(response);
  if (days.length === 0) {
    return {
      status: "unavailable",
      days: [],
      source: createSource(0, model, fetchedAt),
      message: "O Open-Meteo respondeu, mas não forneceu dias utilizáveis para a previsão estendida.",
    };
  }

  const complete = days.length >= EXTENDED_FORECAST_DAYS;
  return {
    status: complete ? "live" : "partial",
    days,
    source: createSource(days.length, model, fetchedAt),
    message: complete
      ? null
      : `A fonte retornou ${days.length} dos ${EXTENDED_FORECAST_DAYS} dias solicitados.`,
  };
}

function buildExtendedForecastUrl(endpoint: string) {
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

  return `${endpoint}?${params.toString()}`;
}

export function createExtendedForecastUrl() {
  return buildExtendedForecastUrl(FORECAST_ENDPOINT);
}

export function createGfsExtendedForecastUrl() {
  return buildExtendedForecastUrl(GFS_FORECAST_ENDPOINT);
}

function logInvalidPayload(prefix: string, error: z.ZodError) {
  console.error(prefix, {
    issues: error.issues.slice(0, 10).map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}

async function fetchDirectExtendedForecast(
  candidate: DirectForecastCandidate,
): Promise<ExtendedForecastData | null> {
  try {
    const response = await fetch(buildExtendedForecastUrl(candidate.endpoint), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "MOBI-Tempo-Pelotas/2.0 (+https://tempopelotas.com.br)",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`${candidate.model} respondeu com status ${response.status}`);
    }

    const payload: unknown = await response.json();
    const parsed = extendedForecastResponseSchema.safeParse(payload);
    if (!parsed.success) {
      logInvalidPayload(
        `[weather/extended-forecast] Resposta inválida de ${candidate.model}`,
        parsed.error,
      );
      return null;
    }

    const normalized = normalizeExtendedForecast(parsed.data, candidate.model);
    return normalized.status === "unavailable" ? null : normalized;
  } catch (error) {
    console.warn("[weather/extended-forecast] Candidato direto indisponível", {
      model: candidate.model,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function fetchExtendedForecastEdgeFallback(): Promise<ExtendedForecastData | null> {
  try {
    const edge = await fetchOpenMeteoExtendedPayloadViaEdge();
    const parsed = extendedForecastResponseSchema.safeParse(edge.payload);
    if (!parsed.success) {
      logInvalidPayload(
        "[weather/extended-forecast] Cache Edge estendido sem série diária compatível",
        parsed.error,
      );
      return null;
    }

    const fallback = normalizeExtendedForecast(
      parsed.data,
      edge.model,
      edge.fetchedAt ?? new Date().toISOString(),
    );
    if (fallback.status === "unavailable") return null;

    return {
      ...fallback,
      message:
        edge.warning ??
        (fallback.status === "partial"
          ? `A contingência estendida preservou ${fallback.days.length} dos ${EXTENDED_FORECAST_DAYS} dias solicitados.`
          : null),
    };
  } catch (error) {
    console.warn("[weather/extended-forecast] Cache Edge estendido indisponível", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function fetchLegacySevenDayEdgeFallback(): Promise<ExtendedForecastData | null> {
  try {
    const edge = await fetchOpenMeteoPayloadViaEdge();
    const parsed = extendedForecastResponseSchema.safeParse(edge.payload);
    if (!parsed.success) return null;

    const fallback = normalizeExtendedForecast(parsed.data);
    if (fallback.status === "unavailable") return null;

    return {
      ...fallback,
      source: {
        ...fallback.source,
        model: "Open-Meteo 7-day Cache",
        fetchedAt: edge.fetchedAt ?? fallback.source.fetchedAt,
      },
      message: `A consulta direta de 15 dias não respondeu; exibindo ${fallback.days.length} dias preservados pela contingência Open-Meteo de 7 dias.`,
    };
  } catch (error) {
    console.warn("[weather/extended-forecast] Contingência legada de 7 dias indisponível", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function preferBroaderForecast(
  candidates: Array<ExtendedForecastData | null>,
): ExtendedForecastData | null {
  let selected: ExtendedForecastData | null = null;

  for (const candidate of candidates) {
    if (!candidate || candidate.status === "unavailable" || candidate.days.length === 0) continue;
    if (!selected || candidate.days.length > selected.days.length) {
      selected = candidate;
    }
  }

  return selected;
}

function remainingBudget(startedAt: number, capMs: number) {
  const remaining = TOTAL_FETCH_BUDGET_MS - (Date.now() - startedAt);
  return Math.max(0, Math.min(capMs, remaining));
}

async function settleWithin<T>(promise: Promise<T>, waitMs: number): Promise<T | null> {
  if (waitMs <= 0) return null;

  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => resolve(null), waitMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function fetchPelotasExtendedForecast(): Promise<ExtendedForecastData> {
  const startedAt = Date.now();
  const bestMatchCandidate: DirectForecastCandidate = {
    endpoint: FORECAST_ENDPOINT,
    model: "Open-Meteo Best Match",
  };
  const gfsCandidate: DirectForecastCandidate = {
    endpoint: GFS_FORECAST_ENDPOINT,
    model: "NOAA GFS",
  };

  // O cache estendido começa a ser lido junto com as consultas diretas. Assim,
  // se os upstreams consumirem quase todo o budget de 2,2 s, a contingência já
  // teve tempo para responder e não precisa começar do zero no fim da janela.
  const extendedEdgePromise = fetchExtendedForecastEdgeFallback();

  const [bestMatch, gfs] = await Promise.all([
    fetchDirectExtendedForecast(bestMatchCandidate),
    fetchDirectExtendedForecast(gfsCandidate),
  ]);

  const direct = preferBroaderForecast([bestMatch, gfs]);
  if (direct?.status === "live") return direct;

  const extendedEdge = await settleWithin(
    extendedEdgePromise,
    remainingBudget(startedAt, EXTENDED_EDGE_MAX_WAIT_MS),
  );
  const extended = preferBroaderForecast([direct, extendedEdge]);
  if (extended?.status === "live" || (extended && extended.days.length >= 7)) {
    return extended;
  }

  const legacySevenDay = await settleWithin(
    fetchLegacySevenDayEdgeFallback(),
    remainingBudget(startedAt, LEGACY_EDGE_MAX_WAIT_MS),
  );
  const selected = preferBroaderForecast([extended, legacySevenDay]);

  return (
    selected ??
    createUnavailableExtendedForecast(
      "A previsão de 15 dias está temporariamente indisponível.",
    )
  );
}
