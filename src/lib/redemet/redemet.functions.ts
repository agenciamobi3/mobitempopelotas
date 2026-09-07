import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchInmetSatellite } from "@/lib/weather/inmet-satellite.server";
import { withRedemetLastGood } from "./redemet-last-good.server";
import { fetchRedemetRadarResilient } from "./redemet-radar.server";
import {
  fetchOfficialRedemetSatellite,
  selectOfficialSatelliteResult,
} from "./redemet-satellite-resilient.server";
import { fetchRedemetStorms } from "./redemet-stsc.server";
import type {
  RedemetImageLayerResponse,
  RedemetOverview,
  RedemetStormLayerResponse,
} from "./redemet.types";

// A página pública prioriza uma janela curta de coletas reais. Os endpoints
// continuam aceitando janelas maiores quando usados diretamente.
const IMAGE_FRAME_WINDOW = 4;
const STORM_FRAME_WINDOW = 6;
const OVERVIEW_LAYER_DEADLINE_MS = 4_500;

function unavailableImageLayer(
  provider: RedemetImageLayerResponse["provider"],
  product: string,
  sourceLabel: string,
  error: string,
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
    error,
  };
}

function unavailableStormLayer(error: string): RedemetStormLayerResponse {
  return {
    configured: true,
    available: false,
    provider: "REDEMET / DECEA",
    product: "STSC — ocorrências de trovoada",
    sourceLabel: "STSC em até 450 km de Pelotas",
    frames: [],
    currentIndex: 0,
    updatedAt: new Date().toISOString(),
    error,
  };
}

async function settleWithin<T>(promise: Promise<T>, fallback: () => T): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback()), OVERVIEW_LAYER_DEADLINE_MS);
      }),
    ]);
  } catch {
    return fallback();
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export const getRedemetOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<RedemetOverview> => {
    setResponseHeaders(
      new Headers({
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "CDN-Cache-Control": "max-age=120, stale-while-revalidate=600",
      }),
    );

    const [radar, redemetSatellite, inmetSatellite, storms] = await Promise.all([
      settleWithin(
        withRedemetLastGood(`radar:${IMAGE_FRAME_WINDOW}`, () =>
          fetchRedemetRadarResilient(IMAGE_FRAME_WINDOW),
        ),
        () =>
          unavailableImageLayer(
            "REDEMET / DECEA",
            "Radar meteorológico",
            "Radar REDEMET",
            "A integração do radar excedeu o orçamento de carregamento da página.",
            "https://redemet.decea.mil.br/radar/",
          ),
      ),
      settleWithin(
        withRedemetLastGood(`satellite:realcada:${IMAGE_FRAME_WINDOW}`, () =>
          fetchOfficialRedemetSatellite("realcada", IMAGE_FRAME_WINDOW),
        ),
        () =>
          unavailableImageLayer(
            "REDEMET / DECEA",
            "Satélite infravermelho realçado",
            "Satélite REDEMET",
            "A integração do satélite REDEMET excedeu o orçamento de carregamento da página.",
            "https://redemet.decea.mil.br/",
          ),
      ),
      settleWithin(
        withRedemetLastGood(`satellite:inmet:goes:s:iv:${IMAGE_FRAME_WINDOW}`, () =>
          fetchInmetSatellite(IMAGE_FRAME_WINDOW),
        ),
        () =>
          unavailableImageLayer(
            "INMET",
            "GOES — infravermelho",
            "GOES / Região Sul / canal infravermelho",
            "A integração de satélite do INMET excedeu o orçamento de carregamento da página.",
            "https://satelite.inmet.gov.br/",
          ),
      ),
      settleWithin(
        withRedemetLastGood(`storms:${STORM_FRAME_WINDOW}`, () =>
          fetchRedemetStorms(STORM_FRAME_WINDOW),
        ),
        () =>
          unavailableStormLayer(
            "A integração STSC excedeu o orçamento de carregamento da página.",
          ),
      ),
    ]);

    const satellite = selectOfficialSatelliteResult(
      "realcada",
      redemetSatellite,
      inmetSatellite,
    );

    return { radar, satellite, inmetSatellite, storms };
  },
);
