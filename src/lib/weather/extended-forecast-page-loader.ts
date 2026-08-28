import { getPelotasExtendedForecast } from "./extended-forecast.functions";
import type { ExtendedForecastData } from "./extended-forecast.types";
import { createUnavailableWeatherIntelligence } from "./weather-intelligence-fallback";
import { getWeatherIntelligence } from "./weather-intelligence.functions";

const PUBLIC_EXTENDED_FORECAST_PAGE_DEADLINE_MS = 2_800;

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
 * O documento público recebe um teto local curto e degrada cada domínio sem
 * depender do sucesso das integrações. Os budgets internos continuam maiores e
 * podem ser usados pelos coletores/caches; a navegação do visitante não espera
 * por eles até o limite do runtime.
 */
export async function loadPublicExtendedForecastPage() {
  const unavailableForecast = () =>
    unavailableExtendedForecast(
      "A previsão de 15 dias está temporariamente indisponível.",
    );

  const [weather, extendedForecast] = await Promise.all([
    settlePageDependency(
      getWeatherIntelligence(),
      createUnavailableWeatherIntelligence,
    ),
    settlePageDependency(getPelotasExtendedForecast(), unavailableForecast),
  ]);

  return { weather, extendedForecast };
}
