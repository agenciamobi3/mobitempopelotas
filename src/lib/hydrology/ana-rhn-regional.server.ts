import { z } from "zod";

const ANA_RHN_INVENTORY_ORIGIN = "https://portal1.snirh.gov.br";
const ANA_RHN_INVENTORY_LAYER_PATH =
  "/server/rest/services/Estações_Hidrometeorológicas_SNIRH/FeatureServer/0/query";
const ANA_RHN_INVENTORY_LAYER_URL = `${ANA_RHN_INVENTORY_ORIGIN}/server/rest/services/Estações_Hidrometeorológicas_SNIRH/FeatureServer/0`;
const ANA_RHN_HIDROWEB_URL = "https://www.snirh.gov.br/hidroweb/";
const REQUEST_TIMEOUT_MS = 3_500;
const SEARCH_RADIUS_KM = 180;
const MAX_PUBLIC_STATIONS = 16;
const PELOTAS = { latitude: -31.7719, longitude: -52.3371 } as const;
const ALLOWED_HOSTS = new Set(["portal1.snirh.gov.br"]);

const nullableTextSchema = z.string().nullable().optional();
const nullableNumberSchema = z.number().nullable().optional();
const stationAttributesSchema = z
  .object({
    Codigo: z.union([z.string(), z.number()]),
    CodigoAdicional: nullableTextSchema,
    Nome: nullableTextSchema,
    TipoEstacao: nullableTextSchema,
    Operando: nullableTextSchema,
    Latitude: nullableNumberSchema,
    Longitude: nullableNumberSchema,
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
    RegistradorNivel: nullableTextSchema,
    PluviometroConvencional: nullableTextSchema,
    RegistradorChuva: nullableTextSchema,
    EstacaoTelemetrica: nullableTextSchema,
  })
  .passthrough();

const featureSchema = z
  .object({
    attributes: stationAttributesSchema,
    geometry: z
      .object({
        x: z.number().optional(),
        y: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const queryResponseSchema = z
  .object({
    features: z.array(featureSchema).default([]),
    exceededTransferLimit: z.boolean().optional(),
    error: z
      .object({
        code: z.number().optional(),
        message: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type AnaRhnRegionalStation = {
  id: string;
  code: string | null;
  name: string;
  stationType: string | null;
  operating: boolean | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  drainageAreaKm2: number | null;
  basin: string | null;
  subBasin: string | null;
  river: string | null;
  municipality: string | null;
  state: string | null;
  responsible: string | null;
  operator: string | null;
  instruments: string[];
};

export type AnaRhnRegionalInventoryData = {
  status: "live" | "unavailable";
  stations: AnaRhnRegionalStation[];
  searchRadiusKm: number;
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

function asInstrument(value: string | null | undefined, label: string) {
  return asYesNo(value) === true ? label : null;
}

function haversineDistanceKm(latitude: number, longitude: number) {
  const earthRadiusKm = 6_371;
  const radians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = radians(latitude - PELOTAS.latitude);
  const longitudeDelta = radians(longitude - PELOTAS.longitude);
  const originLatitude = radians(PELOTAS.latitude);
  const destinationLatitude = radians(latitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function stationSource() {
  return {
    name: "ANA / SNIRH / Rede Hidrometeorológica Nacional" as const,
    url: ANA_RHN_HIDROWEB_URL,
    layerUrl: ANA_RHN_INVENTORY_LAYER_URL,
    fetchedAt: new Date().toISOString(),
  };
}

export function createUnavailableAnaRhnRegionalInventory(
  error = "O inventário regional ANA/RHN não respondeu nesta atualização.",
): AnaRhnRegionalInventoryData {
  return {
    status: "unavailable",
    stations: [],
    searchRadiusKm: SEARCH_RADIUS_KM,
    source: stationSource(),
    error,
  };
}

export function buildAnaRhnRegionalInventoryUrl() {
  const url = new URL(ANA_RHN_INVENTORY_LAYER_PATH, ANA_RHN_INVENTORY_ORIGIN);
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Host ANA/RHN fora da allowlist.");
  }

  url.searchParams.set("where", "1=1");
  url.searchParams.set("geometry", `${PELOTAS.longitude},${PELOTAS.latitude}`);
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("distance", String(SEARCH_RADIUS_KM));
  url.searchParams.set("units", "esriSRUnit_Kilometer");
  url.searchParams.set("outSR", "4326");
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
      "RegistradorNivel",
      "PluviometroConvencional",
      "RegistradorChuva",
      "EstacaoTelemetrica",
    ].join(","),
  );
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("resultRecordCount", "200");
  url.searchParams.set("f", "json");
  return url;
}

export function parseAnaRhnRegionalInventoryPayload(
  payload: unknown,
  fetchedAt = new Date().toISOString(),
): AnaRhnRegionalInventoryData {
  const parsed = queryResponseSchema.safeParse(payload);
  if (!parsed.success || parsed.data.error) {
    return createUnavailableAnaRhnRegionalInventory(
      parsed.success && parsed.data.error?.code
        ? `O inventário ANA/RHN informou erro ${parsed.data.error.code}.`
        : "O inventário ANA/RHN respondeu com estrutura incompatível com o contrato esperado.",
    );
  }

  const stations = parsed.data.features
    .map(({ attributes, geometry }) => {
      const latitude = attributes.Latitude ?? geometry?.y ?? null;
      const longitude = attributes.Longitude ?? geometry?.x ?? null;
      const name = asText(attributes.Nome);
      if (latitude === null || longitude === null || !name) return null;

      const additionalCode = asText(attributes.CodigoAdicional);
      const rawCode = String(attributes.Codigo).trim();
      const code = additionalCode ?? (/^\d{6,10}$/.test(rawCode) ? rawCode : null);
      const instruments = [
        asInstrument(attributes.EscalaNivel, "Régua de nível"),
        asInstrument(attributes.RegistradorNivel, "Registrador de nível"),
        asInstrument(attributes.PluviometroConvencional, "Pluviômetro"),
        asInstrument(attributes.RegistradorChuva, "Registrador de chuva"),
        asInstrument(attributes.EstacaoTelemetrica, "Telemetria"),
      ].filter((value): value is string => Boolean(value));

      return {
        id: code ?? `${name}-${latitude}-${longitude}`,
        code,
        name,
        stationType: asText(attributes.TipoEstacao),
        operating: asYesNo(attributes.Operando),
        latitude,
        longitude,
        distanceKm: haversineDistanceKm(latitude, longitude),
        drainageAreaKm2: attributes.AreaDrenagem ?? null,
        basin: asText(attributes.Bacia),
        subBasin: asText(attributes.SubBacia),
        river: asText(attributes.Rio),
        municipality: asText(attributes.Municipio),
        state: asText(attributes.UF),
        responsible: asText(attributes.ResponsavelSigla) ?? asText(attributes.Responsavel),
        operator: asText(attributes.OperadoraSigla) ?? asText(attributes.Operadora),
        instruments,
      } satisfies AnaRhnRegionalStation;
    })
    .filter((station): station is AnaRhnRegionalStation => station !== null)
    .filter((station) => station.distanceKm <= SEARCH_RADIUS_KM + 1)
    .sort((a, b) => {
      if (a.operating !== b.operating) {
        if (a.operating === true) return -1;
        if (b.operating === true) return 1;
      }
      return a.distanceKm - b.distanceKm;
    })
    .slice(0, MAX_PUBLIC_STATIONS);

  return {
    status: "live",
    stations,
    searchRadiusKm: SEARCH_RADIUS_KM,
    source: {
      ...stationSource(),
      fetchedAt,
    },
    error: null,
  };
}

export async function fetchAnaRhnRegionalInventory(): Promise<AnaRhnRegionalInventoryData> {
  try {
    const response = await fetch(buildAnaRhnRegionalInventoryUrl(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "TempoPelotas/2.0 (+https://tempopelotas.com.br)",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return createUnavailableAnaRhnRegionalInventory(
        `A consulta pública do inventário ANA/RHN recebeu HTTP ${response.status}.`,
      );
    }

    return parseAnaRhnRegionalInventoryPayload(
      (await response.json()) as unknown,
      new Date().toISOString(),
    );
  } catch (error) {
    return createUnavailableAnaRhnRegionalInventory(
      error instanceof Error
        ? `Falha da consulta ao inventário ANA/RHN: ${error.message}`
        : "Falha desconhecida da consulta ao inventário ANA/RHN.",
    );
  }
}
