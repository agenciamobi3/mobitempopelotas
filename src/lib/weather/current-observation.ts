import type {
  AggregatedCurrentProvenance,
  AggregatedCurrentWeather,
} from "./aggregated-weather.types";
import type { CurrentWeatherObservation } from "./current-observation.types";

export const OBSERVATION_MAX_AGE_MINUTES = 30;

export function getObservationAgeMinutes(
  observation: CurrentWeatherObservation,
  now = new Date(),
) {
  const observedAt = observation.source.observedAt;
  if (!observedAt) return null;
  const observedTime = new Date(observedAt).getTime();
  if (!Number.isFinite(observedTime)) return null;
  return Math.max(0, (now.getTime() - observedTime) / 60_000);
}

export function canUseCurrentObservation(
  observation: CurrentWeatherObservation,
  ageMinutes: number | null,
) {
  if (observation.status !== "live" || observation.current.temperature === null) return false;
  if (ageMinutes === null) return false;
  return ageMinutes <= OBSERVATION_MAX_AGE_MINUTES;
}

/**
 * Constrói o "Agora" exclusivamente a partir de uma estação observacional recente
 * da Rede de Monitoramento Hidrometeorológico da Defesa Civil RS. Previsão não é
 * usada para preencher campos ausentes de observação.
 */
export function deriveObservedCurrent(
  observation: CurrentWeatherObservation,
  ageMinutes: number | null,
) {
  const usable = canUseCurrentObservation(observation, ageMinutes);
  if (!usable) {
    return {
      usable: false,
      current: null as AggregatedCurrentWeather | null,
      provenance: {} as AggregatedCurrentProvenance,
    };
  }

  const c = observation.current;
  const current: AggregatedCurrentWeather = {
    city: "Pelotas",
    state: "RS",
    temperature: c.temperature === null ? null : Math.round(c.temperature),
    feelsLike: c.feelsLike === null ? null : Math.round(c.feelsLike),
    condition: null,
    humidity: c.humidity === null ? null : Math.round(c.humidity),
    pressure: c.pressure === null ? null : Math.round(c.pressure),
    windSpeed: c.windSpeed === null ? null : Math.round(c.windSpeed),
    windGust: c.windGust === null ? null : Math.round(c.windGust),
    windDirection: c.windDirection,
    visibilityKm: null,
    sunrise: null,
    sunset: null,
    observedAt: observation.source.observedAt,
    icon: null,
  };

  const provenance: AggregatedCurrentProvenance = {};
  const mark = (field: keyof AggregatedCurrentProvenance, value: unknown) => {
    if (value !== null && value !== undefined) provenance[field] = "defesa-civil-rs";
  };
  mark("temperature", current.temperature);
  mark("feelsLike", current.feelsLike);
  mark("humidity", current.humidity);
  mark("pressure", current.pressure);
  mark("windSpeed", current.windSpeed);
  mark("windGust", current.windGust);
  mark("windDirection", current.windDirection);
  mark("observedAt", current.observedAt);

  return { usable: true, current, provenance };
}
