import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchAggregatedPelotasWeather } from "./aggregated-weather.server";
import type { WeatherIconName } from "./types";

export type ObsWeatherStatusData = {
  status: "live" | "unavailable";
  temperature: number | null;
  condition: string;
  icon: WeatherIconName;
  updatedAt: string;
  observationSource: string;
  observationStation: string | null;
  conditionSource: string | null;
};

const CONDITION_LABELS: Record<WeatherIconName, string> = {
  sun: "Ensolarado",
  moon: "Céu limpo",
  "partly-cloudy": "Parcialmente nublado",
  "partly-cloudy-night": "Parcialmente nublado",
  cloud: "Nublado",
  rain: "Chuva",
  storm: "Trovoadas",
  wind: "Ventoso",
};

export const getObsWeatherStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<ObsWeatherStatusData> => {
    setResponseHeaders(
      new Headers({
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        "CDN-Cache-Control": "max-age=300, stale-while-revalidate=60",
      }),
    );

    const weather = await fetchAggregatedPelotasWeather();
    const observation = weather.current;
    const conditionHour = weather.hourly[0] ?? null;
    const icon: WeatherIconName = conditionHour?.icon ?? "cloud";
    const sourceName = weather.observation.source.name;
    const stationName = weather.observation.station.code
      ? `${weather.observation.station.name} · ${weather.observation.station.code}`
      : weather.observation.station.name;

    if (!observation || observation.temperature === null) {
      return {
        status: "unavailable",
        temperature: null,
        condition: "Indisponível",
        icon: "cloud",
        updatedAt: weather.observation.source.fetchedAt,
        observationSource: sourceName,
        observationStation: null,
        conditionSource: null,
      };
    }

    return {
      status: "live",
      temperature: observation.temperature,
      condition: conditionHour ? CONDITION_LABELS[icon] : "Condição indisponível",
      icon,
      updatedAt: observation.observedAt ?? weather.observation.source.fetchedAt,
      observationSource: sourceName,
      observationStation: stationName,
      conditionSource: weather.quality.forecastProvider,
    };
  },
);
