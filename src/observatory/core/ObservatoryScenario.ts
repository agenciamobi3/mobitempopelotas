import {
  OBSERVATORY_LAYER_IDS,
  isObservatoryLayerId,
  type ObservatoryLayerId,
} from "./ObservatoryLayerCatalog";

export const OBSERVATORY_SCENARIO_VERSION = 1 as const;
const MAX_SCENARIO_LENGTH = 4096;

export type ObservatoryCameraState = {
  longitude: number;
  latitude: number;
  height: number;
  heading: number;
  pitch: number;
  roll: number;
};

export type ObservatoryScenarioLayerState = {
  id: ObservatoryLayerId;
  enabled: boolean;
  opacity: number;
};

export type ObservatoryScenarioState = {
  version: typeof OBSERVATORY_SCENARIO_VERSION;
  selectedAt: string | null;
  layers: ObservatoryScenarioLayerState[];
  camera: ObservatoryCameraState | null;
};

type CompactScenario = {
  v: 1;
  t?: string;
  l: Array<[ObservatoryLayerId, 0 | 1, number]>;
  c?: [number, number, number, number, number, number];
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function normalizeTimestamp(value: unknown) {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString();
}

function normalizeOpacity(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  return round(clamp(value, 0, 1), 2);
}

export function normalizeObservatoryCameraState(value: unknown): ObservatoryCameraState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ObservatoryCameraState>;
  const values = [
    candidate.longitude,
    candidate.latitude,
    candidate.height,
    candidate.heading,
    candidate.pitch,
    candidate.roll,
  ];
  if (!values.every((item) => typeof item === "number" && Number.isFinite(item))) return null;

  return {
    longitude: round(clamp(candidate.longitude as number, -180, 180), 6),
    latitude: round(clamp(candidate.latitude as number, -90, 90), 6),
    height: Math.round(clamp(candidate.height as number, 5_000, 10_000_000)),
    heading: round(clamp(candidate.heading as number, -360, 360), 3),
    pitch: round(clamp(candidate.pitch as number, -90, 90), 3),
    roll: round(clamp(candidate.roll as number, -180, 180), 3),
  };
}

export function createObservatoryScenario(input: {
  selectedAt: string | null;
  layers: readonly ObservatoryScenarioLayerState[];
  camera?: ObservatoryCameraState | null;
}): ObservatoryScenarioState {
  const byId = new Map<ObservatoryLayerId, ObservatoryScenarioLayerState>();
  for (const layer of input.layers) {
    if (!isObservatoryLayerId(layer.id)) continue;
    byId.set(layer.id, {
      id: layer.id,
      enabled: Boolean(layer.enabled),
      opacity: normalizeOpacity(layer.opacity),
    });
  }

  return {
    version: OBSERVATORY_SCENARIO_VERSION,
    selectedAt: normalizeTimestamp(input.selectedAt),
    layers: OBSERVATORY_LAYER_IDS.map(
      (id) => byId.get(id) ?? { id, enabled: false, opacity: 1 },
    ),
    camera: normalizeObservatoryCameraState(input.camera ?? null),
  };
}

export function encodeObservatoryScenario(scenario: ObservatoryScenarioState) {
  const normalized = createObservatoryScenario(scenario);
  const compact: CompactScenario = {
    v: OBSERVATORY_SCENARIO_VERSION,
    l: normalized.layers.map((layer) => [layer.id, layer.enabled ? 1 : 0, layer.opacity]),
  };

  if (normalized.selectedAt) compact.t = normalized.selectedAt;
  if (normalized.camera) {
    const camera = normalized.camera;
    compact.c = [
      camera.longitude,
      camera.latitude,
      camera.height,
      camera.heading,
      camera.pitch,
      camera.roll,
    ];
  }

  return encodeURIComponent(JSON.stringify(compact));
}

export function decodeObservatoryScenario(value: string | null | undefined): ObservatoryScenarioState | null {
  if (!value || value.length > MAX_SCENARIO_LENGTH) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<CompactScenario>;
    if (parsed.v !== OBSERVATORY_SCENARIO_VERSION || !Array.isArray(parsed.l)) return null;

    const layers: ObservatoryScenarioLayerState[] = [];
    for (const item of parsed.l) {
      if (!Array.isArray(item) || item.length < 3) continue;
      const [id, enabled, opacity] = item;
      if (typeof id !== "string" || !isObservatoryLayerId(id)) continue;
      layers.push({
        id,
        enabled: enabled === 1,
        opacity: normalizeOpacity(opacity),
      });
    }

    let camera: ObservatoryCameraState | null = null;
    if (Array.isArray(parsed.c) && parsed.c.length === 6) {
      const [longitude, latitude, height, heading, pitch, roll] = parsed.c;
      camera = normalizeObservatoryCameraState({ longitude, latitude, height, heading, pitch, roll });
    }

    return createObservatoryScenario({
      selectedAt: normalizeTimestamp(parsed.t),
      layers,
      camera,
    });
  } catch {
    return null;
  }
}

export function readObservatoryScenarioHash(hash: string) {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(normalized);
  return decodeObservatoryScenario(params.get("scenario"));
}

export function buildObservatoryScenarioHash(scenario: ObservatoryScenarioState) {
  return `#scenario=${encodeObservatoryScenario(scenario)}`;
}
