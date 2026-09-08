import { z } from "zod";

const ANA_RHN_ORIGIN = "https://portal1.snirh.gov.br";
const INVENTORY_LAYER_PATH =
  "/server/rest/services/Estações_Hidrometeorológicas_SNIRH/FeatureServer/0/query";
const INVENTORY_LAYER_URL = `${ANA_RHN_ORIGIN}/server/rest/services/Estações_Hidrometeorológicas_SNIRH/FeatureServer/0`;
const HIDROWEB_URL = "https://www.snirh.gov.br/hidroweb/";
const STATION_CODE = "87955001";
const REQUEST_TIMEOUT_MS = 3_500;
const ALLOWED_HOSTS = new Set(["portal1.snirh.gov.br"]);

const nullableTextSchema = z.string().nullable().optional();
const nullableNumberSchema = z.number().nullable().optional();
const nullableDateSchema = z.union([z.string(), z.number()]).nullable().optional();

const attributesSchema = z
  .object({
    Codigo: z.union([z.string(), z.number()]),
    CodigoAdicional: nullableTextSchema,
    Nome: nullableTextSchema,
    TipoEstacao: nullableTextSchema,
    Operando: nullableTextSchema,
    Latitude: nullableNumberSchema,
    Longitude: nullableNumberSchema,
    Altitude: nullableNumberSchema,
    AreaDrenagem: nullableNumberSchema,
    Bacia: nullableTextSchema,
    SubBacia: nullableTextSchema,
    Rio: nullableTextSchema,
    UF: nullableTextSchema,
    Municipio: nullableTextSchema,
    Responsavel: nullableTextSchema,
    ResponsavelSigla: nullableTextSchema,
    Operadora: nullableTextSchema,
    OperadoraSigla: nullableTextSchema,
    EscalaNivel: nullableTextSchema,
    EscalaNivelInicio: nullableDateSchema,
    EscalaNivelFim: nullableDateSchema,
    RegistradorNivel: nullableTextSchema,
    RegistradorNivelInicio: nullableDateSchema,
    RegistradorNivelFim: nullableDateSchema,
    EstacaoTelemetrica: nullableTextSchema,
    EstacaoTelemetricaInicio: nullableDateSchema,
    EstacaoTelemetricaFim: nullableDateSchema,
    Descricao: nullableTextSchema,
    DataAlteracao: nullableDateSchema,
  })
  .passthrough();

const responseSchema = z
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

export type AnaRhnLaranjalInstrument = {
  label: "Régua de nível" | "Registrador de nível" | "Telemetria";
  startedAt: string | null;
  endedAt: string | null;
};

export type AnaRhnLaranjalStationProfile = {
  status: "live" | "not-found" | "unavailable";
  code: "87955001";
  name: string | null;
  description: string | null;
  stationType: string | null;
  operating: boolean | null;
  municipality: string | null;
  state: string | null;
  river: string | null;
  basin: string | null;
  subBasin: string | null;
  responsible: string | null;
  operator: string | null;
  latitude: number | null;
  longitude: number | null;
  altitudeM: number | null;
  drainageAreaKm2: number | null;
  instruments: AnaRhnLaranjalInstrument[];
  inventoryUpdatedAt: string | null;
  source: {
    name: "ANA / SNIRH / Rede Hidrometeorológica Nacional";
    url: string;
    layerUrl: string;
    fetchedAt: string;
  };
  error: string | null;
};

function asText(value: string | null | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asYesNo(value: string | null | undefined) {
  const normalized = asText(value)?.toLocaleLowerCase("pt-BR");
  if (!normalized) return null;
  if (["sim", "s", "yes", "y", "1"].includes(normalized)) return true;
  if (["não", "nao", "n", "no", "0"].includes(normalized)) return false;
  return null;
}

function parseArcGisDate(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const date =
    typeof value === "number" || /^\d+$/.test(String(value))
      ? new Date(Number(value))
      : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function sourceMetadata(fetchedAt = new Date().toISOString()) {
  return {
    name: "ANA / SNIRH / Rede Hidrometeorológica Nacional" as const,
    url: HIDROWEB_URL,
    layerUrl: INVENTORY_LAYER_URL,
    fetchedAt,
  };
}

export function createUnavailableAnaRhnLaranjalStationProfile(
  error = "O cadastro ANA/SNIRH da estação Laranjal não respondeu nesta atualização.",
): AnaRhnLaranjalStationProfile {
  return {
    status: "unavailable",
    code: STATION_CODE,
    name: null,
    description: null,
    stationType: null,
    operating: null,
    municipality: null,
    state: null,
    river: null,
    basin: null,
    subBasin: null,
    responsible: null,
    operator: null,
    latitude: null,
    longitude: null,
    altitudeM: null,
    drainageAreaKm2: null,
    instruments: [],
    inventoryUpdatedAt: null,
    source: sourceMetadata(),
    error,
  };
}

function createMissingProfile(fetchedAt = new Date().toISOString()): AnaRhnLaranjalStationProfile {
  return {
    ...createUnavailableAnaRhnLaranjalStationProfile(),
    status: "not-found",
    source: sourceMetadata(fetchedAt),
    error: null,
  };
}

export function buildAnaRhnLaranjalStationProfileUrl() {
  const url = new URL(INVENTORY_LAYER_PATH, ANA_RHN_ORIGIN);
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Host ANA/SNIRH fora da allowlist.");
  }

  url.searchParams.set("where", `CodigoAdicional='${STATION_CODE}'`);
  url.searchParams.set(
    "outFields",
    [
      "Codigo",
      "CodigoAdicional",
      "Nome",
      "TipoEstacao",
      "Operando",
      "Latitude",
      "Longitude",
      "Altitude",
      "AreaDrenagem",
      "Bacia",
      "SubBacia",
      "Rio",
      "UF",
      "Municipio",
      "Responsavel",
      "ResponsavelSigla",
      "Operadora",
      "OperadoraSigla",
      "EscalaNivel",
      "EscalaNivelInicio",
      "EscalaNivelFim",
      "RegistradorNivel",
      "RegistradorNivelInicio",
      "RegistradorNivelFim",
      "EstacaoTelemetrica",
      "EstacaoTelemetricaInicio",
      "EstacaoTelemetricaFim",
      "Descricao",
      "DataAlteracao",
    ].join(","),
  );
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("resultRecordCount", "1");
  url.searchParams.set("f", "json");
  return url;
}

export function parseAnaRhnLaranjalStationProfilePayload(
  payload: unknown,
  fetchedAt = new Date().toISOString(),
): AnaRhnLaranjalStationProfile {
  const parsed = responseSchema.safeParse(payload);
  if (!parsed.success || parsed.data.error) {
    return createUnavailableAnaRhnLaranjalStationProfile(
      parsed.success && parsed.data.error?.code
        ? `O cadastro ANA/SNIRH informou erro ${parsed.data.error.code}.`
        : "O cadastro ANA/SNIRH respondeu com estrutura incompatível.",
    );
  }

  const feature = parsed.data.features.find(
    ({ attributes }) => asText(attributes.CodigoAdicional) === STATION_CODE,
  );
  if (!feature) return createMissingProfile(fetchedAt);

  const attributes = feature.attributes;
  const instruments: AnaRhnLaranjalInstrument[] = [];

  if (asYesNo(attributes.EscalaNivel) === true) {
    instruments.push({
      label: "Régua de nível",
      startedAt: parseArcGisDate(attributes.EscalaNivelInicio),
      endedAt: parseArcGisDate(attributes.EscalaNivelFim),
    });
  }
  if (asYesNo(attributes.RegistradorNivel) === true) {
    instruments.push({
      label: "Registrador de nível",
      startedAt: parseArcGisDate(attributes.RegistradorNivelInicio),
      endedAt: parseArcGisDate(attributes.RegistradorNivelFim),
    });
  }
  if (asYesNo(attributes.EstacaoTelemetrica) === true) {
    instruments.push({
      label: "Telemetria",
      startedAt: parseArcGisDate(attributes.EstacaoTelemetricaInicio),
      endedAt: parseArcGisDate(attributes.EstacaoTelemetricaFim),
    });
  }

  return {
    status: "live",
    code: STATION_CODE,
    name: asText(attributes.Nome),
    description: asText(attributes.Descricao),
    stationType: asText(attributes.TipoEstacao),
    operating: asYesNo(attributes.Operando),
    municipality: asText(attributes.Municipio),
    state: asText(attributes.UF),
    river: asText(attributes.Rio),
    basin: asText(attributes.Bacia),
    subBasin: asText(attributes.SubBacia),
    responsible: asText(attributes.ResponsavelSigla) ?? asText(attributes.Responsavel),
    operator: asText(attributes.OperadoraSigla) ?? asText(attributes.Operadora),
    latitude: attributes.Latitude ?? null,
    longitude: attributes.Longitude ?? null,
    altitudeM: attributes.Altitude ?? null,
    drainageAreaKm2: attributes.AreaDrenagem ?? null,
    instruments,
    inventoryUpdatedAt: parseArcGisDate(attributes.DataAlteracao),
    source: sourceMetadata(fetchedAt),
    error: null,
  };
}

export async function fetchAnaRhnLaranjalStationProfile(): Promise<AnaRhnLaranjalStationProfile> {
  try {
    const response = await fetch(buildAnaRhnLaranjalStationProfileUrl(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "TempoPelotas/2.0 (+https://tempopelotas.com.br)",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return createUnavailableAnaRhnLaranjalStationProfile(
        `A consulta do cadastro ANA/SNIRH recebeu HTTP ${response.status}.`,
      );
    }

    return parseAnaRhnLaranjalStationProfilePayload(
      (await response.json()) as unknown,
      new Date().toISOString(),
    );
  } catch (error) {
    return createUnavailableAnaRhnLaranjalStationProfile(
      error instanceof Error
        ? `Falha da consulta ao cadastro ANA/SNIRH: ${error.message}`
        : "Falha desconhecida da consulta ao cadastro ANA/SNIRH.",
    );
  }
}
