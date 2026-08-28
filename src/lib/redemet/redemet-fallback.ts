import type {
  RedemetImageLayerResponse,
  RedemetOverview,
  RedemetStormLayerResponse,
} from "./redemet.types";

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

export function createUnavailableRedemetOverview(): RedemetOverview {
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
