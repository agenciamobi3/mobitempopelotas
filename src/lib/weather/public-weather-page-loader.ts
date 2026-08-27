import { getPelotasMeteogram } from "./meteogram.functions";
import type { MeteogramData } from "./meteogram.server";
import { createUnavailableWeatherIntelligence } from "./weather-intelligence-fallback";
import { getWeatherIntelligence } from "./weather-intelligence.functions";

function unavailableMeteogram(message: string): MeteogramData {
  return {
    status: "unavailable",
    hours: [],
    source: {
      name: "Open-Meteo",
      model: "Best Match",
      url: "https://open-meteo.com/",
      fetchedAt: new Date().toISOString(),
      timezone: "America/Sao_Paulo",
      temporalResolutionMinutes: 60,
      forecastHours: 48,
      generationTimeMs: null,
    },
    message,
  };
}

/**
 * Loader compartilhado para páginas públicas que combinam a inteligência
 * meteorológica principal com a série horária detalhada do meteograma.
 *
 * Uma falha de transporte em qualquer server fn não deve promover a rota inteira
 * ao error boundary global. Cada domínio degrada para o próprio contrato vazio,
 * sem inventar observações ou previsões. Falhas de versão/chunk ainda são
 * tratadas pela recuperação de navegação no shell raiz.
 */
export async function loadPublicWeatherWithMeteogram(options?: {
  meteogramUnavailableMessage?: string;
}) {
  const [weatherResult, meteogramResult] = await Promise.allSettled([
    getWeatherIntelligence(),
    getPelotasMeteogram(),
  ]);

  return {
    weather:
      weatherResult.status === "fulfilled"
        ? weatherResult.value
        : createUnavailableWeatherIntelligence(),
    meteogram:
      meteogramResult.status === "fulfilled"
        ? meteogramResult.value
        : unavailableMeteogram(
            options?.meteogramUnavailableMessage ??
              "O detalhamento horário está temporariamente indisponível.",
          ),
  };
}
