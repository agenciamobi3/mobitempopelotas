import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildAnaRhnRiversUrl,
  buildAnaRhnWaterBodiesUrl,
  parseAnaRhnRiversPayload,
  parseAnaRhnWaterBodiesPayload,
} from "../src/lib/hydrology/ana-rhn-hydrography.server.ts";

const server = readFileSync("src/lib/hydrology/ana-rhn-hydrography.server.ts", "utf8");
const loader = readFileSync("src/lib/hydrology/public-hydrology-page-loader.ts", "utf8");
const map = readFileSync("src/components/hydrology/AnaRhnRegionalMap.tsx", "utf8");
const route = readFileSync("src/routes/situacao-hidrologica-pelotas.tsx", "utf8");

const riverPayload = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { NORIOCOMP: "Canal São Gonçalo" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-52.5, -31.8],
          [-52.2, -31.9],
        ],
      },
    },
  ],
};

const waterPayload = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { NOME_ESP: "Lagoa dos Patos", NOME_ALT: null, TIPO_ESP: "Lagoa" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-52.3, -32.0],
            [-51.8, -32.0],
            [-51.8, -31.6],
            [-52.3, -31.6],
            [-52.3, -32.0],
          ],
        ],
      },
    },
  ],
};

test("ANA hydrography queries are regional, public, HTTPS and GeoJSON", () => {
  for (const url of [buildAnaRhnRiversUrl(), buildAnaRhnWaterBodiesUrl()]) {
    assert.equal(url.protocol, "https:");
    assert.equal(url.hostname, "portal1.snirh.gov.br");
    assert.equal(url.searchParams.get("geometryType"), "esriGeometryEnvelope");
    assert.equal(url.searchParams.get("inSR"), "4326");
    assert.equal(url.searchParams.get("outSR"), "4326");
    assert.equal(url.searchParams.get("returnGeometry"), "true");
    assert.equal(url.searchParams.get("f"), "geojson");
    assert.equal(url.searchParams.get("maxAllowableOffset"), "0.002");
    assert.equal(url.searchParams.has("token"), false);
    assert.equal(url.searchParams.has("api_key"), false);
  }

  assert.match(buildAnaRhnRiversUrl().pathname, /RiosPrincipais\/MapServer\/0\/query$/);
  assert.match(buildAnaRhnWaterBodiesUrl().pathname, /Hidrografia\/MapServer\/2\/query$/);
});

test("ANA hydrography parser keeps official names and expected geometry types", () => {
  const rivers = parseAnaRhnRiversPayload(riverPayload);
  const waterBodies = parseAnaRhnWaterBodiesPayload(waterPayload);

  assert.equal(rivers?.features.length, 1);
  assert.equal(rivers?.features[0]?.properties.name, "Canal São Gonçalo");
  assert.equal(rivers?.features[0]?.properties.kind, "river");
  assert.equal(rivers?.features[0]?.geometry.type, "LineString");

  assert.equal(waterBodies?.features.length, 1);
  assert.equal(waterBodies?.features[0]?.properties.name, "Lagoa dos Patos");
  assert.equal(waterBodies?.features[0]?.properties.kind, "water-body");
  assert.equal(waterBodies?.features[0]?.geometry.type, "Polygon");
});

test("ANA hydrography rejects geometry that does not belong to each layer", () => {
  const polygonAsRiver = parseAnaRhnRiversPayload(waterPayload);
  const lineAsWater = parseAnaRhnWaterBodiesPayload(riverPayload);

  assert.deepEqual(polygonAsRiver?.features, []);
  assert.deepEqual(lineAsWater?.features, []);
});

test("hydrography stays a cartographic dependency and not a level measurement", () => {
  assert.match(loader, /getAnaRhnRegionalHydrography/);
  assert.match(loader, /anaRhnHydrography:/);
  assert.doesNotMatch(server, /currentLevel|rawValue|publishableMeasurement|historical_measurements|supabase/);
  assert.match(route, /rios principais e massas d’água oficiais/);
});

test("MapLibre renders official water polygons below rivers and station points", () => {
  assert.match(map, /WATER_FILL_LAYER_ID/);
  assert.match(map, /RIVERS_LAYER_ID/);
  assert.match(map, /RIVERS_LABEL_LAYER_ID/);
  assert.match(map, /Massas d'água: ANA \/ SNIRH/);
  assert.match(map, /Rios principais: ANA \/ SNIRH/);
  assert.match(map, /text-field": \["get", "name"\]/);
  assert.match(map, /Estações, rios e massas d’água: ANA \/ SNIRH/);
});
