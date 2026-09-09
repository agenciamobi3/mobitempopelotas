import type {
  AggregatedCurrentProvenance,
  AggregatedCurrentWeather,
  NowObservationSourceKey,
} from "./aggregated-weather.types";
import {
  OBSERVATION_MAX_AGE_MINUTES,
  deriveObservedCurrent,
  getObservationAgeMinutes,
} from "./current-observation";
import type { CurrentWeatherObservation } from "./current-observation.types";
import { fetchDefesaCivilCurrentObservation } from "./defesa-civil-current.server";
import { fetchEmbrapaObservation } from "./embrapa-observation.server";
import { EMBRAPA_MONITOR_URL } from "./embrapa-observation.types";
import { getNowSourcePriority, NOW_PRIMARY_SOURCE } from "./now-source.config";

const TIMEZONE = "America/Sao_Paulo";
const FUTURE_TOLERANCE_MS = 5 * 60_000;
const DAY_MS = 24 * 60 * 60_000;
const NOW_MODULE_DEADLINE_MS = 5_500;
const DEFESA_CIVIL_MAP_URL = "https://redehidrometeorologica.defesacivil.rs.gov.br/Mapa";
const DEFESA_CIVIL_DOCS_URL = "https://sistemas.defesacivil.rs.gov.br/api-redehidrometeorologica";

type NowSourceCandidate = {
  source: NowObservationSourceKey;
  usable: boolean;
  ageMinutes: number | null;
  current: AggregatedCurrentWeather | null;
  provenance: AggregatedCurrentProvenance;
  sourceName: string;
  stationName: string;
  sourceUrl: string;
  observedAt: string | null;
  error: string | null;
};

export type NowSourceResolution = {
  primarySource: NowObservationSourceKey;
  selectedSource: NowObservationSourceKey | null;
  fallbackUsed: boolean;
  current: AggregatedCurrentWeather | null;
  provenance: AggregatedCurrentProvenance;
  observationAgeMinutes: number | null;
  sourceName: string | null;
  stationName: string | null;
  sourceUrl: string | null;
  observedAt: string | null;
  defesaCivilObservation: CurrentWeatherObservation;
  defesaCivilAgeMinutes: number | null;
  defesaCivilUsable: boolean;
};

function localDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function ageMinutes(observedAt: string | null, fetchedAt: string) {
  if (!observedAt) return null;
  const observed = new Date(observedAt).getTime();
  const fetched = new Date(fetchedAt).getTime();
  if (!Number.isFinite(observed) || !Number.isFinite(fetched)) return null;
  if (observed > fetched + FUTURE_TOLERANCE_MS) return null;
  return Math.max(0, (fetched - observed) / 60_000);
}

async function settleModule<T>(promise: Promise<T>): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), NOW_MODULE_DEADLINE_MS);
    void promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(null);
      });
  });
}

function unavailableDefesaCivilObservation(): CurrentWeatherObservation {
  const fetchedAt = new Date().toISOString();
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
      name: "Defesa Civil RS — Rede de Monitoramento Hidrometeorológico",
      url: DEFESA_CIVIL_MAP_URL,
      documentationUrl: DEFESA_CIVIL_DOCS_URL,
      fetchedAt,
      observedAt: null,
    },
    error: "O módulo de observação da Defesa Civil excedeu o tempo desta consulta.",
  };
}

/**
 * A página pública da Embrapa normalmente publica somente HH:mm. Ligamos esse
 * horário ao dia local da consulta e, logo após a meia-noite, aceitamos a
 * leitura do dia anterior quando ela é a única cronologicamente plausível.
 */
export function normalizeEmbrapaObservedAt(
  observationTime: string | null,
  fetchedAt: string,
) {
  if (!observationTime) return null;
  const raw = observationTime.trim();
  const fetched = new Date(fetchedAt);
  if (Number.isNaN(fetched.getTime())) return null;

  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [rawHour, rawMinute] = raw.split(":");
    const hour = Number(rawHour);
    const minute = Number(rawMinute);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;

    const clock = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    let candidate = new Date(`${localDateKey(fetched)}T${clock}:00-03:00`);
    if (Number.isNaN(candidate.getTime())) return null;
    if (candidate.getTime() > fetched.getTime() + FUTURE_TOLERANCE_MS) {
      candidate = new Date(candidate.getTime() - DAY_MS);
    }
    return candidate.toISOString();
  }

  const candidate = new Date(raw);
  if (Number.isNaN(candidate.getTime())) return null;
  if (candidate.getTime() > fetched.getTime() + FUTURE_TOLERANCE_MS) return null;
  return candidate.toISOString();
}

function markCurrentProvenance(
  current: AggregatedCurrentWeather,
  source: NowObservationSourceKey,
) {
  const provenance: AggregatedCurrentProvenance = {};
  const mark = (field: keyof AggregatedCurrentProvenance, value: unknown) => {
    if (value !== null && value !== undefined) provenance[field] = source;
  };

  mark("temperature", current.temperature);
  mark("feelsLike", current.feelsLike);
  mark("humidity", current.humidity);
  mark("pressure", current.pressure);
  mark("windSpeed", current.windSpeed);
  mark("windGust", current.windGust);
  mark("windDirection", current.windDirection);
  mark("sunrise", current.sunrise);
  mark("sunset", current.sunset);
  mark("observedAt", current.observedAt);

  return provenance;
}

function candidateFromDefesaCivil(observation: CurrentWeatherObservation): NowSourceCandidate {
  const observationAgeMinutes = getObservationAgeMinutes(observation);
  const derived = deriveObservedCurrent(observation, observationAgeMinutes);

  return {
    source: "defesa-civil-rs",
    usable: derived.usable,
    ageMinutes: observationAgeMinutes,
    current: derived.current,
    provenance: derived.provenance,
    sourceName: observation.source.name,
    stationName: observation.station.name,
    sourceUrl: observation.source.url,
    observedAt: observation.source.observedAt,
    error: observation.error,
  };
}

function candidateFromEmbrapa(
  observation: Awaited<ReturnType<typeof fetchEmbrapaObservation>> | null,
): NowSourceCandidate {
  if (!observation) {
    return {
      source: "embrapa",
      usable: false,
      ageMinutes: null,
      current: null,
      provenance: {},
      sourceName: "Embrapa Clima Temperado",
      stationName: "Posto Meteorológico da Sede",
      sourceUrl: EMBRAPA_MONITOR_URL,
      observedAt: null,
      error: "O módulo de observação da Embrapa excedeu o tempo desta consulta.",
    };
  }

  const observedAt = normalizeEmbrapaObservedAt(
    observation.source.observationTime,
    observation.source.fetchedAt,
  );
  const observationAgeMinutes = ageMinutes(observedAt, observation.source.fetchedAt);
  const usable =
    observation.status !== "unavailable" &&
    observation.current.temperature !== null &&
    observationAgeMinutes !== null &&
    observationAgeMinutes <= OBSERVATION_MAX_AGE_MINUTES;

  const current: AggregatedCurrentWeather | null = usable
    ? {
        city: "Pelotas",
        state: "RS",
        temperature: Math.round(observation.current.temperature as number),
        feelsLike:
          observation.current.feelsLike === null
            ? null
            : Math.round(observation.current.feelsLike),
        condition: null,
        humidity:
          observation.current.humidity === null ? null : Math.round(observation.current.humidity),
        pressure:
          observation.current.pressure === null ? null : Math.round(observation.current.pressure),
        windSpeed:
          observation.current.windSpeed === null ? null : Math.round(observation.current.windSpeed),
        windGust: null,
        windDirection: observation.current.windDirection,
        visibilityKm: null,
        sunrise: observation.current.sunrise,
        sunset: observation.current.sunset,
        observedAt,
        icon: null,
      }
    : null;

  return {
    source: "embrapa",
    usable,
    ageMinutes: observationAgeMinutes,
    current,
    provenance: current ? markCurrentProvenance(current, "embrapa") : {},
    sourceName: observation.source.name,
    stationName: observation.source.station,
    sourceUrl: observation.source.url,
    observedAt,
    error:
      usable
        ? null
        : observation.error ??
          (observationAgeMinutes !== null && observationAgeMinutes > OBSERVATION_MAX_AGE_MINUTES
            ? `Leitura da Embrapa com mais de ${OBSERVATION_MAX_AGE_MINUTES} minutos.`
            : "A leitura da Embrapa não tem horário recente suficiente para compor o Agora."),
  };
}

export function selectNowCandidate(
  candidates: Record<NowObservationSourceKey, NowSourceCandidate>,
  primarySource: NowObservationSourceKey = NOW_PRIMARY_SOURCE,
) {
  const selected = getNowSourcePriority(primarySource)
    .map((source) => candidates[source])
    .find((candidate) => candidate.usable && candidate.current !== null) ?? null;

  return {
    selected,
    fallbackUsed: selected !== null && selected.source !== primarySource,
  };
}

/**
 * Os dois módulos são consultados em paralelo com deadline independente. A
 * prioridade decide somente qual leitura vence quando ambas estão utilizáveis.
 * Se a principal cair, a contingência assume sem transformar previsão em medição.
 */
export async function fetchNowSourceResolution(): Promise<NowSourceResolution> {
  const [embrapaResult, defesaCivilResult] = await Promise.all([
    settleModule(fetchEmbrapaObservation()),
    settleModule(fetchDefesaCivilCurrentObservation()),
  ]);
  const defesaCivilObservation = defesaCivilResult ?? unavailableDefesaCivilObservation();

  const candidates: Record<NowObservationSourceKey, NowSourceCandidate> = {
    embrapa: candidateFromEmbrapa(embrapaResult),
    "defesa-civil-rs": candidateFromDefesaCivil(defesaCivilObservation),
  };
  const { selected, fallbackUsed } = selectNowCandidate(candidates);
  const defesaCivil = candidates["defesa-civil-rs"];

  return {
    primarySource: NOW_PRIMARY_SOURCE,
    selectedSource: selected?.source ?? null,
    fallbackUsed,
    current: selected?.current ?? null,
    provenance: selected?.provenance ?? {},
    observationAgeMinutes: selected?.ageMinutes ?? null,
    sourceName: selected?.sourceName ?? null,
    stationName: selected?.stationName ?? null,
    sourceUrl: selected?.sourceUrl ?? null,
    observedAt: selected?.observedAt ?? null,
    defesaCivilObservation,
    defesaCivilAgeMinutes: defesaCivil.ageMinutes,
    defesaCivilUsable: defesaCivil.usable,
  };
}