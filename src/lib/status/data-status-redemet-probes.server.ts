import { fetchRedemetRadarResilient } from "@/lib/redemet/redemet-radar.server";
import { fetchOfficialRedemetSatellite } from "@/lib/redemet/redemet-satellite-resilient.server";
import { fetchRedemetStorms } from "@/lib/redemet/redemet-stsc.server";
import type {
  RedemetImageLayerResponse,
  RedemetStormLayerResponse,
} from "@/lib/redemet/redemet.types";
import { fetchInmetSatellite } from "@/lib/weather/inmet-satellite.server";

import { collectDataStatus, overallState } from "./data-status.server";
import type { DataStatusOverview, ServiceStatus } from "./data-status.types";

const PROBE_DEADLINE_MS = 8_000;
const RADAR_FRAMES = 2;
const SATELLITE_FRAMES = 2;
const STSC_FRAMES = 2;

const REDEMET_SERVICE_IDS = new Set([
  "redemet-radar",
  "redemet-satellite",
  "redemet-stsc",
  "inmet-satellite",
]);

type ProbeLayer = RedemetImageLayerResponse | RedemetStormLayerResponse;

type ProbeDefinition = {
  id: string;
  name: string;
  provider: string;
  sourceUrl?: string;
  run: () => Promise<ProbeLayer>;
};

function timeoutLayer(provider: string, label: string): ProbeLayer {
  return {
    configured: true,
    available: false,
    provider,
    product: label,
    sourceLabel: label,
    frames: [],
    currentIndex: 0,
    updatedAt: new Date().toISOString(),
    error: `O probe independente excedeu ${PROBE_DEADLINE_MS / 1_000} s. Isso indica timeout desta integração, não indisponibilidade global da fonte oficial.`,
  };
}

async function settleProbe(definition: ProbeDefinition): Promise<ProbeLayer> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      definition.run(),
      new Promise<ProbeLayer>((resolve) => {
        timeout = setTimeout(
          () => resolve(timeoutLayer(definition.provider, definition.name)),
          PROBE_DEADLINE_MS,
        );
      }),
    ]);
  } catch (error) {
    return {
      ...timeoutLayer(definition.provider, definition.name),
      error:
        error instanceof Error
          ? `Falha do probe independente: ${error.message}`
          : "Falha desconhecida do probe independente.",
    };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function serviceFromProbe(
  definition: ProbeDefinition,
  layer: ProbeLayer,
  fallbackCheckedAt: string,
): ServiceStatus {
  const state = layer.configured && layer.available ? "operational" : "offline";
  const detail =
    state === "operational"
      ? `Probe independente respondeu com ${layer.frames.length} quadro${layer.frames.length === 1 ? "" : "s"} utilizável${layer.frames.length === 1 ? "" : "eis"}.`
      : layer.error || "A integração não retornou dado utilizável nesta verificação independente.";

  return {
    id: definition.id,
    name: definition.name,
    provider: layer.provider || definition.provider,
    category: "Radar e satélite",
    state,
    detail,
    checkedAt: layer.updatedAt || fallbackCheckedAt,
    sourceUrl:
      "officialUrl" in layer && typeof layer.officialUrl === "string"
        ? layer.officialUrl
        : definition.sourceUrl,
  };
}

export async function collectIndependentRedemetServices(
  checkedAt = new Date().toISOString(),
): Promise<ServiceStatus[]> {
  const definitions: ProbeDefinition[] = [
    {
      id: "redemet-radar",
      name: "Radar meteorológico",
      provider: "REDEMET / DECEA",
      sourceUrl: "https://redemet.decea.mil.br/radar/",
      run: () => fetchRedemetRadarResilient(RADAR_FRAMES),
    },
    {
      id: "redemet-satellite",
      name: "Imagem de satélite",
      provider: "REDEMET / DECEA",
      sourceUrl: "https://redemet.decea.mil.br/",
      run: () => fetchOfficialRedemetSatellite("realcada", SATELLITE_FRAMES),
    },
    {
      id: "redemet-stsc",
      name: "Ocorrências de trovoadas — STSC",
      provider: "REDEMET / DECEA",
      sourceUrl: "https://redemet.decea.mil.br/",
      run: () => fetchRedemetStorms(STSC_FRAMES),
    },
    {
      id: "inmet-satellite",
      name: "Satélite meteorológico complementar",
      provider: "INMET",
      sourceUrl: "https://satelite.inmet.gov.br/",
      run: () => fetchInmetSatellite(SATELLITE_FRAMES),
    },
  ];

  const layers = await Promise.all(definitions.map((definition) => settleProbe(definition)));
  return definitions.map((definition, index) =>
    serviceFromProbe(definition, layers[index]!, checkedAt),
  );
}

/**
 * Mantém o restante do overview existente, mas substitui exclusivamente Radar,
 * STSC e os dois satélites por probes das próprias integrações. O monitor deixa
 * de inferir a saúde de uma fonte a partir do loader/composição da página Radar.
 */
export async function collectDataStatusWithIndependentRedemet(): Promise<DataStatusOverview> {
  const checkedAt = new Date().toISOString();
  const [overview, redemetServices] = await Promise.all([
    collectDataStatus(),
    collectIndependentRedemetServices(checkedAt),
  ]);

  const services = [
    ...overview.services.filter((service) => !REDEMET_SERVICE_IDS.has(service.id)),
    ...redemetServices,
  ];

  return {
    ...overview,
    overall: overallState(services),
    services,
  };
}
