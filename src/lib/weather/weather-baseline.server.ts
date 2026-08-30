import { fetchMetNorwayWeather } from "./met-norway.server";
import { fetchPelotasWeather as fetchOpenMeteoWeather } from "./open-meteo-resilient.server";
import { selectBaseline, type WeatherBaselineData } from "./weather-baseline-select";
import type { WeatherHomeData } from "./types";

export type { WeatherBaselineData } from "./weather-baseline-select";

// Loaders públicos que dependem desta base têm teto de 2,5 s. Quando o MET Norway
// já respondeu como fonte utilizável, o Open-Meteo recebe somente uma janela primária
// total de 2,2 s para preservar sua preferência sem segurar a contingência.
export const OPEN_METEO_PRIMARY_GRACE_MS = 2_200;

// Se o MET Norway também estiver indisponível, vale gastar um pouco mais do orçamento
// global de 5 s tentando last-good/Edge do Open-Meteo antes de declarar indisponibilidade.
export const OPEN_METEO_CONTINGENCY_DEADLINE_MS = 4_200;

function unavailableOpenMeteoWithinBaseline(): WeatherHomeData {
  return {
    status: "unavailable",
    current: null,
    hourly: [],
    daily: [],
    source: {
      name: "Open-Meteo",
      url: "https://open-meteo.com/",
      kind: "forecast",
      key: "open-meteo",
      fetchedAt: new Date().toISOString(),
      isFallback: true,
      model: "Open-Meteo Best Match",
      modelRun: null,
      temporalResolutionMinutes: 60,
    },
    message:
      "O Open-Meteo não concluiu a recuperação dentro do orçamento desta página; a fonte de contingência pode assumir a previsão.",
  };
}

async function settleOpenMeteoWithin(
  openMeteoPromise: Promise<WeatherHomeData>,
  remainingMs: number,
  deadlineMs: number,
): Promise<WeatherHomeData> {
  if (remainingMs <= 0) return unavailableOpenMeteoWithinBaseline();

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      openMeteoPromise,
      new Promise<WeatherHomeData>((resolve) => {
        timeout = setTimeout(() => {
          console.warn("[weather/baseline] Open-Meteo excedeu o orçamento do baseline", {
            deadlineMs,
          });
          resolve(unavailableOpenMeteoWithinBaseline());
        }, remainingMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function fetchPelotasWeather(): Promise<WeatherBaselineData> {
  const startedAt = Date.now();
  const openMeteoPromise = fetchOpenMeteoWeather();
  const metNorway = await fetchMetNorwayWeather();

  const deadlineMs =
    metNorway.status === "live"
      ? OPEN_METEO_PRIMARY_GRACE_MS
      : OPEN_METEO_CONTINGENCY_DEADLINE_MS;
  const elapsedMs = Date.now() - startedAt;
  const openMeteo = await settleOpenMeteoWithin(
    openMeteoPromise,
    Math.max(0, deadlineMs - elapsedMs),
    deadlineMs,
  );

  return selectBaseline(openMeteo, metNorway);
}
