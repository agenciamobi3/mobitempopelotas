import { getPelotasMeteogram } from "./meteogram.functions";
import type { MeteogramData } from "./meteogram.server";
import { createUnavailableWeatherIntelligence } from "./weather-intelligence-fallback";
import { getWeatherIntelligence } from "./weather-intelligence.functions";

const PUBLIC_WEATHER_PAGE_DEADLINE_MS = 2_500;

async function settlePageDependency<T>(promise: Promise<T>, fallback: () => T): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback()), PUBLIC_WEATHER_PAGE_DEADLINE_MS);
      }),
    ]);
  } catch {
    return fallback();
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

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
 * Barreira final para páginas públicas que dependem somente da inteligência
 * meteorológica consolidada. O documento público não espera indefinidamente por
 * integrações: depois do budget local a rota abre com contrato indisponível e as
 * fontes voltam a ser consultadas no próximo carregamento explícito.
 */
export async function loadPublicWeatherPage() {
  return settlePageDependency(getWeatherIntelligence(), createUnavailableWeatherIntelligence);
}

/**
 * Loader compartilhado para páginas públicas que combinam a inteligência
 * meteorológica principal com a série horária detalhada do meteograma.
 *
 * Cada domínio possui o mesmo teto de página e degrada de forma independente.
 * Uma fonte lenta ou uma rejeição de transporte não pode promover a rota inteira
 * ao error boundary global.
 */
export async function loadPublicWeatherWithMeteogram(options?: {
  meteogramUnavailableMessage?: string;
}) {
  const [weather, meteogram] = await Promise.all([
    settlePageDependency(getWeatherIntelligence(), createUnavailableWeatherIntelligence),
    settlePageDependency(
      getPelotasMeteogram(),
      () =>
        unavailableMeteogram(
          options?.meteogramUnavailableMessage ??
            "O detalhamento horário está temporariamente indisponível.",
        ),
    ),
  ]);

  return { weather, meteogram };
}
