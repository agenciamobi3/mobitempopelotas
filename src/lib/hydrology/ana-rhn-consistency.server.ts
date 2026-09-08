import { z } from "zod";

const ANA_RHN_ORIGIN = "https://portal1.snirh.gov.br";
const CONSISTENCY_LAYER_PATH = "/server/rest/services/NotasConsistencia/MapServer/0/query";
const CONSISTENCY_LAYER_URL = `${ANA_RHN_ORIGIN}/server/rest/services/NotasConsistencia/MapServer/0`;
const HISTORICAL_STATION_CODE = "87955000";
const REQUEST_TIMEOUT_MS = 3_500;
const ALLOWED_HOSTS = new Set(["portal1.snirh.gov.br"]);

const nullableTextSchema = z.string().nullable().optional();
const nullableNumberSchema = z.number().nullable().optional();

const attributesSchema = z
  .object({
    Codigo: z.union([z.number(), z.string()]),
    Notas: nullableNumberSchema,
    Indice: nullableTextSchema,
    Nome: nullableTextSchema,
    Operando: nullableTextSchema,
    AreaDrenag: nullableNumberSchema,
    Bacia: nullableTextSchema,
    SubBacia: nullableTextSchema,
    Rio: nullableTextSchema,
    UF: nullableTextSchema,
    Municipio: nullableTextSchema,
  })
  .passthrough();

const queryResponseSchema = z
  .object({
    features: z.array(z.object({ attributes: attributesSchema }).passthrough()).default([]),
    error: z
      .object({
        code: z.number().optional(),
        message: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type AnaRhnConsistencyClass = "OTIMO" | "BOM" | "RAZOAVEL" | "RUIM" | "PESSIMO";

export type AnaRhnHistoricalConsistencyData = {
  status: "live" | "not-found" | "unavailable";
  stationCode: "87955000";
  stationName: string | null;
  municipality: string | null;
  state: string | null;
  river: string | null;
  basin: string | null;
  subBasin: string | null;
  operating: string | null;
  drainageAreaKm2: number | null;
  score: number | null;
  classification: AnaRhnConsistencyClass | null;
  source: {
    name: "ANA / SNIRH · Notas de Consistência";
    layerUrl: string;
    fetchedAt: string;
  };
  error: string | null;
};

function sourceMetadata(fetchedAt = new Date().toISOString()) {
  return {
    name: "ANA / SNIRH · Notas de Consistência" as const,
    layerUrl: CONSISTENCY_LAYER_URL,
    fetchedAt,
  };
}

function asText(value: string | null | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeClassification(value: string | null | undefined): AnaRhnConsistencyClass | null {
  const normalized = asText(value)
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (
    normalized === "OTIMO" ||
    normalized === "BOM" ||
    normalized === "RAZOAVEL" ||
    normalized === "RUIM" ||
    normalized === "PESSIMO"
  ) {
    return normalized;
  }

  return null;
}

export function createUnavailableAnaRhnHistoricalConsistency(
  error = "A camada de consistência ANA/SNIRH não respondeu nesta atualização.",
): AnaRhnHistoricalConsistencyData {
  return {
    status: "unavailable",
    stationCode: HISTORICAL_STATION_CODE,
    stationName: null,
    municipality: null,
    state: null,
    river: null,
    basin: null,
    subBasin: null,
    operating: null,
    drainageAreaKm2: null,
    score: null,
    classification: null,
    source: sourceMetadata(),
    error,
  };
}

export function createMissingAnaRhnHistoricalConsistency(
  fetchedAt = new Date().toISOString(),
): AnaRhnHistoricalConsistencyData {
  return {
    status: "not-found",
    stationCode: HISTORICAL_STATION_CODE,
    stationName: null,
    municipality: null,
    state: null,
    river: null,
    basin: null,
    subBasin: null,
    operating: null,
    drainageAreaKm2: null,
    score: null,
    classification: null,
    source: sourceMetadata(fetchedAt),
    error: null,
  };
}

export function buildAnaRhnHistoricalConsistencyUrl() {
  const url = new URL(CONSISTENCY_LAYER_PATH, ANA_RHN_ORIGIN);
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Host ANA/SNIRH fora da allowlist.");
  }

  url.searchParams.set("where", `Codigo=${HISTORICAL_STATION_CODE}`);
  url.searchParams.set(
    "outFields",
    "Codigo,Notas,Indice,Nome,Operando,AreaDrenag,Bacia,SubBacia,Rio,UF,Municipio",
  );
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("resultRecordCount", "1");
  url.searchParams.set("f", "json");
  return url;
}

export function parseAnaRhnHistoricalConsistencyPayload(
  payload: unknown,
  fetchedAt = new Date().toISOString(),
): AnaRhnHistoricalConsistencyData {
  const parsed = queryResponseSchema.safeParse(payload);
  if (!parsed.success || parsed.data.error) {
    return createUnavailableAnaRhnHistoricalConsistency(
      parsed.success && parsed.data.error?.code
        ? `A camada de consistência ANA/SNIRH informou erro ${parsed.data.error.code}.`
        : "A camada de consistência ANA/SNIRH respondeu com estrutura incompatível.",
    );
  }

  const feature = parsed.data.features[0];
  if (!feature) return createMissingAnaRhnHistoricalConsistency(fetchedAt);

  const attributes = feature.attributes;
  const returnedCode = String(attributes.Codigo).replace(/\.0+$/, "").trim();
  if (returnedCode !== HISTORICAL_STATION_CODE) {
    return createMissingAnaRhnHistoricalConsistency(fetchedAt);
  }

  return {
    status: "live",
    stationCode: HISTORICAL_STATION_CODE,
    stationName: asText(attributes.Nome),
    municipality: asText(attributes.Municipio),
    state: asText(attributes.UF),
    river: asText(attributes.Rio),
    basin: asText(attributes.Bacia),
    subBasin: asText(attributes.SubBacia),
    operating: asText(attributes.Operando),
    drainageAreaKm2: attributes.AreaDrenag ?? null,
    score: attributes.Notas ?? null,
    classification: normalizeClassification(attributes.Indice),
    source: sourceMetadata(fetchedAt),
    error: null,
  };
}

export async function fetchAnaRhnHistoricalConsistency(): Promise<AnaRhnHistoricalConsistencyData> {
  try {
    const response = await fetch(buildAnaRhnHistoricalConsistencyUrl(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "TempoPelotas/2.0 (+https://tempopelotas.com.br)",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return createUnavailableAnaRhnHistoricalConsistency(
        `A consulta da camada de consistência ANA/SNIRH recebeu HTTP ${response.status}.`,
      );
    }

    return parseAnaRhnHistoricalConsistencyPayload(
      (await response.json()) as unknown,
      new Date().toISOString(),
    );
  } catch (error) {
    return createUnavailableAnaRhnHistoricalConsistency(
      error instanceof Error
        ? `Falha da consulta à consistência ANA/SNIRH: ${error.message}`
        : "Falha desconhecida da consulta à consistência ANA/SNIRH.",
    );
  }
}
