import type { InmetForecast } from "./official-sources.types";
import { parseInmetForecastPayload } from "./inmet-forecast.server";

const PELOTAS_IBGE_CODE = "4314407";
const STABLE_FORECAST_URL = `https://apiprevmet3.inmet.gov.br/previsao/${PELOTAS_IBGE_CODE}`;
const ALTERNATE_FORECAST_URL = `https://apiprevmet3.inmet.gov.br/api/forecast/${PELOTAS_IBGE_CODE}`;
const INMET_PORTAL_URL = "https://portal.inmet.gov.br/";
const INMET_FORECAST_APP_URL = `https://previsao.inmet.gov.br/${PELOTAS_IBGE_CODE}`;
const STABLE_ENDPOINT_TIMEOUT_MS = 2_800;
const ALTERNATE_ENDPOINT_TIMEOUT_MS = 2_400;
const ALTERNATE_START_DELAY_MS = 900;

type EndpointAttempt = {
  label: "estável" | "alternativa";
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
 * A rota /previsao/{geocode} é a primária porque foi verificada com HTTP 200
 * e payload meteorológico válido em produção. A rota /api/forecast/{geocode}
 * permanece somente como contingência retardada: em 29/08/2026 ela respondia
 * 404 E_ROUTE_NOT_FOUND. Não desperdiçamos o caminho crítico esperando primeiro
 * por uma rota comprovadamente inexistente, mas também não removemos a opção de
 * recuperação caso o INMET volte a expô-la no futuro.
 */
export async function fetchResilientInmetForecast(): Promise<InmetForecast> {
  const stableController = new AbortController();
  const alternateController = new AbortController();
  const failures: string[] = [];
  let alternateTimer: ReturnType<typeof setTimeout> | undefined;

  const stableAttempt: EndpointAttempt = {
    label: "estável",
    url: STABLE_FORECAST_URL,
    timeoutMs: STABLE_ENDPOINT_TIMEOUT_MS,
  };
  const alternateAttempt: EndpointAttempt = {
    label: "alternativa",
    url: ALTERNATE_FORECAST_URL,
    timeoutMs: ALTERNATE_ENDPOINT_TIMEOUT_MS,
  };

  return await new Promise<InmetForecast>((resolve) => {
    let settled = false;
    let stableFinished = false;
    let alternateStarted = false;
    let alternateFinished = false;

    const finishUnavailableIfNeeded = () => {
      if (settled || !stableFinished || !alternateFinished) return;
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
      if (alternateTimer) clearTimeout(alternateTimer);
      loser.abort();
      resolve(forecast);
    };

    const startAlternate = () => {
      if (alternateStarted || settled) return;
      alternateStarted = true;
      void fetchForecastEndpoint(alternateAttempt, alternateController.signal)
        .then((forecast) => accept(forecast, stableController))
        .catch((error) => {
          alternateFinished = true;
          failures.push(
            error instanceof Error
              ? `Rota alternativa: ${error.message}.`
              : "Rota alternativa: falha desconhecida.",
          );
          finishUnavailableIfNeeded();
        });
    };

    void fetchForecastEndpoint(stableAttempt, stableController.signal)
      .then((forecast) => accept(forecast, alternateController))
      .catch((error) => {
        stableFinished = true;
        failures.push(
          error instanceof Error
            ? `Rota estável: ${error.message}.`
            : "Rota estável: falha desconhecida.",
        );
        startAlternate();
        finishUnavailableIfNeeded();
      })
      .finally(() => {
        stableFinished = true;
        finishUnavailableIfNeeded();
      });

    alternateTimer = setTimeout(startAlternate, ALTERNATE_START_DELAY_MS);
  });
}

export const INMET_FORECAST_ENDPOINTS = {
  primary: STABLE_FORECAST_URL,
  alternate: ALTERNATE_FORECAST_URL,
} as const;
