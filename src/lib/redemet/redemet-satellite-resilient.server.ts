import { fetchInmetSatellite } from "../weather/inmet-satellite.server";
import { fetchRedemetSatellite } from "./redemet.server";
import type { RedemetImageLayerResponse, RedemetSatelliteType } from "./redemet.types";

const PRIMARY_DEADLINE_MS = 1_900;
const FALLBACK_DEADLINE_MS = 2_100;

function timedUnavailable(
  provider: RedemetImageLayerResponse["provider"],
  product: string,
  sourceLabel: string,
  message: string,
): RedemetImageLayerResponse {
  return {
    configured: true,
    available: false,
    provider,
    product,
    sourceLabel,
    frames: [],
    currentIndex: 0,
    updatedAt: new Date().toISOString(),
    error: message,
  };
}

async function settleWithin<T>(promise: Promise<T>, timeoutMs: number, fallback: () => T) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback()), timeoutMs);
      }),
    ]);
  } catch {
    return fallback();
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function requestedProductLabel(type: RedemetSatelliteType) {
  if (type === "realcada") return "satélite infravermelho realçado";
  if (type === "ir") return "satélite infravermelho";
  return "satélite visível";
}

export function selectOfficialSatelliteResult(
  type: RedemetSatelliteType,
  redemet: RedemetImageLayerResponse,
  inmet: RedemetImageLayerResponse | null,
): RedemetImageLayerResponse {
  if (redemet.available || type === "vis") return redemet;

  if (inmet?.available) {
    return {
      ...inmet,
      product: `${inmet.product} · contingência oficial`,
      sourceLabel: `${inmet.sourceLabel} · contingência para ${requestedProductLabel(type)} REDEMET`,
      error: null,
    };
  }

  const errors = [redemet.error, inmet?.error ? `GOES/INMET: ${inmet.error}` : null].filter(
    (value): value is string => Boolean(value),
  );

  return {
    ...redemet,
    error:
      errors.length > 0
        ? errors.join(" ")
        : "As fontes oficiais de satélite consultadas não retornaram imagem utilizável.",
  };
}

/**
 * Preserva o produto REDEMET pedido pelo usuário como primeira escolha.
 * Para Realçado/IR, usa GOES/INMET apenas quando a REDEMET não entrega uma
 * camada utilizável. O canal Visível não recebe fallback infravermelho porque
 * isso mudaria a semântica do produto selecionado.
 */
export async function fetchResilientSatellite(
  type: RedemetSatelliteType,
  frameCount = 8,
): Promise<RedemetImageLayerResponse> {
  const redemet = await settleWithin(
    fetchRedemetSatellite(type, frameCount),
    PRIMARY_DEADLINE_MS,
    () =>
      timedUnavailable(
        "REDEMET / DECEA",
        requestedProductLabel(type),
        "Satélite REDEMET",
        "A consulta do satélite REDEMET excedeu o orçamento de carregamento.",
      ),
  );

  if (redemet.available || type === "vis") return redemet;

  const inmet = await settleWithin(
    fetchInmetSatellite(frameCount),
    FALLBACK_DEADLINE_MS,
    () =>
      timedUnavailable(
        "INMET",
        "GOES — infravermelho",
        "GOES / Região Sul / canal infravermelho",
        "A contingência de satélite do INMET excedeu o orçamento de carregamento.",
      ),
  );

  return selectOfficialSatelliteResult(type, redemet, inmet);
}
