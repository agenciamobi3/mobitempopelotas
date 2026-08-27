import type { InmetForecast } from "./official-sources.types";
import { parseInmetForecastPayload } from "./inmet-forecast.server";

const PELOTAS_IBGE_CODE = "4314407";
const CURRENT_FORECAST_URL = `https://apiprevmet3.inmet.gov.br/api/forecast/${PELOTAS_IBGE_CODE}`;
const LEGACY_FORECAST_URL = `https://apiprevmet3.inmet.gov.br/previsao/${PELOTAS_IBGE_CODE}`;
const INMET_PORTAL_URL = "https://portal.inmet.gov.br/";
const CURRENT_ENDPOINT_TIMEOUT_MS = 1_400;
const LEGACY_ENDPOINT_TIMEOUT_MS = 1_100;
const LEGACY_START_DELAY_MS = 450;

type EndpointAttempt = {
  label: "atual" | "histórica";
  url: string;
  timeoutMs: number;
};

function unavailable(error: string): InmetForecast {
  return {
    status: "unavailable",
    periods: [],
    source: {
      name: "INMET",
      url: INMET_PORTAL_URL,
      fetchedAt: new Date().toISOString(),
    },
    error,
  };
}

async function fetchForecastEndpoint(attempt: EndpointAttempt, signal?: AbortSignal): Promise<InmetForecast> {
  const timeoutSignal = AbortSignal.timeout(attempt.timeoutMs);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  const response = await fetch(attempt.url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "pt-BR,pt;q=0.9",
      "User-Agent": "TEMPO-Pelotas/2.0 (+https://tempopelotas.com.br)",
    },
    signal: combinedSignal,
  });

  if (!response.ok) {
    throw new Error(`rota ${attempt.label} respondeu com HTTP ${response.status}`);
  }

  const periods = parseInmetForecastPayload((await response.json()) as unknown);
  if (!periods.length) {
    throw new Error(`rota ${attempt.label} não retornou períodos meteorológicos reconhecíveis`);
  }

  return {
    status: "live",
    periods,
    source: {
      name: "INMET",
      url: INMET_PORTAL_URL,
      fetchedAt: new Date().toISOString(),
    },
    error: null,
  };
}

/**
 * Prioriza a rota municipal atualmente observada no ecossistema do INMET.
 * A rota histórica entra depois de um pequeno atraso e assume imediatamente
 * se a primeira falhar. Assim a contingência existe sem alongar o critical path
 * normal da Home e sem mudar a semântica da previsão municipal oficial.
 */
export async function fetchResilientInmetForecast(): Promise<InmetForecast> {
  const currentController = new AbortController();
  const legacyController = new AbortController();
  const failures: string[] = [];
  let legacyTimer: ReturnType<typeof setTimeout> | undefined;

  const currentAttempt: EndpointAttempt = {
    label: "atual",
    url: CURRENT_FORECAST_URL,
    timeoutMs: CURRENT_ENDPOINT_TIMEOUT_MS,
  };
  const legacyAttempt: EndpointAttempt = {
    label: "histórica",
    url: LEGACY_FORECAST_URL,
    timeoutMs: LEGACY_ENDPOINT_TIMEOUT_MS,
  };

  return await new Promise<InmetForecast>((resolve) => {
    let settled = false;
    let currentFinished = false;
    let legacyStarted = false;
    let legacyFinished = false;

    const finishUnavailableIfNeeded = () => {
      if (settled || !currentFinished || !legacyFinished) return;
      settled = true;
      resolve(
        unavailable(
          failures.length > 0
            ? `Previsão municipal do INMET indisponível. ${failures.join(" ")}`
            : "Previsão municipal do INMET indisponível nas rotas consultadas.",
        ),
      );
    };

    const accept = (forecast: InmetForecast, loser: AbortController) => {
      if (settled) return;
      settled = true;
      if (legacyTimer) clearTimeout(legacyTimer);
      loser.abort();
      resolve(forecast);
    };

    const startLegacy = () => {
      if (legacyStarted || settled) return;
      legacyStarted = true;
      void fetchForecastEndpoint(legacyAttempt, legacyController.signal)
        .then((forecast) => accept(forecast, currentController))
        .catch((error) => {
          legacyFinished = true;
          failures.push(
            error instanceof Error
              ? `rota histórica: ${error.message}`
              : "rota histórica: falha desconhecida",
          );
          finishUnavailableIfNeeded();
        });
    };

    void fetchForecastEndpoint(currentAttempt, currentController.signal)
      .then((forecast) => accept(forecast, legacyController))
      .catch((error) => {
        currentFinished = true;
        failures.push(
          error instanceof Error ? `rota atual: ${error.message}` : "rota atual: falha desconhecida",
        );
        startLegacy();
        finishUnavailableIfNeeded();
      })
      .finally(() => {
        currentFinished = true;
        finishUnavailableIfNeeded();
      });

    legacyTimer = setTimeout(startLegacy, LEGACY_START_DELAY_MS);
  });
}

export const INMET_FORECAST_ENDPOINTS = {
  current: CURRENT_FORECAST_URL,
  legacy: LEGACY_FORECAST_URL,
} as const;
