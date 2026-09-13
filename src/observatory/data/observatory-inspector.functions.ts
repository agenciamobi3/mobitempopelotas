import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  normalizeObservatoryInspectorPoint,
  OBSERVATORY_INSPECTOR_BOUNDS,
  type ObservatoryInspectorHour,
  type ObservatoryInspectorPoint,
} from "../core/ObservatoryInspector";
import { resolveObservatoryAccessForRequest } from "./observatory-access.functions";

const OPEN_METEO_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_SOURCE_URL = "https://open-meteo.com/";
const REQUEST_TIMEOUT_MS = 2_500;
const MAX_HOURS = 72;

const pointSchema = z.object({
  latitude: z
    .number()
    .finite()
    .min(OBSERVATORY_INSPECTOR_BOUNDS.south)
    .max(OBSERVATORY_INSPECTOR_BOUNDS.north),
  longitude: z
    .number()
    .finite()
    .min(OBSERVATORY_INSPECTOR_BOUNDS.west)
    .max(OBSERVATORY_INSPECTOR_BOUNDS.east),
});

const nullableNumberArray = z.array(z.number().finite().nullable()).min(1);
const hourlyResponseSchema = z
  .object({
    hourly: z.object({
      time: z.array(z.number().finite()).min(1),
      temperature_2m: nullableNumberArray,
      apparent_temperature: nullableNumberArray,
      relative_humidity_2m: nullableNumberArray,
      dew_point_2m: nullableNumberArray,
      pressure_msl: nullableNumberArray,
      precipitation_probability: nullableNumberArray,
      precipitation: nullableNumberArray,
      cloud_cover: nullableNumberArray,
      wind_speed_10m: nullableNumberArray,
      wind_gusts_10m: nullableNumberArray,
      wind_direction_10m: nullableNumberArray,
    }),
  })
  .superRefine((payload, context) => {
    const length = payload.hourly.time.length;
    for (const [key, values] of Object.entries(payload.hourly)) {
      if (Array.isArray(values) && values.length !== length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hourly", key],
          message: "Série horária incompleta",
        });
      }
    }
  });

export type ObservatoryInspectorResponse =
  | {
      status: "live";
      point: ObservatoryInspectorPoint;
      hours: ObservatoryInspectorHour[];
      source: {
        name: "Open-Meteo";
        model: "Best Match";
        kind: "forecast";
        url: string;
      };
      message: null;
    }
  | {
      status: "unavailable" | "forbidden";
      point: ObservatoryInspectorPoint | null;
      hours: [];
      source: null;
      message: string;
    };

function numberAt(values: Array<number | null>, index: number) {
  return values[index] ?? null;
}

function buildOpenMeteoUrl(point: ObservatoryInspectorPoint) {
  const params = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
    timezone: "UTC",
    timeformat: "unixtime",
    past_days: "1",
    forecast_days: "2",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    cell_selection: "nearest",
    hourly: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "dew_point_2m",
      "pressure_msl",
      "precipitation_probability",
      "precipitation",
      "cloud_cover",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
    ].join(","),
  });
  return `${OPEN_METEO_ENDPOINT}?${params.toString()}`;
}

function normalizeHours(payload: z.infer<typeof hourlyResponseSchema>): ObservatoryInspectorHour[] {
  const hourly = payload.hourly;
  return hourly.time.slice(0, MAX_HOURS).map((timestamp, index) => ({
    timestamp: new Date(timestamp * 1_000).toISOString(),
    temperatureC: numberAt(hourly.temperature_2m, index),
    apparentTemperatureC: numberAt(hourly.apparent_temperature, index),
    relativeHumidityPercent: numberAt(hourly.relative_humidity_2m, index),
    dewPointC: numberAt(hourly.dew_point_2m, index),
    pressureHpa: numberAt(hourly.pressure_msl, index),
    precipitationProbabilityPercent: numberAt(hourly.precipitation_probability, index),
    precipitationMm: numberAt(hourly.precipitation, index),
    cloudCoverPercent: numberAt(hourly.cloud_cover, index),
    windSpeedKmh: numberAt(hourly.wind_speed_10m, index),
    windGustKmh: numberAt(hourly.wind_gusts_10m, index),
    windDirectionDegrees: numberAt(hourly.wind_direction_10m, index),
  }));
}

export const getObservatoryPointForecast = createServerFn({ method: "GET" })
  .validator(pointSchema)
  .handler(async ({ data }): Promise<ObservatoryInspectorResponse> => {
    const access = await resolveObservatoryAccessForRequest();
    if (access.status !== "authenticated" || !access.allowed) {
      return {
        status: "forbidden",
        point: null,
        hours: [],
        source: null,
        message: "Esta ferramenta está disponível no Observatório PRO.",
      };
    }

    const point = normalizeObservatoryInspectorPoint(data);
    if (!point) {
      return {
        status: "unavailable",
        point: null,
        hours: [],
        source: null,
        message: "Este ponto está fora da área atendida pelo inspetor.",
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(buildOpenMeteoUrl(point), {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "User-Agent": "MOBI-Tempo-Pelotas/2.0 (+https://tempopelotas.com.br)",
        },
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Open-Meteo respondeu com status ${response.status}`);

      const parsed = hourlyResponseSchema.safeParse(await response.json());
      if (!parsed.success) {
        console.error("[observatory/inspector] Resposta Open-Meteo inválida", {
          issues: parsed.error.issues.slice(0, 8).map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
        return {
          status: "unavailable",
          point,
          hours: [],
          source: null,
          message: "A previsão deste ponto foi recebida, mas não pôde ser processada.",
        };
      }

      const hours = normalizeHours(parsed.data);
      if (hours.length === 0) {
        return {
          status: "unavailable",
          point,
          hours: [],
          source: null,
          message: "Não há previsão horária utilizável para este ponto agora.",
        };
      }

      return {
        status: "live",
        point,
        hours,
        source: {
          name: "Open-Meteo",
          model: "Best Match",
          kind: "forecast",
          url: OPEN_METEO_SOURCE_URL,
        },
        message: null,
      };
    } catch (error) {
      console.error("[observatory/inspector] Falha ao consultar previsão do ponto", {
        message: error instanceof Error ? error.message : String(error),
      });
      return {
        status: "unavailable",
        point,
        hours: [],
        source: null,
        message: "A previsão deste ponto está temporariamente indisponível.",
      };
    } finally {
      clearTimeout(timeout);
    }
  });
