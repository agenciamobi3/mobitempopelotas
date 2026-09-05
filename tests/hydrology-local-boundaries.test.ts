import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/situacao-hidrologica-pelotas.tsx", "utf8");
const deferredMap = readFileSync("src/components/hydrology/HydrologyMapDeferred.tsx", "utf8");
const saceContext = readFileSync("src/components/hydrology/SaceGuaibaContext.tsx", "utf8");
const defesaCivil = readFileSync("src/components/hydrology/DefesaCivilHydroNetwork.tsx", "utf8");
const saceMap = readFileSync("src/components/hydrology/SaceGuaibaMap.tsx", "utf8");
const defesaMap = readFileSync("src/components/hydrology/DefesaCivilHydroMap.tsx", "utf8");

test("hydrology overview isolates regional sections from the root route boundary", () => {
  assert.match(route, /HydrologySectionBoundary/);
  assert.match(route, /label="Painel regional de hidrologia"/);
  assert.match(route, /label="Rede da Defesa Civil RS"/);
  assert.match(route, /recoverWeatherAfterHydration=\{false\}/);
});

test("interactive hydrology maps require an explicit user request", () => {
  assert.match(deferredMap, /const \[requested, setRequested\] = useState\(false\)/);
  assert.match(deferredMap, /Carregar mapa/);
  assert.match(deferredMap, /HydrologyMapErrorBoundary/);
  assert.match(saceContext, /<HydrologyMapDeferred/);
  assert.match(defesaCivil, /<HydrologyMapDeferred/);
});

test("MapLibre callbacks remain locally contained after opt-in", () => {
  assert.match(saceMap, /Mapa SACE isolado após falha no carregamento/);
  assert.match(saceMap, /Mapa SACE isolado após falha de atualização/);
  assert.match(defesaMap, /Mapa da Defesa Civil isolado após falha no carregamento/);
  assert.match(defesaMap, /Mapa da Defesa Civil isolado após falha de atualização/);
});
