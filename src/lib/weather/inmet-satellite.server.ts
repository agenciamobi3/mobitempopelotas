import type {
  RedemetImageFrame,
  RedemetImageLayerResponse,
} from "@/lib/redemet/redemet.types";

const API_ROOT = "https://apisat.inmet.gov.br/";
const OFFICIAL_URL = "https://satelite.inmet.gov.br/";
const SATELLITE = "GOES";
const AREA = "S";
const PRODUCT = "IV";
const REQUEST_TIMEOUT_MS = 6_000;
const IMAGE_PROXY_PATH = "/api/redemet/image";
const SOUTH_BOUNDS = { west: -58.8, south: -35.2, east: -47.0, north: -22.0 };

type JsonRecord = Record<string, unknown>;

type DateToken = {
  raw: string;
  iso: string;
};

type HourToken = {
  raw: string;
  hour: number;
  minute: number;
};

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function collectScalarStrings(value: unknown): string[] {
  if (typeof value === "string" || typeof value === "number") return [String(value).trim()];
  if (Array.isArray(value)) return value.flatMap(collectScalarStrings);
  const record = asRecord(value);
  return record ? Object.values(record).flatMap(collectScalarStrings) : [];
}

function normalizeDateToken(value: string): DateToken | null {
  const compact = value.match(/\b(20\d{2})(\d{2})(\d{2})\b/);
  if (compact) return { raw: compact[0], iso: `${compact[1]}-${compact[2]}-${compact[3]}` };

  const separated = value.match(/\b(20\d{2})[-/](\d{2})[-/](\d{2})\b/);
  if (separated) {
    return { raw: separated[0], iso: `${separated[1]}-${separated[2]}-${separated[3]}` };
  }

  const brazilian = value.match(/\b(\d{2})\/(\d{2})\/(20\d{2})\b/);
  if (brazilian) {
    return { raw: brazilian[0], iso: `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}` };
  }
  return null;
}

function normalizeHourToken(value: string): HourToken | null {
  const datetime = value.match(/[T\s_-](\d{2}):?(\d{2})(?::?\d{2})?(?:Z|$)/i);
  const compact = value.match(/^([01]\d|2[0-3]):?([0-5]\d)(?:[0-5]\d)?$/);
  const match = datetime ?? compact;
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) return null;
  return { raw: compact ? value : `${match[1]}${match[2]}`, hour, minute };
}

function frameLabel(hour: HourToken) {
  return `${String(hour.hour).padStart(2, "0")}:${String(hour.minute).padStart(2, "0")} UTC`;
}

function observedAt(date: DateToken, hour: HourToken) {
  return `${date.iso}T${String(hour.hour).padStart(2, "0")}:${String(hour.minute).padStart(2, "0")}:00Z`;
}

function imageProxyUrl(date: string, hour: string) {
  const params = new URLSearchParams({ provider: "inmet", date, hour });
  return `${IMAGE_PROXY_PATH}?${params.toString()}`;
}

function browserHeaders(includeOrigin = true) {
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
    ...(includeOrigin ? { Origin: "https://satelite.inmet.gov.br" } : {}),
    Referer: OFFICIAL_URL,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
  };
}

async function requestJson(url: URL, includeOrigin: boolean) {
  return fetch(url, {
    headers: browserHeaders(includeOrigin),
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

async function fetchJson(path: string) {
  const url = new URL(path.replace(/^\//, ""), API_ROOT);
  let response = await requestJson(url, true);

  // Alguns gateways públicos variam a política de CORS/WAF para chamadas server-side.
  // Em 403 tentamos uma vez sem Origin, preservando Referer e perfil de navegador.
  if (response.status === 403) {
    response = await requestJson(url, false);
  }

  if (!response.ok) {
    const suffix =
      response.status === 403
        ? " O endpoint recusou a integração server-side; isso não confirma indisponibilidade do portal público do INMET."
        : "";
    throw new Error(`A integração de satélite do INMET recebeu HTTP ${response.status}.${suffix}`);
  }

  return (await response.json()) as unknown;
}

function unavailable(error: string): RedemetImageLayerResponse {
  return {
    configured: true,
    available: false,
    provider: "INMET",
    product: "GOES — infravermelho",
    sourceLabel: "GOES / Região Sul / canal infravermelho",
    officialUrl: OFFICIAL_URL,
    frames: [],
    currentIndex: 0,
    updatedAt: new Date().toISOString(),
    error,
  };
}

export async function fetchInmetSatellite(frameCount = 10): Promise<RedemetImageLayerResponse> {
  const requested = Math.max(1, Math.min(12, Math.round(frameCount)));

  try {
    const datesPayload = await fetchJson(`datas/${SATELLITE}/${AREA}/${PRODUCT}`);
    const dates = collectScalarStrings(datesPayload)
      .flatMap((value) => {
        const parsed = normalizeDateToken(value);
        return parsed ? [parsed] : [];
      })
      .filter((date, index, all) => all.findIndex((item) => item.raw === date.raw) === index)
      .sort((first, second) => first.iso.localeCompare(second.iso));
    const latestDate = dates.at(-1);
    if (!latestDate) {
      throw new Error("A integração recebeu resposta do INMET, mas não reconheceu datas de satélite GOES.");
    }

    const hoursPayload = await fetchJson(
      `horas/${SATELLITE}/${AREA}/${PRODUCT}/${encodeURIComponent(latestDate.raw)}`,
    );
    const hours = collectScalarStrings(hoursPayload)
      .flatMap((value) => {
        const parsed = normalizeHourToken(value);
        return parsed ? [parsed] : [];
      })
      .filter((hour, index, all) => all.findIndex((item) => item.raw === hour.raw) === index)
      .sort((first, second) => first.hour * 60 + first.minute - (second.hour * 60 + second.minute))
      .slice(-requested);
    if (!hours.length) {
      throw new Error("A integração recebeu resposta do INMET, mas não reconheceu horários de satélite GOES.");
    }

    const frames = hours.map<RedemetImageFrame>((hour, index) => ({
      id: `${latestDate.raw}-${hour.raw}-${index}`,
      label: frameLabel(hour),
      observedAt: observedAt(latestDate, hour),
      imageUrl: imageProxyUrl(latestDate.raw, hour.raw),
      bounds: SOUTH_BOUNDS,
    }));

    return {
      configured: true,
      available: true,
      provider: "INMET",
      product: "GOES — infravermelho",
      sourceLabel: "GOES / Região Sul / canal infravermelho",
      officialUrl: OFFICIAL_URL,
      frames,
      currentIndex: frames.length - 1,
      updatedAt: frames.at(-1)?.observedAt ?? new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    return unavailable(
      error instanceof Error
        ? error.message
        : "Falha desconhecida na integração de satélite do INMET.",
    );
  }
}

export function buildInmetSatelliteFrameUrl(date: string, hour: string) {
  return new URL(
    `${SATELLITE}/${AREA}/${PRODUCT}/${encodeURIComponent(date)}/${encodeURIComponent(hour)}`,
    API_ROOT,
  ).toString();
}

export function isValidInmetSatelliteToken(value: string) {
  return /^[0-9T:_/-]{4,32}$/.test(value) && !value.includes("..");
}
