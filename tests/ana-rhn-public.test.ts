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
const integrationDoc = readFileSync("docs/ANA_RHN_INTEGRATION.md", "utf8");
const exportAuditDoc = readFileSync(
  "docs/LARANJAL_HIDRO_EXPORT_AUDIT_2026-09-06.md",
  "utf8",
);

const BLOCKING_REASONS = [
  "vertical-reference-unconfirmed",
  "station-specific-leveling-not-recovered",
  "historical-current-vertical-continuity-unproven",
] as const;

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

test("ANA RHN public adapter preserves the verified current station identity and raw reading", () => {
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

test("ANA RHN closes unit and timezone but keeps publication blocked by vertical evidence", () => {
  const snapshot = parseAnaRhnPublicPayload(sanitizedLaranjalPayload);

  assert.equal(snapshot.unit, "cm");
  assert.equal(snapshot.timeZone, "America/Sao_Paulo");
  assert.equal(snapshot.verticalReference, null);
  assert.equal(snapshot.publishableMeasurement, false);
  assert.deepEqual(snapshot.blockingReasons, BLOCKING_REASONS);
  assert.deepEqual(snapshot.verticalReferenceEvidence, {
    status: "unconfirmed",
    stationSpecificGaugeZeroDocumented: false,
    stationSpecificRnDocumented: false,
    stationSpecificLevelingRecovered: false,
    historical87955000ContinuityDocumented: false,
    inventoryAltitudeAcceptedAsGaugeZero: false,
    cotaLayerProvidesVerticalReference: false,
  });
  assert.equal(snapshot.rawValue, 116);
});

test("a normal data-status label cannot unlock the ANA measurement without vertical evidence", () => {
  const payload = structuredClone(sanitizedLaranjalPayload);
  payload.features[0].attributes.Status_Dado = "Normal";

  const snapshot = parseAnaRhnPublicPayload(payload);

  assert.equal(snapshot.status, "source-live");
  assert.equal(snapshot.sourceDataStatus, "Normal");
  assert.equal(snapshot.rawValue, 116);
  assert.equal(snapshot.verticalReference, null);
  assert.equal(snapshot.verticalReferenceEvidence.status, "unconfirmed");
  assert.equal(snapshot.publishableMeasurement, false);
  assert.deepEqual(snapshot.blockingReasons, BLOCKING_REASONS);
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

test("current-data layer does not pretend to provide RN, datum or gauge-zero reference", () => {
  const url = buildAnaRhnPublicStationUrl("87955001");
  const outFields = url.searchParams.get("outFields") ?? "";

  assert.doesNotMatch(outFields, /Altitude|RN|Datum|Benchmark|Zero/i);
  assert.equal(source.includes("inventoryAltitudeAcceptedAsGaugeZero: false"), true);
  assert.equal(source.includes("cotaLayerProvidesVerticalReference: false"), true);
});

test("historical 87955000 and current 87955001 stay separate while their operational split is documented", () => {
  assert.match(integrationDoc, /`87955000` = identidade convencional\/histórica da régua/);
  assert.match(integrationDoc, /`87955001` = identidade telemétrica recente/);
  assert.match(integrationDoc, /30\/04\/2026/);
  assert.match(integrationDoc, /retirando `T`/);
  assert.match(integrationDoc, /08\/06\/2026/);
  assert.match(integrationDoc, /descrição: `TELEMÉTRICA`/);
  assert.match(integrationDoc, /não unir as duas séries automaticamente/);
  assert.match(integrationDoc, /não transferir zero, datum, RN, cota de referência ou histórico entre os códigos/);
  assert.match(integrationDoc, /não concatenar as séries apenas porque o nome da estação é o mesmo/);
  assert.match(integrationDoc, /`87955000` apenas como \*\*régua histórica\*\*/);
  assert.match(integrationDoc, /`87955001` apenas para \*\*readiness\/cross-check atual\*\*/);
});

test("Hidro export audit locks raw versus consistent values for 08 October 2001", () => {
  assert.match(exportAuditDoc, /`NivelConsistencia=1` = \*\*Bruto\*\*/);
  assert.match(exportAuditDoc, /`NivelConsistencia=2` = \*\*Consistido\*\*/);
  assert.match(exportAuditDoc, /Bruto \| leitura 07:00 \| 300 cm/);
  assert.match(exportAuditDoc, /Bruto \| leitura 17:00 \| 280 cm/);
  assert.match(exportAuditDoc, /Bruto \| média diária \| \*\*290 cm\*\*/);
  assert.match(exportAuditDoc, /Consistido \| média diária \| \*\*190 cm\*\* \| \*\*2 = Estimado\*\*/);
  assert.match(exportAuditDoc, /não escolhe silenciosamente um dos dois/);
});

test("2018 consistency intervention and 2017 zero clue do not become an invented 2001 datum", () => {
  assert.match(exportAuditDoc, /05\/10\/2017/);
  assert.match(exportAuditDoc, /5,00 m.*-0,02 m/s);
  assert.match(exportAuditDoc, /30\/03\/2018/);
  assert.match(exportAuditDoc, /29\/06\/2018/);
  assert.match(exportAuditDoc, /Contrato ANA nº 10\/2015/);
  assert.match(exportAuditDoc, /não autoriza aplicar retroativamente `-0,02 m` à série de 2001/);
  assert.match(integrationDoc, /não é aplicado retroativamente a 2001/);
});

test("historical series is recovered without turning a legacy service or raw files into runtime dependencies", () => {
  assert.match(integrationDoc, /antiga prioridade de “recuperar o arquivo bruto\/consistido” foi concluída/);
  assert.match(integrationDoc, /290 cm/);
  assert.match(integrationDoc, /190 cm/);
  assert.match(integrationDoc, /status \*\*Estimado\*\*/);
  assert.match(integrationDoc, /HidroSerieCotas\/v1/);
  assert.match(integrationDoc, /HidroSerieHistorica/);
  assert.match(integrationDoc, /suporte prorrogado somente até \*\*30\/06\/2026\*\*/);
  assert.match(integrationDoc, /não deve virar dependência nova de runtime/);
  assert.match(integrationDoc, /arquivos MDB\/CSV\/TXT recebidos para pesquisa não são versionados/);
  assert.doesNotMatch(source, /HidroSerieHistorica/);
  assert.doesNotMatch(source, /fetch.*87955000|Codigo=87955000/);
});

test("ANA RHN adapter treats a missing expected station as unavailable without fabricating a zero", () => {
  const snapshot = parseAnaRhnPublicPayload({ features: [] });

  assert.equal(snapshot.status, "unavailable");
  assert.equal(snapshot.rawValue, null);
  assert.equal(snapshot.unit, "cm");
  assert.equal(snapshot.timeZone, "America/Sao_Paulo");
  assert.equal(snapshot.publishableMeasurement, false);
  assert.deepEqual(snapshot.blockingReasons, BLOCKING_REASONS);
  assert.equal(snapshot.verticalReferenceEvidence.status, "unconfirmed");
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
  assert.match(statusSource, /somente como readiness\/cross-check nesta fase/);
  assert.match(statusSource, /duas fontes de coleta do projeto/);
  assert.doesNotMatch(statusSource, /snapshot\.rawValue/);
});

test("normalização do status ANA RHN preserva readiness-only mesmo para cópias antigas", () => {
  assert.match(statusProbeWrapper, /ANA_RHN_PREVIOUS_BLOCKING_COPIES/);
  assert.match(statusProbeWrapper, /ANA_RHN_CURRENT_READINESS_COPY/);
  assert.match(statusProbeWrapper, /somente como readiness\/cross-check nesta fase/);
  assert.match(statusProbeWrapper, /duas fontes de coleta do projeto/);
  assert.match(statusProbeWrapper, /referência vertical permanece não confirmada/);
});
