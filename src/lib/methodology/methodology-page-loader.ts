import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import { fetchLaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import {
  createUnavailableGuaibaObservationData,
  createUnavailableLagoonMonitoringNetworkData,
  createUnavailableLaranjalLevelData,
} from "@/lib/hydrology/public-hydrology-page-loader";
import { createUnavailableRedemetOverview } from "@/lib/redemet/redemet-fallback";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import type { ForecastAccuracySummary } from "@/lib/weather/forecast-accuracy.server";
import { getForecastAccuracySummary } from "@/lib/weather/forecast-accuracy.functions";
import { createUnavailableWeatherIntelligence } from "@/lib/weather/weather-intelligence-fallback";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

function createUnavailableAccuracy(): ForecastAccuracySummary {
  return {
    status: "unavailable",
    windowDays: 30,
    evaluationCount: 0,
    verifiedDays: 0,
    firstDate: null,
    lastDate: null,
    providers: [],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * A metodologia é uma página de transparência: uma fonte indisponível deve aparecer
 * como indisponível, não impedir a leitura das demais integrações.
 *
 * O cartão "Estação Laranjal · LabHidroSens/UFPel" audita deliberadamente a fonte
 * primária em si. Ele não usa o seletor público, porque isso faria uma leitura CIEX/FURG
 * aparecer sob o nome do Lab. A rede da Lagoa permanece auditada separadamente.
 */
export async function loadMethodologyPageData() {
  const [weatherResult, levelResult, redemetResult, guaibaResult, lagoonResult, accuracyResult] =
    await Promise.allSettled([
      getWeatherIntelligence(),
      fetchLaranjalLevelData({ deadlineMs: 2_500 }),
      getRedemetOverview(),
      getGuaibaObservation(),
      getLagoonMonitoringNetwork(),
      getForecastAccuracySummary(),
    ]);

  return {
    weather:
      weatherResult.status === "fulfilled"
        ? weatherResult.value
        : createUnavailableWeatherIntelligence(),
    level:
      levelResult.status === "fulfilled"
        ? levelResult.value
        : createUnavailableLaranjalLevelData(),
    redemet:
      redemetResult.status === "fulfilled"
        ? redemetResult.value
        : createUnavailableRedemetOverview(),
    guaiba:
      guaibaResult.status === "fulfilled"
        ? guaibaResult.value
        : createUnavailableGuaibaObservationData(),
    lagoon:
      lagoonResult.status === "fulfilled"
        ? lagoonResult.value
        : createUnavailableLagoonMonitoringNetworkData(),
    accuracy:
      accuracyResult.status === "fulfilled" ? accuracyResult.value : createUnavailableAccuracy(),
  };
}
