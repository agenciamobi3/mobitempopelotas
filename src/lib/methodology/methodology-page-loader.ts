import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import type { LagoonMonitoringNetworkData } from "@/lib/hydrology/lagoon-network.server";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import type {
  RedemetImageLayerResponse,
  RedemetOverview,
  RedemetStormLayerResponse,
} from "@/lib/redemet/redemet.types";
import type { ForecastAccuracySummary } from "@/lib/weather/forecast-accuracy.server";
import { getForecastAccuracySummary } from "@/lib/weather/forecast-accuracy.functions";
import { createUnavailableWeatherIntelligence } from "@/lib/weather/weather-intelligence-fallback";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

function createUnavailableLaranjal(): LaranjalLevelData {
  return {
    status: "unavailable",
    currentLevel: null,
    updatedAt: null,
    ageMinutes: null,
    trendCmPerHour: null,
    change1hCm: null,
    change6hCm: null,
    change24hCm: null,
    periodAverage: null,
    periodMinimum: null,
    periodMaximum: null,
    series: [],
    source: {
      name: "LabHidroSens / UFPel",
      station: "Estação Laranjal",
      location: "Praia do Laranjal, Pelotas / RS",
      url: "https://tb.labhidrosens.com/dashboard/97ec9a60-d9e1-11f0-ac7c-456d9a25fe9a?publicId=0a869e80-d9e8-11f0-ac7c-456d9a25fe9a",
      fetchedAt: new Date().toISOString(),
    },
    error: "A consulta da Estação Laranjal não respondeu nesta atualização.",
  };
}

function createUnavailableGuaiba(): GuaibaObservationData {
  return {
    status: "unavailable",
    currentLevel: null,
    updatedAt: null,
    ageMinutes: null,
    trendCmPerHour: null,
    variation24hCm: null,
    periodAverage: null,
    periodMinimum: null,
    periodMaximum: null,
    distanceToFloodReference: null,
    floodReference: 3,
    station: "Régua do Cais Mauá",
    location: "Porto Alegre / RS",
    series: [],
    source: {
      name: "MetSul / TideSat Global",
      url: "https://metsul.com/nivel-do-guaiba/",
      methodologyUrl: "https://www.tidesatglobal.com/",
      originalInstitutions: "TideSat Global",
      fetchedAt: new Date().toISOString(),
    },
    error: "A consulta do nível do Guaíba não respondeu nesta atualização.",
  };
}

function createUnavailableLagoonNetwork(): LagoonMonitoringNetworkData {
  return {
    status: "unavailable",
    available: 0,
    total: 5,
    latestUpdatedAt: null,
    observations: [],
    source: {
      name: "Rede de Monitoramento do Nível da Lagoa dos Patos",
      organizations: "FURG & Portos RS",
      url: "https://monitoramentolagoadospatos.com.br/",
      apiUrl: "https://api-medidas-porto-7bni.onrender.com",
      reference: "Referencial vertical brasileiro — Marégrafo de Imbituba/SC",
      fetchedAt: new Date().toISOString(),
    },
    error: "A rede regional da Lagoa dos Patos não respondeu nesta atualização.",
  };
}

function unavailableImageLayer(
  provider: RedemetImageLayerResponse["provider"],
  product: string,
  sourceLabel: string,
  officialUrl?: string,
): RedemetImageLayerResponse {
  return {
    configured: true,
    available: false,
    provider,
    product,
    sourceLabel,
    officialUrl,
    frames: [],
    currentIndex: 0,
    updatedAt: new Date().toISOString(),
    error: "A camada não respondeu nesta atualização.",
  };
}

function unavailableStormLayer(): RedemetStormLayerResponse {
  return {
    configured: true,
    available: false,
    provider: "REDEMET / DECEA",
    product: "STSC — ocorrências de trovoada",
    sourceLabel: "STSC em até 450 km de Pelotas",
    frames: [],
    currentIndex: 0,
    updatedAt: new Date().toISOString(),
    error: "A camada de trovoadas não respondeu nesta atualização.",
  };
}

function createUnavailableRedemet(): RedemetOverview {
  return {
    radar: unavailableImageLayer(
      "REDEMET / DECEA",
      "Radar meteorológico",
      "Radar REDEMET",
      "https://redemet.decea.mil.br/radar/",
    ),
    satellite: unavailableImageLayer(
      "REDEMET / DECEA",
      "Satélite infravermelho realçado",
      "Satélite REDEMET",
    ),
    inmetSatellite: unavailableImageLayer(
      "INMET",
      "GOES — infravermelho",
      "GOES / Região Sul / canal infravermelho",
      "https://satelite.inmet.gov.br/",
    ),
    storms: unavailableStormLayer(),
  };
}

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
 */
export async function loadMethodologyPageData() {
  const [weatherResult, levelResult, redemetResult, guaibaResult, lagoonResult, accuracyResult] =
    await Promise.allSettled([
      getWeatherIntelligence(),
      getLaranjalLevelData(),
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
    level: levelResult.status === "fulfilled" ? levelResult.value : createUnavailableLaranjal(),
    redemet:
      redemetResult.status === "fulfilled" ? redemetResult.value : createUnavailableRedemet(),
    guaiba: guaibaResult.status === "fulfilled" ? guaibaResult.value : createUnavailableGuaiba(),
    lagoon:
      lagoonResult.status === "fulfilled" ? lagoonResult.value : createUnavailableLagoonNetwork(),
    accuracy:
      accuracyResult.status === "fulfilled" ? accuracyResult.value : createUnavailableAccuracy(),
  };
}
