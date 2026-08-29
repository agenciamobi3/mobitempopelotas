import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildAnaRhnPublicStationUrl,
  parseAnaRhnPublicPayload,
} from "../src/lib/hydrology/ana-rhn-public.server.ts";

const source = readFileSync("src/lib/hydrology/ana-rhn-public.server.ts", "utf8");

const sanitizedLaranjalPayload = {
  displayFieldName: "Parametro",
  features: [
    {
      attributes: {
        Codigo: 87955001,
        Parametro: "Nivel",
        Nome: "LARANJAL",
        Bacia: "ATLÂNTICO, TRECHO SUDESTE",
        SubBacia: "LAGOA DOS PATOS",
        Municipio: "PELOTAS",
        Estado: "RIO GRANDE DO SUL",
        Responsavel: "UFPEL",
        Operadora: "UFPEL",
        Status_Estacao: "Ativo",
        Data_ult_dado: 1787934120000,
        Ult_Dado: 116.0,
        Status_Dado: "Sem dados de referencia",
      },
    },
  ],
};

test("ANA RHN public adapter preserves the verified station identity and raw reading", () => {
  const snapshot = parseAnaRhnPublicPayload(
    sanitizedLaranjalPayload,
    "87955001",
    "2026-08-29T03:30:00.000Z",
  );

  assert.equal(snapshot.status, "source-live");
  assert.equal(snapshot.stationCode, "87955001");
  assert.equal(snapshot.stationName, "LARANJAL");
  assert.equal(snapshot.parameter, "Nivel");
  assert.equal(snapshot.operator, "UFPEL");
  assert.equal(snapshot.responsibleEntity, "UFPEL");
  assert.equal(snapshot.rawValue, 116);
  assert.equal(snapshot.rawObservedAt, "2026-08-28T16:22:00.000Z");
  assert.equal(snapshot.sourceDataStatus, "Sem dados de referencia");
});

test("ANA RHN raw value is never normalized into a publishable water level before semantic gates close", () => {
  const snapshot = parseAnaRhnPublicPayload(sanitizedLaranjalPayload);

  assert.equal(snapshot.unit, null);
  assert.equal(snapshot.verticalReference, null);
  assert.equal(snapshot.publishableMeasurement, false);
  assert.deepEqual(snapshot.blockingReasons, [
    "unit-unconfirmed",
    "vertical-reference-unconfirmed",
    "timezone-contract-unconfirmed",
  ]);
  assert.equal(snapshot.rawValue, 116);
  assert.notEqual(snapshot.rawValue, 1.16);
});

test("ANA RHN public query is fixed to the official HTTPS ArcGIS host and contains no credential", () => {
  const url = buildAnaRhnPublicStationUrl("87955001");

  assert.equal(url.protocol, "https:");
  assert.equal(url.hostname, "portal1.snirh.gov.br");
  assert.equal(url.searchParams.get("where"), "Codigo=87955001");
  assert.equal(url.searchParams.get("returnGeometry"), "false");
  assert.equal(url.searchParams.get("f"), "json");
  assert.equal(url.searchParams.has("token"), false);
  assert.equal(url.searchParams.has("api_key"), false);
  assert.equal(url.username, "");
  assert.equal(url.password, "");
});

test("ANA RHN adapter treats a missing expected station as unavailable without fabricating a zero", () => {
  const snapshot = parseAnaRhnPublicPayload({ features: [] });

  assert.equal(snapshot.status, "unavailable");
  assert.equal(snapshot.rawValue, null);
  assert.equal(snapshot.publishableMeasurement, false);
  assert.match(snapshot.error ?? "", /estação ANA\/RHN esperada/i);
});

test("ANA RHN adapter keeps a short request budget and never writes historical measurements", () => {
  assert.match(source, /REQUEST_TIMEOUT_MS = 3_500/);
  assert.match(source, /AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
  assert.doesNotMatch(source, /historical_measurements/);
  assert.doesNotMatch(source, /supabase/);
});
