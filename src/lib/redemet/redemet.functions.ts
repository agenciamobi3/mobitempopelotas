import { createServerFn } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

import { fetchInmetSatellite } from "@/lib/weather/inmet-satellite.server";
import { withRedemetLastGood } from "./redemet-last-good.server";
import { fetchRedemetRadarResilient } from "./redemet-radar.server";
import { fetchRedemetSatellite } from "./redemet.server";
import { fetchRedemetStorms } from "./redemet-stsc.server";
import type {
  RedemetImageLayerResponse,
  RedemetOverview,
  RedemetStormLayerResponse,
} from "./redemet.types";

const IMAGE_FRAME_WINDOW = 8;
const STORM_FRAME_WINDOW = 12;
const OVERVIEW_LAYER_DEADLINE_MS = 2_600;

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

    const [radar, satellite, inmetSatellite, storms] = await Promise.all([
      settleWithin(
        withRedemetLastGood(`radar:${IMAGE_FRAME_WINDOW}`, () =>
          fetchRedemetRadarResilient(IMAGE_FRAME_WINDOW),
        ),
        () =>
          unavailableImageLayer(
            "REDEMET / DECEA",
            "Radar meteorológico",
            "Radar REDEMET",
            "O radar excedeu o orçamento de carregamento da página.",
            "https://redemet.decea.mil.br/radar/",
          ),
      ),
      settleWithin(
        withRedemetLastGood(`satellite:realcada:${IMAGE_FRAME_WINDOW}`, () =>
          fetchRedemetSatellite("realcada", IMAGE_FRAME_WINDOW),
        ),
        () =>
          unavailableImageLayer(
            "REDEMET / DECEA",
            "Satélite infravermelho realçado",
            "Satélite REDEMET",
            "O satélite REDEMET excedeu o orçamento de carregamento da página.",
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
            "O satélite do INMET excedeu o orçamento de carregamento da página.",
            "https://satelite.inmet.gov.br/",
          ),
      ),
      settleWithin(
        withRedemetLastGood(`storms:${STORM_FRAME_WINDOW}`, () =>
          fetchRedemetStorms(STORM_FRAME_WINDOW),
        ),
        () => unavailableStormLayer("O STSC excedeu o orçamento de carregamento da página."),
      ),
    ]);

    return { radar, satellite, inmetSatellite, storms };
  },
);
