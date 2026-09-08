import { z } from "zod";

const ANA_RHN_PUBLIC_ORIGIN = "https://portal1.snirh.gov.br";
const ANA_RHN_PUBLIC_LAYER_PATH = "/server/rest/services/SGH/CotasReferencia2/MapServer/2/query";
const ANA_RHN_PUBLIC_LAYER_URL = `${ANA_RHN_PUBLIC_ORIGIN}/server/rest/services/SGH/CotasReferencia2/MapServer/2`;
const ANA_RHN_HIDROWEB_URL = "https://www.snirh.gov.br/hidroweb/";
const REQUEST_TIMEOUT_MS = 3_500;
const LARANJAL_STATION_CODE = "87955001";
const ANA_RHN_LEVEL_UNIT = "cm" as const;
const ANA_RHN_STATION_TIMEZONE = "America/Sao_Paulo" as const;
const ALLOWED_HOSTS = new Set(["portal1.snirh.gov.br"]);

const stationCodeSchema = z.union([z.string(), z.number()]);
const nullableTextSchema = z.string().nullable().optional();
const nullableScalarSchema = z.union([z.string(), z.number()]).nullable().optional();

const attributesSchema = z
  .object({
    Codigo: stationCodeSchema,
    Parametro: nullableTextSchema,
    Nome: nullableTextSchema,
    Bacia: nullableTextSchema,
    SubBacia: nullableTextSchema,
    Municipio: nullableTextSchema,
    Estado: nullableTextSchema,
    Responsavel: nullableTextSchema,
    Operadora: nullableTextSchema,
    Status_Estacao: nullableTextSchema,
    Data_ult_dado: nullableScalarSchema,
    Ult_Dado: nullableScalarSchema,
    Status_Dado: nullableTextSchema,
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

export type AnaRhnBlockingReason =
  | "vertical-reference-unconfirmed"
  | "station-specific-leveling-not-recovered"
  | "historical-current-vertical-continuity-unproven";

export type AnaRhnVerticalReferenceEvidence = {
  status: "unconfirmed";
  stationSpecificGaugeZeroDocumented: false;
  stationSpecificRnDocumented: false;
  stationSpecificLevelingRecovered: false;
  historical87955000ContinuityDocumented: false;
  inventoryAltitudeAcceptedAsGaugeZero: false;
  cotaLayerProvidesVerticalReference: false;
};

export type AnaRhnPublicStationSnapshot = {
  status: "source-live" | "unavailable";
  stationCode: string;
  stationName: string | null;
  municipality: string | null;
  state: string | null;
  basin: string | null;
  subBasin: string | null;
  operator: string | null;
  responsibleEntity: string | null;
  stationStatus: string | null;
  parameter: string | null;
  rawValue: number | null;
  rawObservedAt: string | null;
  sourceDataStatus: string | null;
  unit: typeof ANA_RHN_LEVEL_UNIT;
  timeZone: typeof ANA_RHN_STATION_TIMEZONE;
  verticalReference: null;
  verticalReferenceEvidence: AnaRhnVerticalReferenceEvidence;
  publishableMeasurement: false;
  blockingReasons: AnaRhnBlockingReason[];
  fetchedAt: string;
  source: {
    name: "ANA / SNIRH / RHN";
    url: string;
    layerUrl: string;
  };
  error: string | null;
};

const BLOCKING_REASONS: AnaRhnBlockingReason[] = [
  "vertical-reference-unconfirmed",
  "station-specific-leveling-not-recovered",
  "historical-current-vertical-continuity-unproven",
];

const VERTICAL_REFERENCE_EVIDENCE: AnaRhnVerticalReferenceEvidence = {
  status: "unconfirmed",
  stationSpecificGaugeZeroDocumented: false,
  stationSpecificRnDocumented: false,
  stationSpecificLevelingRecovered: false,
  historical87955000ContinuityDocumented: false,
  inventoryAltitudeAcceptedAsGaugeZero: false,
  cotaLayerProvidesVerticalReference: false,
};

function asTrimmedText(value: string | null | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asFiniteNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function parseArcGisEpoch(value: string | number | null | undefined) {
  const epoch = asFiniteNumber(value);
  if (epoch === null || epoch <= 0) return null;
  const parsed = new Date(epoch);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeStationCode(value: string | number) {
  return String(value).trim();
}

function sourceMetadata() {
  return {
    name: "ANA / SNIRH / RHN" as const,
    url: ANA_RHN_HIDROWEB_URL,
    layerUrl: ANA_RHN_PUBLIC_LAYER_URL,
  };
}

function verticalReferenceEvidence(): AnaRhnVerticalReferenceEvidence {
  return { ...VERTICAL_REFERENCE_EVIDENCE };
}

function unavailableSnapshot(stationCode: string, error: string): AnaRhnPublicStationSnapshot {
  return {
    status: "unavailable",
    stationCode,
    stationName: null,
    municipality: null,
    state: null,
    basin: null,
    subBasin: null,
    operator: null,
    responsibleEntity: null,
    stationStatus: null,
    parameter: null,
    rawValue: null,
    rawObservedAt: null,
    sourceDataStatus: null,
    unit: ANA_RHN_LEVEL_UNIT,
    timeZone: ANA_RHN_STATION_TIMEZONE,
    verticalReference: null,
    verticalReferenceEvidence: verticalReferenceEvidence(),
    publishableMeasurement: false,
    blockingReasons: [...BLOCKING_REASONS],
    fetchedAt: new Date().toISOString(),
    source: sourceMetadata(),
    error,
  };
}

export function buildAnaRhnPublicStationUrl(stationCode = LARANJAL_STATION_CODE) {
  if (!/^\d{8}$/.test(stationCode)) {
    throw new Error("Código de estação ANA/RHN inválido.");
  }

  const url = new URL(ANA_RHN_PUBLIC_LAYER_PATH, ANA_RHN_PUBLIC_ORIGIN);
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Host ANA/RHN fora da allowlist.");
  }

  url.searchParams.set("where", `Codigo=${Number(stationCode)}`);
  url.searchParams.set(
    "outFields",
    [
      "Codigo",
      "Parametro",
      "Nome",
      "Bacia",
      "SubBacia",
      "Municipio",
      "Estado",
      "Responsavel",
      "Operadora",
      "Status_Estacao",
      "Data_ult_dado",
      "Ult_Dado",
      "Status_Dado",
    ].join(","),
  );
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("f", "json");
  return url;
}

export function parseAnaRhnPublicPayload(
  payload: unknown,
  expectedStationCode = LARANJAL_STATION_CODE,
  fetchedAt = new Date().toISOString(),
): AnaRhnPublicStationSnapshot {
  const parsed = queryResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return unavailableSnapshot(
      expectedStationCode,
      "O endpoint público ANA/RHN respondeu com estrutura incompatível com o contrato esperado.",
    );
  }

  if (parsed.data.error) {
    const code = parsed.data.error.code ? ` (${parsed.data.error.code})` : "";
    return unavailableSnapshot(
      expectedStationCode,
      `O endpoint público ANA/RHN informou erro de consulta${code}.`,
    );
  }

  const feature = parsed.data.features.find(
    ({ attributes }) => normalizeStationCode(attributes.Codigo) === expectedStationCode,
  );
  if (!feature) {
    return unavailableSnapshot(
      expectedStationCode,
      "A estação ANA/RHN esperada não apareceu na resposta pública desta verificação.",
    );
  }

  const attributes = feature.attributes;
  return {
    status: "source-live",
    stationCode: normalizeStationCode(attributes.Codigo),
    stationName: asTrimmedText(attributes.Nome),
    municipality: asTrimmedText(attributes.Municipio),
    state: asTrimmedText(attributes.Estado),
    basin: asTrimmedText(attributes.Bacia),
    subBasin: asTrimmedText(attributes.SubBacia),
    operator: asTrimmedText(attributes.Operadora),
    responsibleEntity: asTrimmedText(attributes.Responsavel),
    stationStatus: asTrimmedText(attributes.Status_Estacao),
    parameter: asTrimmedText(attributes.Parametro),
    rawValue: asFiniteNumber(attributes.Ult_Dado),
    rawObservedAt: parseArcGisEpoch(attributes.Data_ult_dado),
    sourceDataStatus: asTrimmedText(attributes.Status_Dado),
    unit: ANA_RHN_LEVEL_UNIT,
    timeZone: ANA_RHN_STATION_TIMEZONE,
    verticalReference: null,
    verticalReferenceEvidence: verticalReferenceEvidence(),
    publishableMeasurement: false,
    blockingReasons: [...BLOCKING_REASONS],
    fetchedAt,
    source: sourceMetadata(),
    error: null,
  };
}

export async function fetchAnaRhnLaranjalPublicSnapshot(): Promise<AnaRhnPublicStationSnapshot> {
  try {
    const url = buildAnaRhnPublicStationUrl();
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TempoPelotas/2.0 (+https://tempopelotas.com.br)",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return unavailableSnapshot(
        LARANJAL_STATION_CODE,
        `A consulta pública ANA/RHN recebeu HTTP ${response.status}.`,
      );
    }

    return parseAnaRhnPublicPayload(
      (await response.json()) as unknown,
      LARANJAL_STATION_CODE,
      new Date().toISOString(),
    );
  } catch (error) {
    return unavailableSnapshot(
      LARANJAL_STATION_CODE,
      error instanceof Error
        ? `Falha da integração pública ANA/RHN: ${error.message}`
        : "Falha desconhecida da integração pública ANA/RHN.",
    );
  }
}
