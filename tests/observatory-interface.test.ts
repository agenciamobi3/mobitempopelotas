import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("src/observatory/ui/ObservatoryShell.tsx", "utf8");
const viewer = readFileSync("src/observatory/core/ObservatoryViewer.tsx", "utf8");
const runtime = readFileSync("src/observatory/core/observatory-cesium-runtime.ts", "utf8");

test("header do Observatório usa a marca oficial e o menu da conta", () => {
  assert.match(shell, /\/brand\/tempo-pelotas-header\.svg/);
  assert.match(shell, /<h1>Observatório<\/h1>/);
  assert.match(shell, /function ObservatoryAccountMenu/);
  assert.match(shell, /<span>Meu painel<\/span>/);
  assert.match(shell, /to="\/painel"/);
  assert.match(shell, /to="\/conta"/);
  assert.match(shell, /action="\/auth\/signout" method="post"/);
  assert.doesNotMatch(shell, /observatory-shell__pro/);
});

test("copy principal das camadas fala com o visitante sem jargão de infraestrutura", () => {
  assert.match(
    shell,
    /Ative apenas o que deseja visualizar no Globo\. Radar, satélite, raios, alertas e hidrologia\./,
  );
  assert.doesNotMatch(shell, /mesmas fontes oficiais já integradas ao Tempo Pelotas/);
});

test("globo não exibe card técnico de terreno sobre a visualização", () => {
  assert.doesNotMatch(viewer, /observatory-viewer__status/);
  assert.doesNotMatch(viewer, /Relevo 3D · Re:Earth Terrain/);
  assert.doesNotMatch(viewer, /Globo regional pronto/);
  assert.match(viewer, /aria-label="Controles do globo"/);
  assert.match(viewer, /CESIUM_RUNTIME/);
});

test("Observatório restaura e compartilha a visão atual sem expor estado técnico na UI", () => {
  assert.match(shell, /readObservatoryScenarioHash\(window\.location\.hash\)/);
  assert.match(shell, /createObservatoryScenario/);
  assert.match(shell, /buildObservatoryScenarioHash/);
  assert.match(shell, /Compartilhar visão/);
  assert.match(shell, /navigator\.clipboard\.writeText/);
  assert.match(shell, /initialCameraState=\{initialCameraState\}/);
  assert.match(shell, /onCameraStateChange=\{handleCameraStateChange\}/);
  assert.match(viewer, /runtime\.setCameraState\(initialCameraState/);
  assert.match(viewer, /camera\.changed\.addEventListener/);
  assert.match(runtime, /getCameraState/);
  assert.match(runtime, /setCameraState/);
});
