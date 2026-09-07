import {
  createLaranjalLevelDataFromSeries,
  type LaranjalLevelData,
  type LaranjalLevelPoint,
  type LaranjalLevelSource,
} from "./laranjal-level.server";

export const CIEX_FURG_LAGOON_SOURCE_URL = "https://monitoramentolagoadospatos.com.br/";
export const CIEX_FURG_LAGOON_API_URL = "https://api-medidas-porto-7bni.onrender.com";
export const CIEX_FURG_PELOTAS_SENSOR_ID = "sensor_7";

const DEFAULT_DEADLINE_MS = 1_800;
const STALE_AFTER_MINUTES = 120;

type LatestPayload = {
  dado?: {
    data_hora?: unknown;
    valor?: unknown;
    sensor_id?: unknown;
  };
};

type GraphPoint = {
  data?: unknown;
  valor?: unknown;
};

export type FetchCiexFurgPelotasOptions = {
  deadlineMs?: number;
};

function round(value: number, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function parseLevelCm(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > -500 && parsed < 5_000 ? parsed : null;
}

/**
 * A API da rede publica o relógio local com sufixo Z. Preservamos a mesma
 * interpretação do adapter regional: o wall-clock recebido é de Pelotas/RS
 * e precisa ser ancorado em -03:00 antes de virar ISO.
 */
export function parseCiexFurgSourceTimestamp(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  const trimmed = value.trim();
  const localWallClock = trimmed.match(/^(20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?)Z$/);
  const parsed = new Date(localWallClock ? `${localWallClock[1]}-03:00` : trimmed);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pointFromSource(timestamp: unknown, value: unknown): LaranjalLevelPoint | null {
  const date = parseCiexFurgSourceTimestamp(timestamp);
  const levelCm = parseLevelCm(value);
  if (!date || levelCm === null) return null;

  return {
    timestamp: date.toISOString(),
    level: round(levelCm / 100, 3),
  };
}

function parseLatest(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  const data = (payload as LatestPayload).dado;
  if (!data || typeof data !== "object") return null;
  if (
    typeof data.sensor_id === "string" &&
    data.sensor_id !== CIEX_FURG_PELOTAS_SENSOR_ID
  ) {
    return null;
  }

  return pointFromSource(data.data_hora, data.valor);
}

function parseGraph(payload: unknown) {
  if (!Array.isArray(payload)) return [];

  const points = new Map<number, LaranjalLevelPoint>();

  for (const rawPoint of payload) {
    if (!rawPoint || typeof rawPoint !== "object" || Array.isArray(rawPoint)) continue;

    const point = rawPoint as GraphPoint;
    const parsed = pointFromSource(point.data, point.valor);
    if (!parsed) continue;

    const epoch = Date.parse(parsed.timestamp);
    if (Number.isFinite(epoch)) points.set(epoch, parsed);
  }

  return [...points.entries()]
    .sort(([first], [second]) => first - second)
    .map(([, point]) => point);
}

function sourceMetadata(fetchedAt: Date): LaranjalLevelSource {
  return {
    key: "ciex-furg",
    role: "contingency",
    name: "CIEX/FURG · Rede da Lagoa dos Patos",
    station: "Pelotas (sensor 7)",
    location: "Pelotas / RS",
    reference: "Referencial vertical brasileiro — Marégrafo de Imbituba/SC",
    url: CIEX_FURG_LAGOON_SOURCE_URL,
    fetchedAt: fetchedAt.toISOString(),
  };
}

function unavailableData(error: string, fetchedAt = new Date()): LaranjalLevelData {
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
    source: sourceMetadata(fetchedAt),
    error,
  };
}

export function normalizeCiexFurgPelotasLevel(
  latestPayload: unknown,
  graphPayload: unknown,
  fetchedAt = new Date(),
): LaranjalLevelData {
  const latest = parseLatest(latestPayload);
  const graph = parseGraph(graphPayload);
  const points = new Map<number, LaranjalLevelPoint>();

  for (const point of graph) points.set(Date.parse(point.timestamp), point);
  if (latest) points.set(Date.parse(latest.timestamp), latest);

  const series = [...points.entries()]
    .filter(([epoch]) => Number.isFinite(epoch))
    .sort(([first], [second]) => first - second)
    .map(([, point]) => point);

  if (series.length === 0) {
    return unavailableData("A rede CIEX/FURG não devolveu uma leitura válida para Pelotas.", fetchedAt);
  }

  const data = createLaranjalLevelDataFromSeries(series, fetchedAt, {
    source: sourceMetadata(fetchedAt),
    staleAfterMinutes: STALE_AFTER_MINUTES,
    levelPrecisionDigits: 3,
  });

  if (data.status === "stale") {
    return {
      ...data,
      error: "A leitura do sensor Pelotas está atrasada na fonte CIEX/FURG.",
    };
  }

  return data;
}

async function fetchApiJson(path: string, signal: AbortSignal) {
  const response = await fetch(`${CIEX_FURG_LAGOON_API_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MOBI-Tempo-Pelotas/2.0 (+https://tempopelotas.com.br)",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`A rede CIEX/FURG respondeu HTTP ${response.status}.`);
  }

  return response.json() as Promise<unknown>;
}

export async function fetchCiexFurgPelotasLevelData(
  options: FetchCiexFurgPelotasOptions = {},
): Promise<LaranjalLevelData> {
  const fetchedAt = new Date();
  const signal = AbortSignal.timeout(options.deadlineMs ?? DEFAULT_DEADLINE_MS);
  const [latestResult, graphResult] = await Promise.allSettled([
    fetchApiJson(`/dados/${CIEX_FURG_PELOTAS_SENSOR_ID}`, signal),
    fetchApiJson(`/dados/${CIEX_FURG_PELOTAS_SENSOR_ID}/grafico`, signal),
  ]);

  if (latestResult.status === "rejected" && graphResult.status === "rejected") {
    console.warn("[hydrology/ciex-furg-pelotas] Fonte de contingência indisponível", {
      latest: String(latestResult.reason),
      graph: String(graphResult.reason),
    });
    return unavailableData(
      "A contingência CIEX/FURG para Pelotas está temporariamente indisponível.",
      fetchedAt,
    );
  }

  const data = normalizeCiexFurgPelotasLevel(
    latestResult.status === "fulfilled" ? latestResult.value : null,
    graphResult.status === "fulfilled" ? graphResult.value : null,
    fetchedAt,
  );

  if (data.status !== "unavailable" && graphResult.status === "rejected") {
    return {
      ...data,
      error: "A leitura atual da contingência está disponível, mas a série recente não respondeu.",
    };
  }

  return data;
}

export const CIEX_FURG_PELOTAS_CONFIG = {
  apiUrl: CIEX_FURG_LAGOON_API_URL,
  sourceUrl: CIEX_FURG_LAGOON_SOURCE_URL,
  sensorId: CIEX_FURG_PELOTAS_SENSOR_ID,
  reference: "Referencial vertical brasileiro — Marégrafo de Imbituba/SC",
  inputUnit: "cm",
  publicUnit: "m",
  staleAfterMinutes: STALE_AFTER_MINUTES,
} as const;
