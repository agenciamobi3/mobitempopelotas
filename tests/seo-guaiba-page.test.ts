import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeSource = readFileSync(
  new URL("../src/routes/nivel-do-guaiba.tsx", import.meta.url),
  "utf8",
);
const loaderSource = readFileSync(
  new URL("../src/lib/hydrology/public-hydrology-page-loader.ts", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../src/components/hydrology/GuaibaLevelPage.tsx", import.meta.url),
  "utf8",
);
const publicRoutesSource = readFileSync(
  new URL("../src/lib/public-routes.ts", import.meta.url),
  "utf8",
);

test("publica uma única URL canônica para a intenção nível do Guaíba", () => {
  assert.match(routeSource, /const PAGE_PATH = "\/nivel-do-guaiba"/);
  assert.match(routeSource, /createFileRoute\("\/nivel-do-guaiba"\)/);
  assert.match(publicRoutesSource, /path: "\/nivel-do-guaiba"/);
  assert.doesNotMatch(publicRoutesSource, /nivel-do-guaiba-hoje/);
  assert.doesNotMatch(publicRoutesSource, /nivel-guaiba-porto-alegre/);
});

test("protege a página contra rejeição de transporte da server function", () => {
  assert.match(routeSource, /loadGuaibaPageData/);
  assert.match(routeSource, /loader: \(\) => loadGuaibaPageData\(\)/);
  assert.match(loaderSource, /export async function loadGuaibaPageData/);
  assert.match(loaderSource, /await getGuaibaObservation\(\)/);
  assert.match(loaderSource, /createUnavailableGuaibaObservationData\(\)/);
  assert.match(loaderSource, /status: "unavailable"/);
  assert.match(loaderSource, /currentLevel: null/);
});

test("separa Cais Mauá e Gasômetro como referências próprias", () => {
  assert.match(routeSource, /Cais Mauá e Gasômetro são réguas diferentes/);
  assert.match(routeSource, /cada uma mantém a própria régua e cota/);
  assert.match(pageSource, /referência pertence a esta régua/);
  assert.match(pageSource, /Cais Mauá e Gasômetro mantêm referências próprias/);
});

test("não transforma leitura do Guaíba em diagnóstico automático para Pelotas", () => {
  assert.match(routeSource, /não confirma risco de enchente em Pelotas/);
  assert.match(pageSource, /não deve ser convertida em diagnóstico de risco para Pelotas/);
  assert.doesNotMatch(routeSource, /Pelotas está segura/i);
  assert.doesNotMatch(routeSource, /sem risco de enchente/i);
  assert.doesNotMatch(pageSource, /nível normal em Pelotas/i);
});

test("preserva horário, atraso e fonte na primeira leitura", () => {
  assert.match(pageSource, /statusLabel\(data\.status\)/);
  assert.match(pageSource, /formatDateTime\(data\.updatedAt\)/);
  assert.match(pageSource, /formatAge\(data\.ageMinutes\)/);
  assert.match(pageSource, /Fonte da leitura selecionada/);
});
