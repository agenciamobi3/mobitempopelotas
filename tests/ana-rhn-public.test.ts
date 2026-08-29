import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildAnaRhnPublicStationUrl,
  parseAnaRhnPublicPayload,
} from "../src/lib/hydrology/ana-rhn-public.server.ts";

const source = readFileSync("src/lib/hydrology/ana-rhn-public.server.ts", "utf8");
const statusSource = readFileSync("src/lib/status/data-status.server.ts", "utf8");
const statusProbeWrapper = readFileSync(
  "src/lib/status/data-status-redemet-probes.server.ts",
  "utf8",
);

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

test("ANA RHN closes unit and timezone but keeps publication blocked by vertical reference", () => {
  const snapshot = parseAnaRhnPublicPayload(sanitizedLaranjalPayload);

  assert.equal(snapshot.unit, "cm");
  assert.equal(snapshot.timeZone, "America/Sao_Paulo");
  assert.equal(snapshot.verticalReference, null);
  assert.equal(snapshot.publishableMeasurement, false);
  assert.deepEqual(snapshot.blockingReasons, ["vertical-reference-unconfirmed"]);
  assert.equal(snapshot.rawValue, 116);
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
  assert.equal(snapshot.unit, "cm");
  assert.equal(snapshot.timeZone, "America/Sao_Paulo");
  assert.equal(snapshot.publishableMeasurement, false);
  assert.deepEqual(snapshot.blockingReasons, ["vertical-reference-unconfirmed"]);
  assert.match(snapshot.error ?? "", /estação ANA\/RHN esperada/i);
});

test("ANA RHN adapter keeps a short request budget and never writes historical measurements", () => {
  assert.match(source, /REQUEST_TIMEOUT_MS = 3_500/);
  assert.match(source, /AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
  assert.match(source, /ANA_RHN_LEVEL_UNIT = "cm"/);
  assert.match(source, /ANA_RHN_STATION_TIMEZONE = "America\/Sao_Paulo"/);
  assert.doesNotMatch(source, /historical_measurements/);
  assert.doesNotMatch(source, /supabase/);
});

test("status monitor probes ANA RHN readiness without promoting the source to runtime active", () => {
  assert.match(statusSource, /fetchAnaRhnLaranjalPublicSnapshot/);
  assert.match(statusSource, /anaRhnResult/);
  assert.match(statusSource, /id: "ana-rhn"/);
  assert.match(statusSource, /state: "implementation"/);
  assert.doesNotMatch(statusSource, /snapshot\.rawValue/);
});

test("status persistido corrige a cópia antiga e deixa apenas a referência vertical como gate ANA RHN", () => {
  assert.match(statusProbeWrapper, /normalizeAnaRhnImplementationDetail/);
  assert.match(statusProbeWrapper, /unidade \(cm\) e timezone foram confirmados/);
  assert.match(statusProbeWrapper, /referência vertical específica da estação/);
  assert.doesNotMatch(
    statusProbeWrapper,
    /ANA_RHN_CURRENT_BLOCKING_COPY[^;]+confirmar unidade, referência vertical e timezone/s,
  );
});
