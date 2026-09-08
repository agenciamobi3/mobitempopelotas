import { fetchRedemetRadarResilient } from "@/lib/redemet/redemet-radar.server";
import { fetchOfficialRedemetSatellite } from "@/lib/redemet/redemet-satellite-resilient.server";
import { fetchRedemetStorms } from "@/lib/redemet/redemet-stsc.server";
import type {
  RedemetImageLayerResponse,
  RedemetStormLayerResponse,
} from "@/lib/redemet/redemet.types";
import { fetchInmetSatellite } from "@/lib/weather/inmet-satellite.server";

import { collectDataStatus, overallState } from "./data-status.server";
import type { DataStatusOverview, ServiceState, ServiceStatus } from "./data-status.types";

const PROBE_DEADLINE_MS = 5_000;
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
type ProbeProvider = RedemetImageLayerResponse["provider"];

type ProbeDefinition = {
  id: string;
  name: string;
  provider: ProbeProvider;
  sourceUrl?: string;
  run: () => Promise<ProbeLayer>;
};

function timeoutLayer(provider: ProbeProvider, label: string): RedemetImageLayerResponse {
  return {
    configured: true,
    available: false,
    provider,
    product: label,
    sourceLabel: label,
    frames: [],
    currentIndex: 0,
    updatedAt: new Date().toISOString(),
    error: "A fonte não respondeu dentro do tempo desta verificação.",
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
  } catch {
    return {
      ...timeoutLayer(definition.provider, definition.name),
      error: "A fonte não entregou dados utilizáveis nesta verificação.",
    };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function probeState(definition: ProbeDefinition, layer: ProbeLayer): ServiceState {
  if (layer.configured && layer.available) return "operational";

  const error = layer.error ?? "";
  const redemetAnsweredWithoutProduct =
    definition.id === "redemet-satellite" &&
    layer.configured &&
    (error.startsWith("A REDEMET respondeu sem imagem utilizável") ||
      error.startsWith("A integração recebeu resposta da REDEMET"));

  if (redemetAnsweredWithoutProduct) return "partial";

  const inmetSatelliteServerSideBlocked =
    definition.id === "inmet-satellite" &&
    layer.configured &&
    /HTTP 403|recusou a integração server-side/i.test(error);

  if (inmetSatelliteServerSideBlocked) return "implementation";
  return "offline";
}

function serviceFromProbe(
  definition: ProbeDefinition,
  layer: ProbeLayer,
  fallbackCheckedAt: string,
): ServiceStatus {
  const state = probeState(definition, layer);
  const frameDetail =
    layer.frames.length === 1
      ? "1 quadro utilizável"
      : `${layer.frames.length} quadros utilizáveis`;
  const detail =
    state === "operational"
      ? `Fonte respondeu com ${frameDetail}.`
      : state === "implementation" && definition.id === "inmet-satellite"
        ? "O produto público existe, mas a consulta automática do Tempo Pelotas não está disponível nesta integração."
        : state === "partial"
          ? "A fonte respondeu, mas não entregou uma imagem utilizável nesta verificação."
          : "A fonte não entregou dados utilizáveis nesta verificação.";

  return {
    id: definition.id,
    name: definition.name,
    provider: layer.provider,
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
