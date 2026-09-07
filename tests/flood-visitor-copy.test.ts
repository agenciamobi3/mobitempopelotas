import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const guide = readFileSync("src/components/history/FloodVisitorGuide.tsx", "utf8");
const indexPage = readFileSync("src/components/history/FloodHistoryIndexPage.tsx", "utf8");
const routes = new Map([
  ["1941", readFileSync("src/routes/enchente-1941-pelotas.tsx", "utf8")],
  ["2001", readFileSync("src/routes/enchente-2001-pelotas.tsx", "utf8")],
  ["2015", readFileSync("src/routes/enchente-2015-pelotas.tsx", "utf8")],
  ["2024", readFileSync("src/routes/enchente-2024-pelotas-laranjal.tsx", "utf8")],
]);

test("every dedicated flood page starts with a visitor-first explanation", () => {
  for (const [year, route] of routes) {
    assert.match(route, /FloodVisitorGuide/);
    assert.match(route, new RegExp(`<FloodVisitorGuide year="${year}" \\/>`));
  }
});

test("visitor guide explains measurements before exposing technical vocabulary", () => {
  assert.match(guide, /Antes dos detalhes/);
  assert.match(guide, /O que aconteceu/);
  assert.match(guide, /Por que aconteceu/);
  assert.match(guide, /Quem e onde foi afetado/);
  assert.match(guide, /Como ler os números/);
  assert.match(guide, /não a profundidade da inundação em toda a cidade/);
  assert.match(guide, /Dado bruto/);
  assert.match(guide, /dado consistido/);
  assert.match(guide, /réguas diferentes não devem ser comparados como se usassem a mesma escala/);
});

test("2001 discrepancy is translated for a non-technical visitor without hiding either value", () => {
  assert.match(guide, /2,90 m e 1,90 m para o mesmo dia/);
  assert.match(guide, /Isso não é um erro do site/);
  assert.match(guide, /diferença de 1 metro/);
  assert.match(guide, /mostramos os dois/);
});

test("each historical event has an immediate plain-language anchor", () => {
  assert.match(guide, /2,88 m/);
  assert.match(guide, /105 km\/h/);
  assert.match(guide, /299 mm/);
  assert.match(guide, /3,04 m/);
});

test("history index invites ordinary visitors before research terminology", () => {
  assert.match(indexPage, /você não precisa\s+entender de meteorologia ou hidrologia para começar/);
  assert.match(indexPage, /“2,20 m” ou “3,04 m” normalmente é a leitura de uma régua/);
  assert.match(indexPage, /não\s+a altura da água em todas as casas/);
  assert.match(indexPage, /Quando dois documentos discordam, mostramos a diferença/);
});
