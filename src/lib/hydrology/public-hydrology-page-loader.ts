import { getAnaRhnRegionalHydrography } from "./ana-rhn-hydrography.functions";
import { createUnavailableAnaRhnHydrography } from "./ana-rhn-hydrography.server";
import { getAnaRhnLaranjalStationProfile } from "./ana-rhn-laranjal-profile.functions";
import { createUnavailableAnaRhnLaranjalStationProfile } from "./ana-rhn-laranjal-profile.server";
import { getAnaRhnRegionalInventory } from "./ana-rhn-regional.functions";
import type { AnaRhnRegionalInventoryData } from "./ana-rhn-regional.server";
import { getDefesaCivilHydroData } from "./defesa-civil-rs.functions";
import type { DefesaCivilHydroData } from "./defesa-civil-rs.server";
import { getGuaibaObservation } from "./guaiba.functions";
import type { GuaibaObservationData } from "./guaiba.server";
import { getLagoonMonitoringNetwork } from "./lagoon-network.functions";
import type { LagoonMonitoringNetworkData } from "./lagoon-network.server";
import { getLaranjalLevelData } from "./laranjal-level.functions";
import type { LaranjalLevelData } from "./laranjal-level.server";
import { getSaceGuaibaData } from "./sace-guaiba.functions";
import type { SaceGuaibaData } from "./sace-guaiba.server";
import { createUnavailableWeatherIntelligence } from "@/lib/weather/weather-intelligence-fallback";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PUBLIC_HYDROLOGY_PAGE_DEADLINE_MS = 2_500;

async function settlePageDependency<T>(run: () => Promise<T>, fallback: () => T): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const value = await Promise.race([
      Promise.resolve().then(run),
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback()), PUBLIC_HYDROLOGY_PAGE_DEADLINE_MS);
      }),
    ]);

    return value ?? fallback();
  } catch {
    return fallback();
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function settledValueOrFallback<T>(result: PromiseSettledResult<T>, fallback: () => T): T {
  return result.status === "fulfilled" && result.value != null ? result.value : fallback();
}

export function createUnavailableLaranjalLevelData(): LaranjalLevelData {
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

export function createUnavailableGuaibaObservationData(): GuaibaObservationData {
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

export function createUnavailableLagoonMonitoringNetworkData(): LagoonMonitoringNetworkData {
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

export function createUnavailableSaceGuaibaData(): SaceGuaibaData {
  return {
    status: "unavailable",
    stations: [],
    highlightedStations: [],
    legend: [],
    bounds: null,
    layers: [],
    counts: {
      total: 0,
      transmitting: 0,
      normal: 0,
      aboveNormal: 0,
      withoutTransmission: 0,
    },
    systems: [],
    source: {
      name: "SACE Guaíba / Serviço Geológico do Brasil",
      url: "https://sace.sgb.gov.br/guaiba/",
      fetchedAt: new Date().toISOString(),
      endpoints: [],
    },
    error: "A consulta do SACE Guaíba não respondeu nesta atualização.",
  };
}

export function createUnavailableDefesaCivilHydroData(): DefesaCivilHydroData {
  return {
    status: "unavailable",
    stations: [],
    statewideStationCount: 0,
    regionalStationCount: 0,
    recentStationCount: 0,
    latestObservationAt: null,
    inventory: { HYDROLOGY: 0, METEOROLOGY: 0, BOTH: 0, UNKNOWN: 0 },
    source: {
      name: "Defesa Civil RS — Rede de Monitoramento Hidrometeorológico",
      endpoint: "https://redehidrometeorologica.defesacivil.rs.gov.br/graphql",
      mapUrl: "https://redehidrometeorologica.defesacivil.rs.gov.br/Mapa",
      documentationUrl: "https://sistemas.defesacivil.rs.gov.br/api-redehidrometeorologica",
      fetchedAt: new Date().toISOString(),
    },
    publication: {
      enabled: true,
      note: "A integração pública está habilitada, mas a consulta não respondeu nesta atualização.",
    },
    error: "A Rede de Monitoramento Hidrometeorológico da Defesa Civil RS não respondeu nesta atualização.",
  };
}

export function createUnavailableAnaRhnRegionalInventoryData(): AnaRhnRegionalInventoryData {
  return {
    status: "unavailable",
    stations: [],
    searchRadiusKm: 180,
    source: {
      name: "ANA / SNIRH / Rede Hidrometeorológica Nacional",
      url: "https://www.snirh.gov.br/hidroweb/",
      layerUrl:
        "https://portal1.snirh.gov.br/server/rest/services/Estações_Hidrometeorológicas_SNIRH/FeatureServer/0",
      fetchedAt: new Date().toISOString(),
    },
    error: "O inventário regional ANA/RHN não respondeu nesta atualização.",
  };
}

export async function loadGuaibaPageData() {
  return {
    guaiba: await settlePageDependency(
      () => getGuaibaObservation(),
      createUnavailableGuaibaObservationData,
    ),
  };
}

export async function loadLaranjalHydrologyPageData() {
  const [weatherResult, levelResult, anaRhnProfileResult] = await Promise.allSettled([
    settlePageDependency(() => getWeatherIntelligence(), createUnavailableWeatherIntelligence),
    settlePageDependency(() => getLaranjalLevelData(), createUnavailableLaranjalLevelData),
    settlePageDependency(
      () => getAnaRhnLaranjalStationProfile(),
      createUnavailableAnaRhnLaranjalStationProfile,
    ),
  ]);

  return {
    weather: settledValueOrFallback(weatherResult, createUnavailableWeatherIntelligence),
    level: settledValueOrFallback(levelResult, createUnavailableLaranjalLevelData),
    anaRhnProfile: settledValueOrFallback(
      anaRhnProfileResult,
      createUnavailableAnaRhnLaranjalStationProfile,
    ),
  };
}

export async function loadHydrologyOverviewPageData() {
  const [
    weatherResult,
    levelResult,
    guaibaResult,
    lagoonResult,
    saceResult,
    defesaCivilResult,
    anaRhnRegionalResult,
    anaRhnHydrographyResult,
  ] = await Promise.allSettled([
    settlePageDependency(() => getWeatherIntelligence(), createUnavailableWeatherIntelligence),
    settlePageDependency(() => getLaranjalLevelData(), createUnavailableLaranjalLevelData),
    settlePageDependency(() => getGuaibaObservation(), createUnavailableGuaibaObservationData),
    settlePageDependency(
      () => getLagoonMonitoringNetwork(),
      createUnavailableLagoonMonitoringNetworkData,
    ),
    settlePageDependency(() => getSaceGuaibaData(), createUnavailableSaceGuaibaData),
    settlePageDependency(() => getDefesaCivilHydroData(), createUnavailableDefesaCivilHydroData),
    settlePageDependency(
      () => getAnaRhnRegionalInventory(),
      createUnavailableAnaRhnRegionalInventoryData,
    ),
    settlePageDependency(
      () => getAnaRhnRegionalHydrography(),
      createUnavailableAnaRhnHydrography,
    ),
  ]);

  return {
    weather: settledValueOrFallback(weatherResult, createUnavailableWeatherIntelligence),
    level: settledValueOrFallback(levelResult, createUnavailableLaranjalLevelData),
    guaiba: settledValueOrFallback(guaibaResult, createUnavailableGuaibaObservationData),
    lagoon: settledValueOrFallback(lagoonResult, createUnavailableLagoonMonitoringNetworkData),
    sace: settledValueOrFallback(saceResult, createUnavailableSaceGuaibaData),
    defesaCivil: settledValueOrFallback(defesaCivilResult, createUnavailableDefesaCivilHydroData),
    anaRhnRegional: settledValueOrFallback(
      anaRhnRegionalResult,
      createUnavailableAnaRhnRegionalInventoryData,
    ),
    anaRhnHydrography: settledValueOrFallback(
      anaRhnHydrographyResult,
      createUnavailableAnaRhnHydrography,
    ),
  };
}
