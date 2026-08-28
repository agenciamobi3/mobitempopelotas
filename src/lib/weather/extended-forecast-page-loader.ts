import { getPelotasExtendedForecast } from "./extended-forecast.functions";
import type { ExtendedForecastData } from "./extended-forecast.types";
import { createUnavailableWeatherIntelligence } from "./weather-intelligence-fallback";
import { getWeatherIntelligence } from "./weather-intelligence.functions";

const PUBLIC_EXTENDED_FORECAST_PAGE_DEADLINE_MS = 4_000;

function unavailableExtendedForecast(message: string): ExtendedForecastData {
  return {
    status: "unavailable",
    days: [],
    source: {
      name: "Open-Meteo",
      url: "https://open-meteo.com/",
      fetchedAt: new Date().toISOString(),
      model: "Open-Meteo Best Match",
      requestedDays: 15,
      returnedDays: 0,
    },
    message,
  };
}

async function settlePageDependency<T>(
  promise: Promise<T>,
  fallback: () => T,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(
          () => resolve(fallback()),
          PUBLIC_EXTENDED_FORECAST_PAGE_DEADLINE_MS,
        );
      }),
    ]);
  } catch {
    return fallback();
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

/**
 * Carrega a inteligência meteorológica compartilhada e a janela estendida sem
 * exigir que as duas server functions atravessem o transporte com sucesso.
 *
 * Cada domínio degrada para o próprio contrato indisponível. O orçamento local
 * da página é menor que o teto da inteligência meteorológica compartilhada para
 * que uma dependência lenta não segure o SSR até o limite externo da navegação.
 * Os budgets internos das fontes permanecem inalterados.
 */
export async function loadPublicExtendedForecastPage() {
  const unavailableForecast = () =>
    unavailableExtendedForecast(
      "A previsão de 15 dias está temporariamente indisponível.",
    );

  const [weatherResult, extendedForecastResult] = await Promise.allSettled([
    settlePageDependency(
      getWeatherIntelligence(),
      createUnavailableWeatherIntelligence,
    ),
    settlePageDependency(getPelotasExtendedForecast(), unavailableForecast),
  ]);

  return {
    weather:
      weatherResult.status === "fulfilled"
        ? weatherResult.value
        : createUnavailableWeatherIntelligence(),
    extendedForecast:
      extendedForecastResult.status === "fulfilled"
        ? extendedForecastResult.value
        : unavailableForecast(),
  };
}
