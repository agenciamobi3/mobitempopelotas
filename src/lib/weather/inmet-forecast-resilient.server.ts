import type { InmetForecast } from "./official-sources.types";
import { parseInmetForecastPayload } from "./inmet-forecast.server";

const PELOTAS_IBGE_CODE = "4314407";
const CURRENT_FORECAST_URL = `https://apiprevmet3.inmet.gov.br/api/forecast/${PELOTAS_IBGE_CODE}`;
const LEGACY_FORECAST_URL = `https://apiprevmet3.inmet.gov.br/previsao/${PELOTAS_IBGE_CODE}`;
const INMET_PORTAL_URL = "https://portal.inmet.gov.br/";
const INMET_FORECAST_APP_URL = `https://previsao.inmet.gov.br/${PELOTAS_IBGE_CODE}`;
const CURRENT_ENDPOINT_TIMEOUT_MS = 3_200;
const LEGACY_ENDPOINT_TIMEOUT_MS = 2_800;
const LEGACY_START_DELAY_MS = 650;

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

function requestHeaders(includeOrigin: boolean) {
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
    ...(includeOrigin ? { Origin: "https://previsao.inmet.gov.br" } : {}),
    Referer: `${INMET_FORECAST_APP_URL}/`,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
  };
}

async function requestForecast(
  attempt: EndpointAttempt,
  signal: AbortSignal,
  includeOrigin: boolean,
) {
  return fetch(attempt.url, {
    headers: requestHeaders(includeOrigin),
    signal,
  });
}

async function fetchForecastEndpoint(
  attempt: EndpointAttempt,
  signal?: AbortSignal,
): Promise<InmetForecast> {
  const timeoutSignal = AbortSignal.timeout(attempt.timeoutMs);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  let response = await requestForecast(attempt, combinedSignal, true);

  // Um 403 pode ser política do gateway para aquela forma da requisição, não
  // indisponibilidade do produto. Fazemos uma única repetição sem Origin,
  // mantendo Referer, timeout total e todas as demais validações.
  if (response.status === 403) {
    response = await requestForecast(attempt, combinedSignal, false);
  }

  if (!response.ok) {
    throw new Error(`a integração pela rota ${attempt.label} recebeu HTTP ${response.status}`);
  }

  const periods = parseInmetForecastPayload((await response.json()) as unknown);
  if (!periods.length) {
    throw new Error(
      `a rota ${attempt.label} respondeu, mas o payload não continha períodos meteorológicos reconhecíveis`,
    );
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
 * A rota histórica entra em paralelo após um pequeno atraso e assume se a
 * primeira ficar lenta ou falhar. Os prazos consideram latência real de uma
 * fonte pública externa; timeout da integração não é tratado como prova de que
 * o serviço público do INMET esteja fora do ar.
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
            ? `A integração da previsão municipal do INMET não obteve um payload utilizável nesta atualização. ${failures.join(" ")}`
            : "A integração da previsão municipal do INMET não obteve um payload utilizável nesta atualização.",
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
              ? `Rota histórica: ${error.message}.`
              : "Rota histórica: falha desconhecida.",
          );
          finishUnavailableIfNeeded();
        });
    };

    void fetchForecastEndpoint(currentAttempt, currentController.signal)
      .then((forecast) => accept(forecast, legacyController))
      .catch((error) => {
        currentFinished = true;
        failures.push(
          error instanceof Error
            ? `Rota atual: ${error.message}.`
            : "Rota atual: falha desconhecida.",
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
