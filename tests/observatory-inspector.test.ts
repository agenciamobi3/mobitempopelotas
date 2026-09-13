import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  normalizeObservatoryInspectorPoint,
  OBSERVATORY_INSPECTOR_BOUNDS,
  selectObservatoryInspectorHour,
  type ObservatoryInspectorHour,
} from "../src/observatory/core/ObservatoryInspector.ts";

const accessFunctions = readFileSync("src/observatory/data/observatory-access.functions.ts", "utf8");
const inspectorFunctions = readFileSync("src/observatory/data/observatory-inspector.functions.ts", "utf8");
const runtime = readFileSync("src/observatory/core/observatory-cesium-runtime.ts", "utf8");
const viewer = readFileSync("src/observatory/core/ObservatoryViewer.tsx", "utf8");
const shell = readFileSync("src/observatory/ui/ObservatoryShell.tsx", "utf8");
const panel = readFileSync("src/observatory/ui/ObservatoryInspectorPanel.tsx", "utf8");

function hour(timestamp: string): ObservatoryInspectorHour {
  return {
    timestamp,
    temperatureC: 20,
    apparentTemperatureC: 20,
    relativeHumidityPercent: 70,
    dewPointC: 14,
    pressureHpa: 1015,
    precipitationProbabilityPercent: 20,
    precipitationMm: 0,
    cloudCoverPercent: 40,
    windSpeedKmh: 15,
    windGustKmh: 28,
    windDirectionDegrees: 90,
  };
}

test("inspetor limita o proxy meteorológico à região definida e normaliza coordenadas", () => {
  assert.deepEqual(OBSERVATORY_INSPECTOR_BOUNDS, {
    south: -35.5,
    north: -28,
    west: -57.5,
    east: -48.5,
  });
  assert.deepEqual(
    normalizeObservatoryInspectorPoint({ latitude: -31.771512, longitude: -52.236104 }),
    { latitude: -31.7715, longitude: -52.2361 },
  );
  assert.equal(
    normalizeObservatoryInspectorPoint({ latitude: -23.5, longitude: -46.6 }),
    null,
  );
});

test("inspetor usa o último horário modelado que não esteja no futuro do relógio selecionado", () => {
  const hours = [
    hour("2026-09-13T00:00:00.000Z"),
    hour("2026-09-13T01:00:00.000Z"),
    hour("2026-09-13T02:00:00.000Z"),
  ];

  assert.equal(
    selectObservatoryInspectorHour(hours, "2026-09-13T01:34:00.000Z")?.timestamp,
    "2026-09-13T01:00:00.000Z",
  );
  assert.equal(
    selectObservatoryInspectorHour(hours, "2026-09-12T23:30:00.000Z"),
    null,
  );
  assert.equal(selectObservatoryInspectorHour(hours, "horário-inválido"), null);
});

test("consulta do ponto é protegida pelo mesmo gate PRO do Observatório", () => {
  assert.match(accessFunctions, /export async function resolveObservatoryAccessForRequest/);
  assert.match(inspectorFunctions, /resolveObservatoryAccessForRequest/);
  assert.match(inspectorFunctions, /access\.status !== "authenticated" \|\| !access\.allowed/);
  assert.match(inspectorFunctions, /status: "forbidden"/);
  assert.match(inspectorFunctions, /OBSERVATORY_INSPECTOR_BOUNDS/);
});

test("runtime converte clique no globo em latitude e longitude sem criar segundo viewer", () => {
  assert.match(runtime, /ScreenSpaceEventHandler/);
  assert.match(runtime, /ScreenSpaceEventType\.LEFT_CLICK/);
  assert.match(runtime, /widget\.camera\.getPickRay/);
  assert.match(runtime, /widget\.scene\.globe\.pick/);
  assert.match(runtime, /Cartographic\.fromCartesian/);
  assert.equal((runtime.match(/new CesiumWidget\(/g) ?? []).length, 1);
});

test("viewer assina clique somente quando a ferramenta está ativa e marca o ponto selecionado", () => {
  assert.match(viewer, /subscribeMapClick/);
  assert.match(viewer, /onInspectPointRef\.current\?\.\(point\)/);
  assert.match(viewer, /INSPECTOR_MARKER_LAYER_ID/);
  assert.match(viewer, /label: "Ponto inspecionado"/);
});

test("UI separa explicitamente modelo de observação e desativa o inspetor no comparador", () => {
  assert.match(shell, /Inspecionar ponto/);
  assert.match(shell, /disabled=\{Boolean\(comparisonState\)\}/);
  assert.match(shell, /setInspectorEnabled\(false\)/);
  assert.match(panel, /Dados modelados para este local/);
  assert.match(panel, /Não são uma medição feita por estação meteorológica/);
  assert.match(panel, /Previsão por modelo para o ponto selecionado/);
});
