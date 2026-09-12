import type {
  RedemetImageLayerResponse,
  RedemetStormLayerResponse,
} from "@/lib/redemet/redemet.types";

import type { ObservatoryLayerStatus } from "../core/ObservatoryTypes";
import type { ObservatoryLayerId } from "../core/ObservatoryLayerCatalog";
import type {
  ObservatoryImageLayerPayload,
  ObservatoryPointLayerPayload,
} from "./observatory-live-layers";

export const OBSERVATORY_TEMPORAL_LAYER_IDS = ["radar", "satellite", "lightning"] as const;
export type ObservatoryTemporalLayerId = (typeof OBSERVATORY_TEMPORAL_LAYER_IDS)[number];

export type ObservatoryTemporalFrame = {
  id: string;
  label: string;
  observedAt: string | null;
  detail: string;
  payload: ObservatoryImageLayerPayload | ObservatoryPointLayerPayload;
};

export type ObservatoryTemporalLayerResult = {
  id: ObservatoryTemporalLayerId;
  status: ObservatoryLayerStatus;
  sourceLabel: string;
  product: string;
  updatedAt: string;
  currentIndex: number;
  error: string | null;
  frames: ObservatoryTemporalFrame[];
};

const ENDPOINT_BY_LAYER: Record<ObservatoryTemporalLayerId, string> = {
  radar: "/api/redemet/radar?frames=8",
  satellite: "/api/redemet/satellite?type=realcada&frames=8",
  lightning: "/api/redemet/storms?frames=12",
};

export function isObservatoryTemporalLayerId(
  id: ObservatoryLayerId,
): id is ObservatoryTemporalLayerId {
  return (OBSERVATORY_TEMPORAL_LAYER_IDS as readonly string[]).includes(id);
}

function clampCurrentIndex(length: number, requested: number) {
  if (length <= 0) return 0;
  if (!Number.isInteger(requested)) return length - 1;
  return Math.min(length - 1, Math.max(0, requested));
}

async function fetchTemporalJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Fonte temporal respondeu com status ${response.status}`);
  }

  return (await response.json()) as T;
}

function imageResult(
  id: "radar" | "satellite",
  layer: RedemetImageLayerResponse,
): ObservatoryTemporalLayerResult {
  return {
    id,
    status: layer.frames.length === 0 ? "unavailable" : layer.error ? "degraded" : "current",
    sourceLabel: layer.sourceLabel,
    product: layer.product,
    updatedAt: layer.updatedAt,
    currentIndex: clampCurrentIndex(layer.frames.length, layer.currentIndex),
    error: layer.error,
    frames: layer.frames.map((frame) => ({
      id: frame.id,
      label: frame.label,
      observedAt: frame.observedAt,
      detail: `${layer.sourceLabel} · ${frame.label}`,
      payload: {
        kind: "image" as const,
        imageUrl: frame.imageUrl,
        bounds: frame.bounds,
      },
    })),
  };
}

function lightningResult(layer: RedemetStormLayerResponse): ObservatoryTemporalLayerResult {
  return {
    id: "lightning",
    status: layer.frames.length === 0 ? (layer.error ? "unavailable" : "current") : layer.error ? "degraded" : "current",
    sourceLabel: layer.sourceLabel,
    product: layer.product,
    updatedAt: layer.updatedAt,
    currentIndex: clampCurrentIndex(layer.frames.length, layer.currentIndex),
    error: layer.error,
    frames: layer.frames.map((frame) => ({
      id: frame.id,
      label: frame.label,
      observedAt: frame.observedAt,
      detail: `${frame.points.length} ocorrência${frame.points.length === 1 ? "" : "s"} · ${frame.label}`,
      payload: {
        kind: "points" as const,
        points: frame.points.map((point, index) => ({
          id: `${frame.id}:${index}`,
          latitude: point.latitude,
          longitude: point.longitude,
          color: "#ffd34d",
          outlineColor: "#fff3ad",
          pixelSize: 7,
          label: "Ocorrência STSC",
          detail: frame.observedAt,
        })),
      },
    })),
  };
}

export async function loadObservatoryTemporalLayer(
  id: ObservatoryTemporalLayerId,
): Promise<ObservatoryTemporalLayerResult> {
  if (id === "lightning") {
    const payload = await fetchTemporalJson<RedemetStormLayerResponse>(ENDPOINT_BY_LAYER[id]);
    return lightningResult(payload);
  }

  const payload = await fetchTemporalJson<RedemetImageLayerResponse>(ENDPOINT_BY_LAYER[id]);
  return imageResult(id, payload);
}

export function temporalTimestamps(result: ObservatoryTemporalLayerResult) {
  return result.frames
    .map((frame) => frame.observedAt)
    .filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value)));
}

export function selectTemporalFrame(
  result: ObservatoryTemporalLayerResult,
  selectedAt: string | null,
): ObservatoryTemporalFrame | null {
  if (result.frames.length === 0) return null;

  if (!selectedAt || !Number.isFinite(Date.parse(selectedAt))) {
    return result.frames[result.currentIndex] ?? result.frames.at(-1) ?? null;
  }

  const target = Date.parse(selectedAt);
  let latestBefore: ObservatoryTemporalFrame | null = null;
  let latestBeforeTime = Number.NEGATIVE_INFINITY;
  let earliestAfter: ObservatoryTemporalFrame | null = null;
  let earliestAfterTime = Number.POSITIVE_INFINITY;

  for (const frame of result.frames) {
    if (!frame.observedAt) continue;
    const frameTime = Date.parse(frame.observedAt);
    if (!Number.isFinite(frameTime)) continue;

    if (frameTime <= target && frameTime > latestBeforeTime) {
      latestBefore = frame;
      latestBeforeTime = frameTime;
    }
    if (frameTime > target && frameTime < earliestAfterTime) {
      earliestAfter = frame;
      earliestAfterTime = frameTime;
    }
  }

  return latestBefore ?? earliestAfter ?? result.frames[result.currentIndex] ?? result.frames.at(-1) ?? null;
}
