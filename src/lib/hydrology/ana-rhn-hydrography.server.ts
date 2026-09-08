import { z } from "zod";

const ANA_RHN_ORIGIN = "https://portal1.snirh.gov.br";
const RIVERS_PATH = "/server/rest/services/RiosPrincipais/MapServer/0/query";
const WATER_BODIES_PATH = "/server/rest/services/Hidrografia/MapServer/2/query";
const RIVERS_LAYER_URL = `${ANA_RHN_ORIGIN}/server/rest/services/RiosPrincipais/MapServer/0`;
const WATER_BODIES_LAYER_URL = `${ANA_RHN_ORIGIN}/server/rest/services/Hidrografia/MapServer/2`;
const REQUEST_TIMEOUT_MS = 3_500;
const ALLOWED_HOSTS = new Set(["portal1.snirh.gov.br"]);

// Recorte regional equivalente, de forma aproximada, ao raio usado no inventário de estações.
// A geometria é simplificada apenas para visualização cartográfica; não é usada para medição.
const REGIONAL_BOUNDS = {
  west: -54.25,
  south: -33.4,
  east: -50.4,
  north: -30.1,
} as const;

const geoJsonFeatureSchema = z
  .object({
    type: z.literal("Feature"),
    properties: z.record(z.string(), z.unknown()).nullable().optional(),
    geometry: z
      .object({
        type: z.string(),
        coordinates: z.unknown(),
      })
      .nullable(),
  })
  .passthrough();

const geoJsonCollectionSchema = z
  .object({
    type: z.literal("FeatureCollection"),
    features: z.array(geoJsonFeatureSchema).default([]),
  })
  .passthrough();

export type AnaRhnHydrographyFeature = {
  type: "Feature";
  properties: {
    name: string | null;
    kind: "river" | "water-body";
  };
  geometry: {
    type: "LineString" | "MultiLineString" | "Polygon" | "MultiPolygon";
    coordinates: unknown;
  };
};

export type AnaRhnHydrographyCollection = {
  type: "FeatureCollection";
  features: AnaRhnHydrographyFeature[];
};

export type AnaRhnHydrographyData = {
  status: "live" | "partial" | "unavailable";
  rivers: AnaRhnHydrographyCollection;
  waterBodies: AnaRhnHydrographyCollection;
  source: {
    name: "ANA / SNIRH";
    riversLayerUrl: string;
    waterBodiesLayerUrl: string;
    fetchedAt: string;
  };
  error: string | null;
};

function emptyCollection(): AnaRhnHydrographyCollection {
  return { type: "FeatureCollection", features: [] };
}

function sourceMetadata(fetchedAt = new Date().toISOString()) {
  return {
    name: "ANA / SNIRH" as const,
    riversLayerUrl: RIVERS_LAYER_URL,
    waterBodiesLayerUrl: WATER_BODIES_LAYER_URL,
    fetchedAt,
  };
}

export function createUnavailableAnaRhnHydrography(
  error = "A hidrografia regional da ANA/SNIRH não respondeu nesta atualização.",
): AnaRhnHydrographyData {
  return {
    status: "unavailable",
    rivers: emptyCollection(),
    waterBodies: emptyCollection(),
    source: sourceMetadata(),
    error,
  };
}

function buildLayerUrl(path: string, outFields: string) {
  const url = new URL(path, ANA_RHN_ORIGIN);
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Host ANA/SNIRH fora da allowlist.");
  }

  url.searchParams.set("where", "1=1");
  url.searchParams.set(
    "geometry",
    `${REGIONAL_BOUNDS.west},${REGIONAL_BOUNDS.south},${REGIONAL_BOUNDS.east},${REGIONAL_BOUNDS.north}`,
  );
  url.searchParams.set("geometryType", "esriGeometryEnvelope");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("outFields", outFields);
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("maxAllowableOffset", "0.002");
  url.searchParams.set("geometryPrecision", "5");
  url.searchParams.set("f", "geojson");
  return url;
}

export function buildAnaRhnRiversUrl() {
  return buildLayerUrl(RIVERS_PATH, "NORIOCOMP");
}

export function buildAnaRhnWaterBodiesUrl() {
  return buildLayerUrl(WATER_BODIES_PATH, "NOME_ESP,NOME_ALT,TIPO_ESP");
}

function asText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseCollection(payload: unknown, kind: "river" | "water-body") {
  const parsed = geoJsonCollectionSchema.safeParse(payload);
  if (!parsed.success) return null;

  const features = parsed.data.features.flatMap((feature) => {
    if (!feature.geometry) return [];
    const geometryType = feature.geometry.type;
    const validGeometry =
      kind === "river"
        ? geometryType === "LineString" || geometryType === "MultiLineString"
        : geometryType === "Polygon" || geometryType === "MultiPolygon";
    if (!validGeometry) return [];

    const properties = feature.properties ?? {};
    const name =
      kind === "river"
        ? asText(properties.NORIOCOMP)
        : asText(properties.NOME_ESP) ?? asText(properties.NOME_ALT);

    return [
      {
        type: "Feature" as const,
        properties: { name, kind },
        geometry: {
          type: geometryType as AnaRhnHydrographyFeature["geometry"]["type"],
          coordinates: feature.geometry.coordinates,
        },
      },
    ];
  });

  return { type: "FeatureCollection" as const, features } satisfies AnaRhnHydrographyCollection;
}

export function parseAnaRhnRiversPayload(payload: unknown) {
  return parseCollection(payload, "river");
}

export function parseAnaRhnWaterBodiesPayload(payload: unknown) {
  return parseCollection(payload, "water-body");
}

async function fetchGeoJson(url: URL) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/geo+json, application/json",
      "User-Agent": "TempoPelotas/2.0 (+https://tempopelotas.com.br)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}

export async function fetchAnaRhnRegionalHydrography(): Promise<AnaRhnHydrographyData> {
  const fetchedAt = new Date().toISOString();
  const [riversResult, waterBodiesResult] = await Promise.allSettled([
    fetchGeoJson(buildAnaRhnRiversUrl()),
    fetchGeoJson(buildAnaRhnWaterBodiesUrl()),
  ]);

  const rivers =
    riversResult.status === "fulfilled" ? parseAnaRhnRiversPayload(riversResult.value) : null;
  const waterBodies =
    waterBodiesResult.status === "fulfilled"
      ? parseAnaRhnWaterBodiesPayload(waterBodiesResult.value)
      : null;

  if (!rivers && !waterBodies) {
    return createUnavailableAnaRhnHydrography(
      "As camadas regionais de rios e massas d'água da ANA/SNIRH não responderam nesta atualização.",
    );
  }

  const partial = !rivers || !waterBodies;
  return {
    status: partial ? "partial" : "live",
    rivers: rivers ?? emptyCollection(),
    waterBodies: waterBodies ?? emptyCollection(),
    source: sourceMetadata(fetchedAt),
    error: partial
      ? "Uma das camadas cartográficas oficiais não respondeu; o mapa usa apenas a camada disponível."
      : null,
  };
}
