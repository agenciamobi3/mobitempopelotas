import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildAnaRhnHistoricalConsistencyUrl,
  parseAnaRhnHistoricalConsistencyPayload,
} from "../src/lib/hydrology/ana-rhn-consistency.server.ts";

const server = readFileSync("src/lib/hydrology/ana-rhn-consistency.server.ts", "utf8");
const component = readFileSync(
  "src/components/history/AnaRhnHistoricalConsistency.tsx",
  "utf8",
);
const route = readFileSync("src/routes/enchente-2001-pelotas.tsx", "utf8");

const sanitizedPayload = {
  features: [
    {
      attributes: {
        Codigo: 87955000,
        Notas: 12.5,
        Indice: "BOM",
        Nome: "LARANJAL",
        Operando: "Sim",
        AreaDrenag: null,
        Bacia: "ATLÂNTICO, TRECHO SUDESTE",
        SubBacia: "LAGOA DOS PATOS",
        Rio: "LAGOA DOS PATOS",
        UF: "RS",
        Municipio: "PELOTAS",
        c1: 1,
        c2: 2,
      },
    },
  ],
};

test("NotasConsistencia query is fixed to historical Laranjal 87955000 and uses no credential", () => {
  const url = buildAnaRhnHistoricalConsistencyUrl();

  assert.equal(url.protocol, "https:");
  assert.equal(url.hostname, "portal1.snirh.gov.br");
  assert.equal(url.searchParams.get("where"), "Codigo=87955000");
  assert.equal(url.searchParams.get("returnGeometry"), "false");
  assert.equal(url.searchParams.get("resultRecordCount"), "1");
  assert.equal(url.searchParams.get("f"), "json");
  assert.equal(url.searchParams.has("token"), false);
  assert.equal(url.searchParams.has("api_key"), false);
  assert.equal(url.username, "");
  assert.equal(url.password, "");
});

test("historical consistency preserves ANA score and classification without inventing a scale", () => {
  const data = parseAnaRhnHistoricalConsistencyPayload(
    sanitizedPayload,
    "2026-09-08T20:30:00.000Z",
  );

  assert.equal(data.status, "live");
  assert.equal(data.stationCode, "87955000");
  assert.equal(data.stationName, "LARANJAL");
  assert.equal(data.municipality, "PELOTAS");
  assert.equal(data.river, "LAGOA DOS PATOS");
  assert.equal(data.score, 12.5);
  assert.equal(data.classification, "BOM");
});

test("classification accepts the five renderer categories and normalizes accents", () => {
  const values = [
    ["ÓTIMO", "OTIMO"],
    ["BOM", "BOM"],
    ["RAZOÁVEL", "RAZOAVEL"],
    ["RUIM", "RUIM"],
    ["PÉSSIMO", "PESSIMO"],
  ] as const;

  for (const [input, expected] of values) {
    const data = parseAnaRhnHistoricalConsistencyPayload({
      features: [{ attributes: { ...sanitizedPayload.features[0].attributes, Indice: input } }],
    });
    assert.equal(data.classification, expected);
  }
});

test("missing station is not turned into a fake consistency assessment", () => {
  const data = parseAnaRhnHistoricalConsistencyPayload({ features: [] });

  assert.equal(data.status, "not-found");
  assert.equal(data.score, null);
  assert.equal(data.classification, null);
});

test("c1 through c16 stay outside the public adapter contract until documented", () => {
  const url = buildAnaRhnHistoricalConsistencyUrl();
  const outFields = url.searchParams.get("outFields") ?? "";

  assert.doesNotMatch(outFields, /\bc(?:1[0-6]|[1-9])\b/);
  assert.doesNotMatch(server, /attributes\.c(?:1[0-6]|[1-9])/);
  assert.match(component, /não descreve o significado de cada um/);
  assert.match(component, /não interpreta nem\s+publica esses campos/);
});

test("visitor copy does not convert the ANA score into percentage or event score", () => {
  assert.match(component, /Nota publicada pela ANA/);
  assert.match(component, /não é\s+uma nota da enchente de 8 de outubro de 2001/);
  assert.doesNotMatch(component, /de 10|de 100|percentual|% de consistência/i);
});

test("2001 route delegates consistency to the server function and keeps presentation fail-closed", () => {
  assert.match(route, /loader: \(\) => getAnaRhnHistoricalConsistency\(\)/);
  assert.doesNotMatch(route, /ana-rhn-consistency\.server/);
  assert.doesNotMatch(route, /createUnavailableAnaRhnHistoricalConsistency/);
  assert.match(route, /staleTime: 6 \* 60 \* 60 \* 1_000/);
  assert.match(route, /AnaRhnHistoricalConsistency data=\{consistency\}/);
  assert.match(component, /if \(data\.status !== "live"\) return null/);
  assert.match(component, /if \(data\.classification === null && data\.score === null\) return null/);
});
