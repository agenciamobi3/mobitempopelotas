import { fetchInmetSatellite } from "../weather/inmet-satellite.server";
import type {
  RedemetBounds,
  RedemetImageFrame,
  RedemetImageLayerResponse,
  RedemetSatelliteType,
} from "./redemet.types";

const DEFAULT_BASE_URL = "https://api-redemet.decea.mil.br/";
const OFFICIAL_URL = "https://redemet.decea.mil.br/";
const IMAGE_PROXY_PATH = "/api/redemet/image";
const PRIMARY_DEADLINE_MS = 3_600;
const FALLBACK_DEADLINE_MS = 3_600;
const REQUEST_BUDGET_MS = 4_400;
const TIMEZONE = "America/Sao_Paulo";

const ALLOWED_API_HOSTS = new Set(["api-redemet.decea.mil.br", "api-redemet.decea.gov.br"]);
const ALLOWED_IMAGE_HOSTS = new Set([
  "api-redemet.decea.mil.br",
  "api-redemet.decea.gov.br",
  "estatico-redemet.decea.mil.br",
  "estatico-redemet.decea.gov.br",
  "redemet.decea.mil.br",
  "redemet.decea.gov.br",
]);

const IMAGE_PATH_KEYS = ["path", "url", "imagem", "image", "arquivo", "src"] as const;

type JsonRecord = Record<string, unknown>;
type RuntimeWithProcess = typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

type RawFrame = {
  path: string;
  data: string | null;
};

type ParsedSatellitePayload = {
  frames: RedemetImageFrame[];
  bounds: RedemetBounds | null;
  acceptedImageCount: number;
  diagnostic: string;
};

type SatelliteRequestResult =
  | { ok: true; payload: unknown }
  | { ok: false; error: string };

function readServerEnvironment(name: string) {
  return (globalThis as RuntimeWithProcess).process?.env?.[name]?.trim() || null;
}

function apiKey() {
  return readServerEnvironment("REDEMET_API_KEY");
}

function apiBaseUrl() {
  const configured = readServerEnvironment("REDEMET_API_BASE_URL") || DEFAULT_BASE_URL;

  try {
    const url = new URL(configured.endsWith("/") ? configured : `${configured}/`);
    if (url.protocol !== "https:" || !ALLOWED_API_HOSTS.has(url.hostname.toLowerCase())) {
      return new URL(DEFAULT_BASE_URL);
    }
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return new URL(DEFAULT_BASE_URL);
  }
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown) {
  const normalized = typeof value === "string" ? value.trim().replace(",", ".") : value;
  const number = typeof normalized === "number" ? normalized : Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function requestedProductLabel(type: RedemetSatelliteType) {
  if (type === "realcada") return "Satélite infravermelho realçado";
  if (type === "ir") return "Satélite infravermelho";
  return "Satélite visível";
}

function normalizeOfficialImageUrl(value: string) {
  try {
    const url = new URL(value, apiBaseUrl());
    if (url.protocol !== "https:") return null;
    if (!ALLOWED_IMAGE_HOSTS.has(url.hostname.toLowerCase())) return null;
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return null;
  }
}

function readBounds(record: JsonRecord | null): RedemetBounds | null {
  if (!record) return null;
  const west = asNumber(record.lon_min ?? record.longitude_min ?? record.west ?? record.xmin);
  const east = asNumber(record.lon_max ?? record.longitude_max ?? record.east ?? record.xmax);
  const south = asNumber(record.lat_min ?? record.latitude_min ?? record.south ?? record.ymin);
  const north = asNumber(record.lat_max ?? record.latitude_max ?? record.north ?? record.ymax);
  if (west === null || east === null || south === null || north === null) return null;
  if (west >= east || south >= north) return null;
  if (west < -180 || east > 180 || south < -90 || north > 90) return null;
  return { west, south, east, north };
}

function findBounds(value: unknown): RedemetBounds | null {
  const record = asRecord(value);
  if (record) {
    const direct = readBounds(record);
    if (direct) return direct;
    for (const nested of Object.values(record)) {
      const found = findBounds(nested);
      if (found) return found;
    }
  } else if (Array.isArray(value)) {
    for (const nested of value) {
      const found = findBounds(nested);
      if (found) return found;
    }
  }
  return null;
}

function rawImagePath(record: JsonRecord) {
  for (const key of IMAGE_PATH_KEYS) {
    const value = asString(record[key]);
    if (value) return value;
  }
  return null;
}

function collectFrames(value: unknown, output: RawFrame[] = []) {
  const record = asRecord(value);
  if (record) {
    const rawPath = rawImagePath(record);
    const path = rawPath ? normalizeOfficialImageUrl(rawPath) : null;
    if (path) {
      output.push({
        path,
        data: asString(
          record.data ?? record.date ?? record.datetime ?? record.horario ?? record.timestamp,
        ),
      });
    }
    for (const nested of Object.values(record)) collectFrames(nested, output);
  } else if (Array.isArray(value)) {
    for (const nested of value) collectFrames(nested, output);
  }
  return output;
}

function collectCandidateImageHosts(value: unknown, output = new Set<string>()) {
  const record = asRecord(value);
  if (record) {
    const rawPath = rawImagePath(record);
    if (rawPath) {
      try {
        const url = new URL(rawPath, apiBaseUrl());
        if (url.protocol === "https:") output.add(url.hostname.toLowerCase());
      } catch {
        output.add("url-invalida");
      }
    }
    for (const nested of Object.values(record)) collectCandidateImageHosts(nested, output);
  } else if (Array.isArray(value)) {
    for (const nested of value) collectCandidateImageHosts(nested, output);
  }
  return output;
}

function structuralKeys(value: unknown) {
  const record = asRecord(value);
  if (!record) return Array.isArray(value) ? [`array(${value.length})`] : [typeof value];
  return Object.keys(record).sort().slice(0, 12);
}

function sanitizedPayloadDiagnostic(
  payload: unknown,
  bounds: RedemetBounds | null,
  acceptedImageCount: number,
) {
  const root = asRecord(payload);
  const data = root ? root.data : null;
  const hosts = [...collectCandidateImageHosts(payload)].sort().slice(0, 6);
  const hostLabel = hosts.length > 0 ? hosts.join(",") : "nenhum";
  const rootKeys = structuralKeys(payload).join(",");
  const dataKeys = structuralKeys(data).join(",");

  return `bounds=${bounds ? "sim" : "não"}; imagensAceitas=${acceptedImageCount}; hostsCandidatos=${hostLabel}; chavesRaiz=${rootKeys}; chavesData=${dataKeys}`;
}

function parseDate(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const withZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized) ? normalized : `${normalized}Z`;
  const parsed = new Date(withZone);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatFrameLabel(value: string | null, fallbackIndex: number) {
  const date = parseDate(value);
  if (!date) return value?.slice(-16) || `Quadro ${fallbackIndex + 1}`;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function previousRedemetUtcHourToken(reference = new Date()) {
  const previous = new Date(reference.getTime() - 60 * 60 * 1_000);
  return [
    previous.getUTCFullYear(),
    String(previous.getUTCMonth() + 1).padStart(2, "0"),
    String(previous.getUTCDate()).padStart(2, "0"),
    String(previous.getUTCHours()).padStart(2, "0"),
  ].join("");
}

function parseSatellitePayload(payload: unknown, requested: number): ParsedSatellitePayload {
  const bounds = findBounds(payload);
  const unique = new Map<string, RawFrame>();
  for (const frame of collectFrames(payload)) unique.set(frame.path, frame);

  const frames = [...unique.values()]
    .sort((first, second) => {
      const firstTime = parseDate(first.data)?.getTime() ?? 0;
      const secondTime = parseDate(second.data)?.getTime() ?? 0;
      return firstTime - secondTime;
    })
    .slice(-requested)
    .flatMap<RedemetImageFrame>((frame, index) => {
      if (!bounds) return [];
      return [
        {
          id: `${index}-${frame.data ?? frame.path}`,
          label: formatFrameLabel(frame.data, index),
          observedAt: parseDate(frame.data)?.toISOString() ?? null,
          imageUrl: `${IMAGE_PROXY_PATH}?src=${encodeURIComponent(frame.path)}`,
          bounds,
        },
      ];
    });

  return {
    frames,
    bounds,
    acceptedImageCount: unique.size,
    diagnostic: sanitizedPayloadDiagnostic(payload, bounds, unique.size),
  };
}

function emptyRedemet(type: RedemetSatelliteType, error: string): RedemetImageLayerResponse {
  return {
    configured: Boolean(apiKey()),
    available: false,
    provider: "REDEMET / DECEA",
    product: requestedProductLabel(type),
    sourceLabel: "Satélite meteorológico REDEMET",
    officialUrl: OFFICIAL_URL,
    frames: [],
    currentIndex: 0,
    updatedAt: new Date().toISOString(),
    error,
  };
}

async function requestSatellitePayload(
  type: RedemetSatelliteType,
  requested: number,
  key: string,
  signal: AbortSignal,
  referenceData?: string,
): Promise<SatelliteRequestResult> {
  const url = new URL(`produtos/satelite/${type}`, apiBaseUrl());
  url.searchParams.set("anima", String(requested));
  if (referenceData) url.searchParams.set("data", referenceData);
  // A documentação oficial da API-REDEMET e o portal usam api_key em query string.
  // A URL é exclusivamente server-side e nunca é registrada ou devolvida ao cliente.
  url.searchParams.set("api_key", key);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "TempoPelotas/2.0 (+https://tempopelotas.com.br)",
    },
    signal,
  });

  if (!response.ok) {
    return {
      ok: false,
      error: `A integração REDEMET recebeu HTTP ${response.status} ao consultar satélite.`,
    };
  }

  const payload = (await response.json()) as unknown;
  const root = asRecord(payload);
  if (root?.status === false) {
    return {
      ok: false,
      error:
        asString(root.message) || "A API REDEMET informou que a consulta de satélite não foi atendida.",
    };
  }

  return { ok: true, payload };
}

function availableRedemetLayer(
  type: RedemetSatelliteType,
  parsed: ParsedSatellitePayload,
  recoveredFromPreviousHour: boolean,
): RedemetImageLayerResponse {
  return {
    configured: true,
    available: true,
    provider: "REDEMET / DECEA",
    product: requestedProductLabel(type),
    sourceLabel: recoveredFromPreviousHour
      ? "Satélite meteorológico REDEMET · última referência UTC disponível"
      : "Satélite meteorológico REDEMET",
    officialUrl: OFFICIAL_URL,
    frames: parsed.frames,
    currentIndex: parsed.frames.length - 1,
    updatedAt: parsed.frames.at(-1)?.observedAt ?? new Date().toISOString(),
    error: null,
  };
}

export async function fetchOfficialRedemetSatellite(
  type: RedemetSatelliteType,
  frameCount = 8,
): Promise<RedemetImageLayerResponse> {
  const key = apiKey();
  if (!key) {
    return emptyRedemet(type, "Integração REDEMET aguardando configuração da chave.");
  }

  const requested = Math.max(1, Math.min(15, Math.round(frameCount)));
  const signal = AbortSignal.timeout(REQUEST_BUDGET_MS);

  try {
    const current = await requestSatellitePayload(type, requested, key, signal);
    if (!current.ok) return emptyRedemet(type, current.error);

    const currentParsed = parseSatellitePayload(current.payload, requested);
    if (currentParsed.frames.length > 0) {
      return availableRedemetLayer(type, currentParsed, false);
    }

    if (signal.aborted) {
      return emptyRedemet(
        type,
        `A integração do satélite REDEMET excedeu o orçamento compartilhado de ${(
          REQUEST_BUDGET_MS / 1_000
        ).toFixed(1)} s após uma resposta sem imagem utilizável. Diagnóstico sanitizado: ${currentParsed.diagnostic}.`,
      );
    }

    // A API oficial documenta `data=YYYYMMDDHH` e usa essa referência como quadro
    // final quando `anima` é solicitado. A consulta sem `data` pode responder com
    // `data: []` na virada/atualização do produto; tentamos apenas a hora UTC
    // anterior, uma única vez, preservando os timestamps reais retornados.
    const referenceData = previousRedemetUtcHourToken();
    const previousHour = await requestSatellitePayload(
      type,
      requested,
      key,
      signal,
      referenceData,
    );

    if (!previousHour.ok) {
      return emptyRedemet(
        type,
        `A consulta atual da REDEMET veio sem imagem utilizável e a única contingência pela hora UTC anterior falhou. ${previousHour.error} Diagnóstico atual: ${currentParsed.diagnostic}.`,
      );
    }

    const previousParsed = parseSatellitePayload(previousHour.payload, requested);
    if (previousParsed.frames.length > 0) {
      return availableRedemetLayer(type, previousParsed, true);
    }

    return emptyRedemet(
      type,
      `A REDEMET respondeu sem imagem utilizável tanto para a referência atual quanto para a hora UTC anterior. Diagnóstico atual: ${currentParsed.diagnostic}. Diagnóstico anterior: ${previousParsed.diagnostic}.`,
    );
  } catch (error) {
    const timedOut = signal.aborted || (error instanceof Error && error.name === "TimeoutError");
    return emptyRedemet(
      type,
      timedOut
        ? `A integração do satélite REDEMET excedeu o orçamento compartilhado de ${(
            REQUEST_BUDGET_MS / 1_000
          ).toFixed(1)} s.`
        : error instanceof Error
          ? `Falha da integração REDEMET: ${error.message}`
          : "Falha desconhecida da integração REDEMET de satélite.",
    );
  }
}

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
      sourceLabel: `${inmet.sourceLabel} · contingência para ${requestedProductLabel(type).toLowerCase()} REDEMET`,
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
        : "As integrações oficiais de satélite consultadas não retornaram imagem utilizável.",
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
    fetchOfficialRedemetSatellite(type, frameCount),
    PRIMARY_DEADLINE_MS,
    () =>
      timedUnavailable(
        "REDEMET / DECEA",
        requestedProductLabel(type),
        "Satélite REDEMET",
        "A integração do satélite REDEMET excedeu o orçamento de carregamento.",
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
        "A integração de satélite do INMET excedeu o orçamento de carregamento.",
      ),
  );

  return selectOfficialSatelliteResult(type, redemet, inmet);
}
