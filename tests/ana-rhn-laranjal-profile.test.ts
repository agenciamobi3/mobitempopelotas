import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildAnaRhnLaranjalStationProfileUrl,
  parseAnaRhnLaranjalStationProfilePayload,
} from "../src/lib/hydrology/ana-rhn-laranjal-profile.server.ts";

const server = readFileSync("src/lib/hydrology/ana-rhn-laranjal-profile.server.ts", "utf8");
const component = readFileSync(
  "src/components/hydrology/AnaRhnLaranjalStationProfile.tsx",
  "utf8",
);
const loader = readFileSync("src/lib/hydrology/public-hydrology-page-loader.ts", "utf8");
const route = readFileSync("src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx", "utf8");

const sanitizedProfilePayload = {
  features: [
    {
      attributes: {
        Codigo: 101,
        CodigoAdicional: "87955001",
        Nome: "LARANJAL",
        TipoEstacao: "Fluviométrica",
        Operando: "Sim",
        Latitude: -31.764,
        Longitude: -52.226,
        Altitude: null,
        AreaDrenagem: null,
        Bacia: "ATLÂNTICO, TRECHO SUDESTE",
        SubBacia: "LAGOA DOS PATOS",
        Rio: "LAGOA DOS PATOS",
        UF: "RS",
        Municipio: "PELOTAS",
        Responsavel: "UNIVERSIDADE FEDERAL DE PELOTAS",
        ResponsavelSigla: "UFPEL",
        Operadora: "UNIVERSIDADE FEDERAL DE PELOTAS",
        OperadoraSigla: "UFPEL",
        EscalaNivel: "Não",
        EscalaNivelInicio: null,
        EscalaNivelFim: null,
        RegistradorNivel: "Não",
        RegistradorNivelInicio: null,
        RegistradorNivelFim: null,
        EstacaoTelemetrica: "Sim",
        EstacaoTelemetricaInicio: 1780876800000,
        EstacaoTelemetricaFim: null,
        Descricao: "LARANJAL TELEMÉTRICA",
        DataAlteracao: 1780876800000,
      },
    },
  ],
};

test("87955001 profile uses exact public inventory query without credentials", () => {
  const url = buildAnaRhnLaranjalStationProfileUrl();

  assert.equal(url.protocol, "https:");
  assert.equal(url.hostname, "portal1.snirh.gov.br");
  assert.equal(url.searchParams.get("where"), "CodigoAdicional='87955001'");
  assert.equal(url.searchParams.get("returnGeometry"), "false");
  assert.equal(url.searchParams.get("resultRecordCount"), "1");
  assert.equal(url.searchParams.get("f"), "json");
  assert.equal(url.searchParams.has("token"), false);
  assert.equal(url.searchParams.has("api_key"), false);
});

test("87955001 profile preserves concrete ANA inventory metadata", () => {
  const profile = parseAnaRhnLaranjalStationProfilePayload(
    sanitizedProfilePayload,
    "2026-09-08T20:30:00.000Z",
  );

  assert.equal(profile.status, "live");
  assert.equal(profile.code, "87955001");
  assert.equal(profile.name, "LARANJAL");
  assert.equal(profile.description, "LARANJAL TELEMÉTRICA");
  assert.equal(profile.stationType, "Fluviométrica");
  assert.equal(profile.operating, true);
  assert.equal(profile.municipality, "PELOTAS");
  assert.equal(profile.state, "RS");
  assert.equal(profile.river, "LAGOA DOS PATOS");
  assert.equal(profile.responsible, "UFPEL");
  assert.equal(profile.operator, "UFPEL");
  assert.deepEqual(profile.instruments.map((instrument) => instrument.label), ["Telemetria"]);
});

test("station profile is cadastral only and never requests a level measurement", () => {
  const url = buildAnaRhnLaranjalStationProfileUrl();
  const outFields = url.searchParams.get("outFields") ?? "";

  assert.doesNotMatch(outFields, /Ult_Dado|Data_ult_dado|Status_Dado|Parametro/);
  assert.doesNotMatch(server, /rawValue|currentLevel|publishableMeasurement|historical_measurements/);
  assert.doesNotMatch(server, /supabase/i);
});

test("profile fails closed when the exact station is absent", () => {
  const profile = parseAnaRhnLaranjalStationProfilePayload({ features: [] });

  assert.equal(profile.status, "not-found");
  assert.equal(profile.instruments.length, 0);
});

test("Laranjal page loads the ANA profile inside the hydrology dependency budget", () => {
  assert.match(loader, /getAnaRhnLaranjalStationProfile/);
  assert.match(loader, /createUnavailableAnaRhnLaranjalStationProfile/);
  assert.match(loader, /anaRhnProfile:/);
  assert.match(route, /AnaRhnLaranjalStationProfile data=\{data\.anaRhnProfile\}/);
  assert.match(component, /if \(data\.status !== "live"\) return null/);
});

test("visitor copy uses the real station profile instead of generic ANA implementation copy", () => {
  assert.match(component, /Estação 87955001 no cadastro da ANA/);
  assert.match(component, /Responsável/);
  assert.match(component, /Operadora/);
  assert.match(component, /Equipamentos cadastrados/);
  assert.match(component, /não acrescenta uma terceira\s+leitura/);
  assert.match(component, /referência vertical não estiver confirmada/);
  assert.doesNotMatch(route, /OfficialDataAccessNotice/);
  assert.doesNotMatch(route, /acesso autorizado|integração em implantação/i);
});
