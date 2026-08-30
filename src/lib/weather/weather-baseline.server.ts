import { fetchMetNorwayWeather } from "./met-norway.server";
import { fetchPelotasWeather as fetchOpenMeteoWeather } from "./open-meteo-resilient.server";
import { selectBaseline, type WeatherBaselineData } from "./weather-baseline-select";
import type { WeatherHomeData } from "./types";

export type { WeatherBaselineData } from "./weather-baseline-select";

// O baseline participa da consolidação meteorológica, cujo teto global é 5 s.
// O caminho resiliente do Open-Meteo pode encadear origem direta, cache e Edge;
// quando a origem está fora, esse encadeamento não pode impedir o MET Norway
// (que roda em paralelo) de assumir como contingência dentro do mesmo request.
export const OPEN_METEO_BASELINE_DEADLINE_MS = 3_200;

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

async function fetchOpenMeteoWithinBaselineDeadline(): Promise<WeatherHomeData> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      fetchOpenMeteoWeather(),
      new Promise<WeatherHomeData>((resolve) => {
        timeout = setTimeout(() => {
          console.warn("[weather/baseline] Open-Meteo excedeu o orçamento do baseline", {
            deadlineMs: OPEN_METEO_BASELINE_DEADLINE_MS,
          });
          resolve(unavailableOpenMeteoWithinBaseline());
        }, OPEN_METEO_BASELINE_DEADLINE_MS);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function fetchPelotasWeather(): Promise<WeatherBaselineData> {
  const [openMeteo, metNorway] = await Promise.all([
    fetchOpenMeteoWithinBaselineDeadline(),
    fetchMetNorwayWeather(),
  ]);

  return selectBaseline(openMeteo, metNorway);
}
