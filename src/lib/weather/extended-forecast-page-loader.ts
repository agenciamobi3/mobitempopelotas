import { getPelotasExtendedForecast } from "./extended-forecast.functions";
import type { ExtendedForecastData } from "./extended-forecast.types";
import { createUnavailableWeatherIntelligence } from "./weather-intelligence-fallback";
import { getWeatherIntelligence } from "./weather-intelligence.functions";

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

/**
 * Carrega a inteligência meteorológica compartilhada e a janela estendida sem
 * exigir que as duas server functions atravessem o transporte com sucesso.
 *
 * Cada domínio degrada para o próprio contrato indisponível. Assim, uma falha
 * transitória em uma das chamadas não promove automaticamente a página inteira
 * de 15 dias ao boundary global e nenhuma ausência é transformada em valor
 * meteorológico fictício.
 */
export async function loadPublicExtendedForecastPage() {
  const [weatherResult, extendedForecastResult] = await Promise.allSettled([
    getWeatherIntelligence(),
    getPelotasExtendedForecast(),
  ]);

  return {
    weather:
      weatherResult.status === "fulfilled"
        ? weatherResult.value
        : createUnavailableWeatherIntelligence(),
    extendedForecast:
      extendedForecastResult.status === "fulfilled"
        ? extendedForecastResult.value
        : unavailableExtendedForecast(
            "A previsão de 15 dias está temporariamente indisponível.",
          ),
  };
}
