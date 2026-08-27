import type { InmetForecast } from "./official-sources.types";
import { fetchInmetForecast, parseInmetForecastPayload } from "./inmet-forecast.server";

const PELOTAS_IBGE_CODE = "4314407";
const CURRENT_FORECAST_URL = `https://apiprevmet3.inmet.gov.br/api/forecast/${PELOTAS_IBGE_CODE}`;
const INMET_PORTAL_URL = "https://portal.inmet.gov.br/";
const CURRENT_ENDPOINT_TIMEOUT_MS = 1_200;

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

async function fetchCurrentInmetForecast(): Promise<InmetForecast> {
  const response = await fetch(CURRENT_FORECAST_URL, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "pt-BR,pt;q=0.9",
      "User-Agent": "TEMPO-Pelotas/2.0 (+https://tempopelotas.com.br)",
    },
    signal: AbortSignal.timeout(CURRENT_ENDPOINT_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`endpoint atual respondeu com HTTP ${response.status}`);
  }

  const periods = parseInmetForecastPayload((await response.json()) as unknown);
  if (!periods.length) {
    throw new Error("endpoint atual não retornou períodos meteorológicos reconhecíveis");
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
 * Consulta a rota municipal atualmente observada no ecossistema do INMET e
 * preserva a rota histórica já usada pelo Tempo Pelotas como contingência.
 *
 * A troca de endpoint nunca muda a semântica do dado: ambos representam
 * previsão municipal oficial do INMET para o mesmo código IBGE de Pelotas.
 */
export async function fetchResilientInmetForecast(): Promise<InmetForecast> {
  const failures: string[] = [];

  try {
    return await fetchCurrentInmetForecast();
  } catch (error) {
    failures.push(
      error instanceof Error ? error.message : "falha desconhecida no endpoint atual do INMET",
    );
  }

  const legacy = await fetchInmetForecast();
  if (legacy.status === "live" && legacy.periods.length > 0) {
    return legacy;
  }

  if (legacy.error) failures.push(`contingência histórica: ${legacy.error}`);

  return unavailable(
    failures.length > 0
      ? `Previsão municipal do INMET indisponível. ${failures.join(" ")}`
      : "Previsão municipal do INMET indisponível nas rotas consultadas.",
  );
}

export const INMET_FORECAST_ENDPOINTS = {
  current: CURRENT_FORECAST_URL,
  legacy: `https://apiprevmet3.inmet.gov.br/previsao/${PELOTAS_IBGE_CODE}`,
} as const;
