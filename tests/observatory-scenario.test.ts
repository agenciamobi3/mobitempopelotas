import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildObservatoryScenarioHash,
  createObservatoryScenario,
  decodeObservatoryScenario,
  encodeObservatoryScenario,
  readObservatoryScenarioHash,
} from "../src/observatory/core/ObservatoryScenario.ts";

const shell = readFileSync("src/observatory/ui/ObservatoryShell.tsx", "utf8");
const viewer = readFileSync("src/observatory/core/ObservatoryViewer.tsx", "utf8");
const runtime = readFileSync("src/observatory/core/observatory-cesium-runtime.ts", "utf8");

const scenario = createObservatoryScenario({
  selectedAt: "2026-09-12T22:20:00.000Z",
  layers: [
    { id: "radar", enabled: true, opacity: 0.72 },
    { id: "satellite", enabled: true, opacity: 0.64 },
    { id: "lightning", enabled: false, opacity: 1 },
    { id: "alerts", enabled: false, opacity: 1 },
    { id: "hydrology", enabled: true, opacity: 1 },
  ],
  camera: {
    longitude: -52.3414,
    latitude: -31.7654,
    height: 620000,
    heading: 8.5,
    pitch: -75,
    roll: 0,
  },
});

test("cenário serializa tempo, camadas, opacidade e câmera sem depender do servidor", () => {
  const encoded = encodeObservatoryScenario(scenario);
  const decoded = decodeObservatoryScenario(encoded);

  assert.deepEqual(decoded, scenario);
  assert.equal(readObservatoryScenarioHash(buildObservatoryScenarioHash(scenario))?.version, 1);
});

test("decoder falha fechado para payload inválido ou versão desconhecida", () => {
  assert.equal(decodeObservatoryScenario("%7Bnao-json"), null);
  assert.equal(decodeObservatoryScenario(encodeURIComponent(JSON.stringify({ v: 99, l: [] }))), null);
  assert.equal(readObservatoryScenarioHash("#outra-coisa=1"), null);
});

test("estado compartilhado aceita apenas IDs canônicos e normaliza limites", () => {
  const decoded = decodeObservatoryScenario(
    encodeURIComponent(
      JSON.stringify({
        v: 1,
        l: [
          ["radar", 1, 4],
          ["camada-inventada", 1, 0.4],
        ],
        c: [-999, 999, 999999999, 999, -999, 999],
      }),
    ),
  );

  assert.ok(decoded);
  assert.equal(decoded.layers.find((layer) => layer.id === "radar")?.opacity, 1);
  assert.equal(decoded.layers.some((layer) => layer.id === ("camada-inventada" as never)), false);
  assert.deepEqual(decoded.camera, {
    longitude: -180,
    latitude: 90,
    height: 10000000,
    heading: 360,
    pitch: -90,
    roll: 180,
  });
});

test("shell oferece link compartilhável e restaura o mesmo contexto ao abrir", () => {
  assert.match(shell, /Compartilhar cenário atual do Observatório/);
  assert.match(shell, /readObservatoryScenarioHash\(window\.location\.hash\)/);
  assert.match(shell, /buildObservatoryScenarioHash\(scenario\)/);
  assert.match(shell, /requestedTimelineAtRef/);
  assert.match(shell, /cameraRestoreState=\{cameraRestoreState\}/);
});

test("viewer e runtime transportam a posição real da câmera Cesium", () => {
  assert.match(runtime, /getCameraState/);
  assert.match(runtime, /setCameraState/);
  assert.match(runtime, /subscribeCameraChange/);
  assert.match(runtime, /widget\.camera\.moveEnd\.addEventListener/);
  assert.match(viewer, /runtime\.subscribeCameraChange/);
  assert.match(viewer, /runtime\.setCameraState\(cameraRestoreState\)/);
});
