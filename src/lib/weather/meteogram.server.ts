import { z } from "zod";

const BEST_MATCH_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const GFS_ENDPOINT = "https://api.open-meteo.com/v1/gfs";
const SOURCE_URL = "https://open-meteo.com/";
const TIMEZONE = "America/Sao_Paulo";
const REQUEST_TIMEOUT_MS = 2_100;
const FORECAST_HOURS = 48;

const PELOTAS = {
  latitude: -31.7654,
  longitude: -52.3376,
} as const;

const finiteNumber = z.number().finite();
const nullableNumber = finiteNumber.nullable();
const numberSeries = z.array(nullableNumber).min(1);
const optionalNumberSeries = numberSeries.optional();
const timeSeries = z.array(z.string().min(1)).min(1);

const responseSchema = z
  .object({
    latitude: finiteNumber.optional(),
    longitude: finiteNumber.optional(),
    timezone: z.string().optional(),
    utc_offset_seconds: finiteNumber.optional(),
    generationtime_ms: finiteNumber.optional(),
    hourly: z.object({
      time: timeSeries,
      temperature_2m: numberSeries,
      apparent_temperature: optionalNumberSeries,
      relative_humidity_2m: optionalNumberSeries,
      dew_point_2m: optionalNumberSeries,
      precipitation_probability: optionalNumberSeries,
      precipitation: optionalNumberSeries,
      pressure_msl: optionalNumberSeries,
      cloud_cover: optionalNumberSeries,
      cloud_cover_low: optionalNumberSeries,
      cloud_cover_mid: optionalNumberSeries,
      cloud_cover_high: optionalNumberSeries,
      visibility: optionalNumberSeries,
      cape: optionalNumberSeries,
      boundary_layer_height: optionalNumberSeries,
      wind_speed_10m: numberSeries,
      wind_gusts_10m: numberSeries,
      wind_direction_10m: optionalNumberSeries,
      weather_code: optionalNumberSeries,
      is_day: optionalNumberSeries,
    }),
  })
  .superRefine((data, context) => {
    const length = data.hourly.time.length;
    for (const [key, values] of Object.entries(data.hourly)) {
      if (Array.isArray(values) && values.length !== length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hourly", key],
          message: "Série horária incompleta",
        });
      }
    }
  });

type MeteogramPayload = z.infer<typeof responseSchema>;
export type MeteogramModel = "Best Match" | "NOAA GFS";

export type MeteogramHour = {
  timestamp: string;
  temperature: number | null;
  feelsLike: number | null;
  relativeHumidity: number | null;
  dewPoint: number | null;
  precipitationProbability: number | null;
  precipitationMm: number | null;
  pressure: number | null;
  cloudCover: number | null;
  cloudCoverLow: number | null;
  cloudCoverMid: number | null;
  cloudCoverHigh: number | null;
  visibilityKm: number | null;
  cape: number | null;
  boundaryLayerHeight: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirectionDegrees: number | null;
  weatherCode: number | null;
  isDay: boolean | null;
};

export type MeteogramData = {
  status: "live" | "unavailable";
  hours: MeteogramHour[];
  source: {
    name: "Open-Meteo";
    model: MeteogramModel;
    url: string;
    fetchedAt: string;
    timezone: "America/Sao_Paulo";
    temporalResolutionMinutes: 60;
    forecastHours: 48;
    generationTimeMs: number | null;
  };
  message: string | null;
};

type MeteogramCandidate = {
  endpoint: string;
  model: MeteogramModel;
  includeBoundaryLayerHeight: boolean;
};

const COMMON_HOURLY_VARIABLES = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "dew_point_2m",
  "precipitation_probability",
  "precipitation",
  "pressure_msl",
  "cloud_cover",
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
] as const;

function decimal(value: number | null | undefined, digits = 1) {
  return value === null || value === undefined ? null : Number(value.toFixed(digits));
}

function integer(value: number | null | undefined) {
  return value === null || value === undefined ? null : Math.round(value);
}

function seriesValue(values: Array<number | null> | undefined, index: number) {
  return values?.[index] ?? null;
}

function normalize(
  payload: MeteogramPayload,
  fetchedAt: Date,
  model: MeteogramModel,
): MeteogramData {
  const hours = payload.hourly.time.slice(0, FORECAST_HOURS).map<MeteogramHour>((timestamp, index) => ({
    timestamp,
    temperature: decimal(seriesValue(payload.hourly.temperature_2m, index)),
    feelsLike: decimal(seriesValue(payload.hourly.apparent_temperature, index)),
    relativeHumidity: integer(seriesValue(payload.hourly.relative_humidity_2m, index)),
    dewPoint: decimal(seriesValue(payload.hourly.dew_point_2m, index)),
    precipitationProbability: integer(seriesValue(payload.hourly.precipitation_probability, index)),
    precipitationMm: decimal(seriesValue(payload.hourly.precipitation, index)),
    pressure: decimal(seriesValue(payload.hourly.pressure_msl, index)),
    cloudCover: integer(seriesValue(payload.hourly.cloud_cover, index)),
    cloudCoverLow: integer(seriesValue(payload.hourly.cloud_cover_low, index)),
    cloudCoverMid: integer(seriesValue(payload.hourly.cloud_cover_mid, index)),
    cloudCoverHigh: integer(seriesValue(payload.hourly.cloud_cover_high, index)),
    visibilityKm:
      seriesValue(payload.hourly.visibility, index) === null
        ? null
        : decimal((seriesValue(payload.hourly.visibility, index) as number) / 1_000),
    cape: integer(seriesValue(payload.hourly.cape, index)),
    boundaryLayerHeight: integer(seriesValue(payload.hourly.boundary_layer_height, index)),
    windSpeed: decimal(seriesValue(payload.hourly.wind_speed_10m, index)),
    windGust: decimal(seriesValue(payload.hourly.wind_gusts_10m, index)),
    windDirectionDegrees: integer(seriesValue(payload.hourly.wind_direction_10m, index)),
    weatherCode: integer(seriesValue(payload.hourly.weather_code, index)),
    isDay:
      seriesValue(payload.hourly.is_day, index) === null
        ? null
        : seriesValue(payload.hourly.is_day, index) !== 0,
  }));

  return {
    status: hours.length ? "live" : "unavailable",
    hours,
    source: {
      name: "Open-Meteo",
      model,
      url: SOURCE_URL,
      fetchedAt: fetchedAt.toISOString(),
      timezone: TIMEZONE,
      temporalResolutionMinutes: 60,
      forecastHours: FORECAST_HOURS,
      generationTimeMs: payload.generationtime_ms ?? null,
    },
    message:
      hours.length >= FORECAST_HOURS
        ? null
        : hours.length
          ? `${hours.length} de ${FORECAST_HOURS} horários estão disponíveis nesta atualização.`
          : "O modelo não retornou horários utilizáveis para Pelotas.",
  };
}

function unavailable(message: string, fetchedAt = new Date()): MeteogramData {
  return {
    status: "unavailable",
    hours: [],
    source: {
      name: "Open-Meteo",
      model: "Best Match",
      url: SOURCE_URL,
      fetchedAt: fetchedAt.toISOString(),
      timezone: TIMEZONE,
      temporalResolutionMinutes: 60,
      forecastHours: FORECAST_HOURS,
      generationTimeMs: null,
    },
    message,
  };
}

function buildMeteogramUrl(candidate: MeteogramCandidate) {
  const hourly = candidate.includeBoundaryLayerHeight
    ? [...COMMON_HOURLY_VARIABLES, "boundary_layer_height"]
    : [...COMMON_HOURLY_VARIABLES];

  const params = new URLSearchParams({
    latitude: String(PELOTAS.latitude),
    longitude: String(PELOTAS.longitude),
    timezone: TIMEZONE,
    forecast_hours: String(FORECAST_HOURS),
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timeformat: "iso8601",
    cell_selection: "land",
    hourly: hourly.join(","),
  });

  return `${candidate.endpoint}?${params.toString()}`;
}

export function createMeteogramUrl() {
  return buildMeteogramUrl({
    endpoint: BEST_MATCH_ENDPOINT,
    model: "Best Match",
    includeBoundaryLayerHeight: false,
  });
}

export function createGfsMeteogramUrl() {
  return buildMeteogramUrl({
    endpoint: GFS_ENDPOINT,
    model: "NOAA GFS",
    includeBoundaryLayerHeight: true,
  });
}

async function fetchCandidate(candidate: MeteogramCandidate): Promise<MeteogramData> {
  const fetchedAt = new Date();

  try {
    const response = await fetch(buildMeteogramUrl(candidate), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "MOBI-Tempo-Pelotas/2.0 (+https://tempopelotas.com.br)",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`${candidate.model} respondeu HTTP ${response.status}`);
    }

    const parsed = responseSchema.safeParse((await response.json()) as unknown);
    if (!parsed.success) {
      console.error("[weather/meteogram] Resposta inválida", {
        model: candidate.model,
        issues: parsed.error.issues.slice(0, 12).map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return unavailable(
        `Os dados do ${candidate.model} foram recebidos em uma estrutura inesperada.`,
        fetchedAt,
      );
    }

    return normalize(parsed.data, fetchedAt, candidate.model);
  } catch (error) {
    console.warn("[weather/meteogram] Candidato indisponível", {
      model: candidate.model,
      message: error instanceof Error ? error.message : String(error),
    });
    return unavailable(`${candidate.model} está temporariamente indisponível.`, fetchedAt);
  }
}

function preferCandidate(candidates: MeteogramData[]) {
  let selected: MeteogramData | null = null;

  for (const candidate of candidates) {
    if (candidate.status === "unavailable" || candidate.hours.length === 0) continue;
    if (!selected || candidate.hours.length > selected.hours.length) {
      selected = candidate;
    }
  }

  return selected;
}

export async function fetchPelotasMeteogram(): Promise<MeteogramData> {
  const candidates: MeteogramCandidate[] = [
    {
      endpoint: BEST_MATCH_ENDPOINT,
      model: "Best Match",
      includeBoundaryLayerHeight: false,
    },
    {
      endpoint: GFS_ENDPOINT,
      model: "NOAA GFS",
      includeBoundaryLayerHeight: true,
    },
  ];

  const results = await Promise.all(candidates.map(fetchCandidate));
  const selected = preferCandidate(results);

  return selected ?? unavailable("O meteograma está temporariamente indisponível.");
}
