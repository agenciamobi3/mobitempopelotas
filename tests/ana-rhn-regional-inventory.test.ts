import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildAnaRhnRegionalInventoryUrl,
  parseAnaRhnRegionalInventoryPayload,
} from "../src/lib/hydrology/ana-rhn-regional.server.ts";

const route = readFileSync("src/routes/situacao-hidrologica-pelotas.tsx", "utf8");
const loader = readFileSync("src/lib/hydrology/public-hydrology-page-loader.ts", "utf8");
const component = readFileSync("src/components/hydrology/AnaRhnRegionalStations.tsx", "utf8");
const map = readFileSync("src/components/hydrology/AnaRhnRegionalMap.tsx", "utf8");

const sanitizedInventoryPayload = {
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
        RegistradorNivel: "Não",
        PluviometroConvencional: "Não",
        RegistradorChuva: "Não",
        EstacaoTelemetrica: "Sim",
      },
      geometry: { x: -52.226, y: -31.764 },
    },
    {
      attributes: {
        Codigo: 102,
        CodigoAdicional: "87950000",
        Nome: "PELOTAS",
        TipoEstacao: "Fluviométrica",
        Operando: "Sim",
        Latitude: -31.7,
        Longitude: -52.3,
        AreaDrenagem: 1200,
        Bacia: "ATLÂNTICO, TRECHO SUDESTE",
        SubBacia: "LAGOA DOS PATOS",
        Rio: "CANAL SÃO GONÇALO",
        UF: "RS",
        Municipio: "PELOTAS",
        Responsavel: "AGÊNCIA NACIONAL DE ÁGUAS",
        ResponsavelSigla: "ANA",
        Operadora: "SERVIÇO GEOLÓGICO DO BRASIL",
        OperadoraSigla: "SGB",
        EscalaNivel: "Sim",
        RegistradorNivel: "Sim",
        PluviometroConvencional: "Sim",
        RegistradorChuva: "Sim",
        EstacaoTelemetrica: "Não",
      },
      geometry: { x: -52.3, y: -31.7 },
    },
  ],
};

test("regional ANA inventory uses the public HTTPS FeatureServer without credentials", () => {
  const url = buildAnaRhnRegionalInventoryUrl();

  assert.equal(url.protocol, "https:");
  assert.equal(url.hostname, "portal1.snirh.gov.br");
  assert.equal(url.searchParams.get("distance"), "180");
  assert.equal(url.searchParams.get("units"), "esriSRUnit_Kilometer");
  assert.equal(url.searchParams.get("returnGeometry"), "true");
  assert.equal(url.searchParams.get("f"), "json");
  assert.equal(url.searchParams.has("token"), false);
  assert.equal(url.searchParams.has("api_key"), false);
  assert.equal(url.username, "");
  assert.equal(url.password, "");
});

test("regional ANA inventory preserves real station metadata and instruments", () => {
  const data = parseAnaRhnRegionalInventoryPayload(
    sanitizedInventoryPayload,
    "2026-09-08T19:00:00.000Z",
  );

  assert.equal(data.status, "live");
  assert.equal(data.stations.length, 2);
  assert.equal(data.stations[0]?.municipality, "PELOTAS");
  assert.equal(data.stations[0]?.operating, true);
  assert.ok(data.stations.some((station) => station.code === "87955001"));

  const laranjal = data.stations.find((station) => station.code === "87955001");
  assert.equal(laranjal?.responsible, "UFPEL");
  assert.equal(laranjal?.operator, "UFPEL");
  assert.deepEqual(laranjal?.instruments, ["Telemetria"]);

  const saoGoncalo = data.stations.find((station) => station.code === "87950000");
  assert.equal(saoGoncalo?.river, "CANAL SÃO GONÇALO");
  assert.deepEqual(saoGoncalo?.instruments, [
    "Régua de nível",
    "Registrador de nível",
    "Pluviômetro",
    "Registrador de chuva",
  ]);
});

test("regional ANA inventory never becomes a measurement source for Laranjal", () => {
  const server = readFileSync("src/lib/hydrology/ana-rhn-regional.server.ts", "utf8");

  assert.doesNotMatch(server, /currentLevel|rawValue|publishableMeasurement|historical_measurements/);
  assert.doesNotMatch(server, /supabase/);
  assert.match(component, /não substitui a leitura atual do Laranjal/);
});

test("hydrology overview loads and renders ANA inventory only when useful", () => {
  assert.match(loader, /getAnaRhnRegionalInventory/);
  assert.match(loader, /anaRhnRegional:/);
  assert.match(route, /data=\{data\.anaRhnRegional\}/);
  assert.match(route, /hydrography=\{data\.anaRhnHydrography\}/);
  assert.match(component, /if \(data\.status !== "live" \|\| data\.stations\.length === 0\) return null/);
  assert.match(component, /Estações oficiais na região de Pelotas/);
  assert.match(component, /Instrumentos cadastrados:/);
  assert.match(component, /Como interpretar esta seção/);
});

test("regional ANA stations use the existing MapLibre stack and keep list fallback", () => {
  assert.match(component, /AnaRhnRegionalMap stations=\{data\.stations\} hydrography=\{hydrography\}/);
  assert.match(map, /import\("maplibre-gl"\)/);
  assert.match(map, /tiles\.openfreemap\.org\/styles\/liberty/);
  assert.match(map, /ANA \/ SNIRH \/ Rede Hidrometeorológica Nacional/);
  assert.match(map, /As estações e seus dados cadastrais continuam disponíveis logo abaixo/);
  assert.match(map, /PELOTAS: \[number, number\] = \[-52\.3371, -31\.7719\]/);
});
