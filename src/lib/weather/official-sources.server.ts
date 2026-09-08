import { fetchCppmetForecast } from "./cppmet.server";
import { fetchResilientInmetForecast } from "./inmet-forecast-resilient.server";
import { fetchInmetStationReference } from "./inmet-station.server";
import { fetchStableInmetAlerts } from "./inmet-stable.server";
import type {
  CppmetForecast,
  InmetAlerts,
  InmetForecast,
  InmetStationReference,
  OfficialWeatherSources,
} from "./official-sources.types";
import { OFFICIAL_SOURCE_DEADLINE_MS } from "./source-policy.ts";

const INMET_ALERTS_URL = "https://apiprevmet3.inmet.gov.br/avisos/rss";
const INMET_FORECAST_URL = "https://portal.inmet.gov.br/";
const INMET_STATION_URL = "https://apiprevmet3.inmet.gov.br/estacao/proxima/4314407";
const INMET_PORTAL_URL = "https://avisos.inmet.gov.br/";
const CPPMET_URL = "https://wp.ufpel.edu.br/cppmet/";

function unavailableInmet(error: string): InmetAlerts {
  return {
    status: "unavailable",
    alerts: [],
    counts: { total: 0, pelotas: 0, regional: 0, state: 0 },
    source: {
      name: "INMET",
      feedUrl: INMET_ALERTS_URL,
      portalUrl: INMET_PORTAL_URL,
      fetchedAt: new Date().toISOString(),
    },
    error,
  };
}

function unavailableInmetForecast(error: string): InmetForecast {
  return {
    status: "unavailable",
    periods: [],
    source: { name: "INMET", url: INMET_FORECAST_URL, fetchedAt: new Date().toISOString() },
    error,
  };
}

function unavailableInmetStation(error: string): InmetStationReference {
  return {
    status: "unavailable",
    station: null,
    source: { name: "INMET", url: INMET_STATION_URL, fetchedAt: new Date().toISOString() },
    error,
  };
}

function unavailableCppmet(error: string): CppmetForecast {
  return {
    status: "unavailable",
    items: [],
    fingerprint: null,
    source: {
      name: "CPPMet / UFPel",
      url: CPPMET_URL,
      fetchedAt: new Date().toISOString(),
      lastModified: null,
    },
    error,
  };
}

async function settleWithin<T>(
  promise: Promise<T>,
  sourceName: string,
  deadlineMs: number,
  fallback: (error: string) => T,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => {
          resolve(fallback(`${sourceName} excedeu o limite de ${deadlineMs / 1_000} segundos.`));
        }, deadlineMs);
      }),
    ]);
  } catch (error) {
    return fallback(
      error instanceof Error ? error.message : `Falha desconhecida ao consultar ${sourceName}.`,
    );
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function fetchOfficialWeatherSources(): Promise<OfficialWeatherSources> {
  const [inmet, inmetForecast, inmetStation, cppmet] = await Promise.all([
    settleWithin(
      fetchStableInmetAlerts(),
      "INMET",
      OFFICIAL_SOURCE_DEADLINE_MS.inmet,
      unavailableInmet,
    ),
    settleWithin(
      fetchResilientInmetForecast(),
      "Previsão do INMET",
      OFFICIAL_SOURCE_DEADLINE_MS.inmetForecast,
      unavailableInmetForecast,
    ),
    settleWithin(
      fetchInmetStationReference(),
      "Estação do INMET",
      OFFICIAL_SOURCE_DEADLINE_MS.inmet,
      unavailableInmetStation,
    ),
    settleWithin(
      fetchCppmetForecast(),
      "CPPMet",
      OFFICIAL_SOURCE_DEADLINE_MS.cppmet,
      unavailableCppmet,
    ),
  ]);

  const degradedSources: OfficialWeatherSources["degradedSources"] = [];
  if (inmet.status !== "live") degradedSources.push("inmet");
  if (inmetForecast.status !== "live") degradedSources.push("inmet-forecast");
  if (inmetStation.status !== "live") degradedSources.push("inmet-station");
  if (cppmet.status !== "live") degradedSources.push("cppmet");

  return {
    inmet,
    inmetForecast,
    inmetStation,
    cppmet,
    fetchedAt: new Date().toISOString(),
    degradedSources,
  };
}
