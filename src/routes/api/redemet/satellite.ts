import { createFileRoute } from "@tanstack/react-router";

import { withRedemetLastGood } from "@/lib/redemet/redemet-last-good.server";
import { fetchResilientSatellite } from "@/lib/redemet/redemet-satellite-resilient.server";
import {
  isUsefulVisibleSatelliteTimestamp,
  keepUsefulVisibleSatelliteFrames,
  nextUsefulVisibleSatelliteTimestamp,
} from "@/lib/redemet/redemet-visible-daylight";
import type {
  RedemetImageLayerResponse,
  RedemetSatelliteType,
} from "@/lib/redemet/redemet.types";
import { fetchInmetSatellite } from "@/lib/weather/inmet-satellite.server";

const ALLOWED_TYPES = new Set<RedemetSatelliteType>(["realcada", "ir", "vis"]);
const DEFAULT_FRAMES = 8;
const MAX_FRAMES = 8;
const VISIBLE_LOOKBACK_FRAMES = 15;

const RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
  "CDN-Cache-Control": "max-age=300, stale-while-revalidate=900",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function requestOptions(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const source = searchParams.get("source") === "inmet" ? "inmet" : "redemet";
  const rawType = searchParams.get("type") ?? "realcada";
  const type = ALLOWED_TYPES.has(rawType as RedemetSatelliteType)
    ? (rawType as RedemetSatelliteType)
    : "realcada";
  const requested = Number(searchParams.get("frames") ?? DEFAULT_FRAMES);
  const frames = Number.isFinite(requested)
    ? Math.min(MAX_FRAMES, Math.max(1, Math.round(requested)))
    : DEFAULT_FRAMES;

  return { source, type, frames } as const;
}

function daylightVisiblePayload(payload: RedemetImageLayerResponse, requestedFrames: number) {
  if (!payload.available) return payload;

  const frames = keepUsefulVisibleSatelliteFrames(payload.frames, requestedFrames);
  if (!frames.length) {
    const now = new Date();
    const isNighttime = !isUsefulVisibleSatelliteTimestamp(now.toISOString());

    return {
      ...payload,
      available: false,
      frames: [],
      currentIndex: 0,
      availabilityReason: isNighttime ? "daylight" : null,
      nextExpectedAt: isNighttime ? nextUsefulVisibleSatelliteTimestamp(now) : null,
      error: isNighttime
        ? "Durante a noite, o canal visível não produz uma imagem útil. Use Infravermelho ou Realçado enquanto aguardamos a próxima janela de luz solar."
        : "Ainda não há uma imagem visível diurna utilizável nesta atualização da REDEMET.",
    } satisfies RedemetImageLayerResponse;
  }

  return {
    ...payload,
    frames,
    currentIndex: frames.length - 1,
    updatedAt: frames.at(-1)?.observedAt ?? payload.updatedAt,
    error: null,
    availabilityReason: null,
    nextExpectedAt: null,
  } satisfies RedemetImageLayerResponse;
}

function sanitizePublicSatellitePayload(payload: RedemetImageLayerResponse) {
  if (payload.available || !payload.error || payload.availabilityReason === "daylight") {
    return payload;
  }

  return {
    ...payload,
    error:
      "A fonte oficial de satélite não retornou uma imagem utilizável nesta atualização. Tente novamente em alguns minutos.",
  } satisfies RedemetImageLayerResponse;
}

export const Route = createFileRoute("/api/redemet/satellite")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { source, type, frames } = requestOptions(request);

        if (source === "inmet") {
          const payload = await withRedemetLastGood(`satellite:inmet:${frames}`, () =>
            fetchInmetSatellite(frames),
          );
          const publicPayload = sanitizePublicSatellitePayload(payload);
          return new Response(JSON.stringify(publicPayload), { headers: RESPONSE_HEADERS });
        }

        const upstreamFrames = type === "vis" ? VISIBLE_LOOKBACK_FRAMES : frames;
        const payload = await withRedemetLastGood(`satellite:${type}:${upstreamFrames}`, () =>
          fetchResilientSatellite(type, upstreamFrames),
        );
        const displayPayload = type === "vis" ? daylightVisiblePayload(payload, frames) : payload;
        const publicPayload = sanitizePublicSatellitePayload(displayPayload);

        return new Response(JSON.stringify(publicPayload), { headers: RESPONSE_HEADERS });
      },
    },
  },
});
