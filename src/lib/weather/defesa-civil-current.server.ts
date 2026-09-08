import {
  fetchDefesaCivilHydroData,
  type DefesaCivilHydroStation,
} from "@/lib/hydrology/defesa-civil-rs.server";

import type { CurrentWeatherObservation } from "./current-observation.types";

const CURRENT_MAX_AGE_MINUTES = 30;
const SOURCE_NAME = "Defesa Civil RS — Rede de Monitoramento Hidrometeorológico" as const;

/**
 * Estações da rede estadual confirmadas no inventário operacional como pertencentes a Pelotas.
 * O "Agora" não pode cair silenciosamente para Capão do Leão ou outra cidade apenas porque a
 * estação é recente: observação local e previsão regional são contratos diferentes.
 */
export const PELOTAS_CURRENT_STATION_CODES = ["DCRS-00039", "DCRS-00062"] as const;
const PELOTAS_CURRENT_STATION_CODE_SET = new Set<string>(PELOTAS_CURRENT_STATION_CODES);

function compassDirection(degrees: number | null) {
  if (degrees === null || !Number.isFinite(degrees)) return null;
  const normalized = ((degrees % 360) + 360) % 360;
  const directions = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"] as const;
  return directions[Math.round(normalized / 45) % directions.length];
}

function hasCurrentMeteorology(station: DefesaCivilHydroStation) {
  return (
    PELOTAS_CURRENT_STATION_CODE_SET.has(station.code) &&
    station.freshness === "recent" &&
    station.ageMinutes !== null &&
    station.ageMinutes <= CURRENT_MAX_AGE_MINUTES &&
    (station.classification === "METEOROLOGY" || station.classification === "BOTH") &&
    station.weather.temperatureC !== null
  );
}

export function selectDefesaCivilCurrentStation(stations: DefesaCivilHydroStation[]) {
  return [...stations]
    .filter(hasCurrentMeteorology)
    .sort((left, right) => {
      const age =
        (left.ageMinutes ?? Number.POSITIVE_INFINITY) -
        (right.ageMinutes ?? Number.POSITIVE_INFINITY);
      if (age !== 0) return age;
      const distance = left.distanceFromPelotasKm - right.distanceFromPelotasKm;
      if (distance !== 0) return distance;
      return left.code.localeCompare(right.code);
    })[0] ?? null;
}

function unavailableObservation(
  source: { mapUrl: string; documentationUrl: string; fetchedAt: string },
  error: string,
): CurrentWeatherObservation {
  return {
    status: "unavailable",
    station: {
      code: null,
      name: "Estação meteorológica recente de Pelotas não disponível",
      basin: null,
      region: null,
      latitude: null,
      longitude: null,
      altitudeM: null,
      distanceFromPelotasKm: null,
    },
    current: {
      temperature: null,
      feelsLike: null,
      humidity: null,
      dewPoint: null,
      pressure: null,
      windSpeed: null,
      windGust: null,
      windDirection: null,
      windDirectionDegrees: null,
    },
    rain: { h1Mm: null, h3Mm: null, h6Mm: null, h12Mm: null, h24Mm: null },
    source: {
      name: SOURCE_NAME,
      url: source.mapUrl,
      documentationUrl: source.documentationUrl,
      fetchedAt: source.fetchedAt,
      observedAt: null,
    },
    error,
  };
}

export async function fetchDefesaCivilCurrentObservation(): Promise<CurrentWeatherObservation> {
  const network = await fetchDefesaCivilHydroData();
  const station = selectDefesaCivilCurrentStation(network.stations);

  if (!station) {
    return unavailableObservation(
      network.source,
      network.status === "unavailable"
        ? network.error ?? "A Rede de Monitoramento Hidrometeorológico da Defesa Civil RS está indisponível."
        : "Nenhuma das estações meteorológicas confirmadas em Pelotas forneceu temperatura com até 30 minutos de idade nesta consulta.",
    );
  }

  return {
    status: "live",
    station: {
      code: station.code,
      name: station.name,
      basin: station.basin,
      region: station.region,
      latitude: station.latitude,
      longitude: station.longitude,
      altitudeM: station.altitudeM,
      distanceFromPelotasKm: station.distanceFromPelotasKm,
    },
    current: {
      temperature: station.weather.temperatureC,
      feelsLike: station.weather.apparentTemperatureC,
      humidity: station.weather.humidityPct,
      dewPoint: null,
      pressure: station.weather.pressureHpa,
      windSpeed: station.weather.windAverageKmh,
      windGust: station.weather.windMaximumKmh,
      windDirection: compassDirection(station.weather.windDirectionDeg),
      windDirectionDegrees: station.weather.windDirectionDeg,
    },
    rain: {
      h1Mm: station.rain.h1Mm,
      h3Mm: station.rain.h3Mm,
      h6Mm: station.rain.h6Mm,
      h12Mm: station.rain.h12Mm,
      h24Mm: station.rain.h24Mm,
    },
    source: {
      name: SOURCE_NAME,
      url: network.source.mapUrl,
      documentationUrl: network.source.documentationUrl,
      fetchedAt: network.source.fetchedAt,
      observedAt: station.observedAt,
    },
    error: null,
  };
}
