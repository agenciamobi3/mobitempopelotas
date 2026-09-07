import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const guide = readFileSync("src/components/history/FloodVisitorGuide.tsx", "utf8");
const page1941 = readFileSync("src/components/history/Flood1941HistoricalPage.tsx", "utf8");
const indexPage = readFileSync("src/components/history/FloodHistoryIndexPage.tsx", "utf8");
const agents = readFileSync("AGENTS.md", "utf8");
const routes = new Map([
  ["1941", readFileSync("src/routes/enchente-1941-pelotas.tsx", "utf8")],
  ["2001", readFileSync("src/routes/enchente-2001-pelotas.tsx", "utf8")],
  ["2015", readFileSync("src/routes/enchente-2015-pelotas.tsx", "utf8")],
  ["2024", readFileSync("src/routes/enchente-2024-pelotas-laranjal.tsx", "utf8")],
]);

test("1941 simplifies the page itself instead of stacking a generic visitor guide", () => {
  const route1941 = routes.get("1941");
  assert.ok(route1941);
  assert.doesNotMatch(route1941, /FloodVisitorGuide/);
  assert.match(page1941, /Em 1941, uma grande enchente deixou ruas/);
  assert.match(page1941, /Esse número não significa que\s+havia 2,88 m de água em todas as ruas ou casas/);
});

test("other flood pages keep their current visitor-first explanation until their own copy review", () => {
  for (const year of ["2001", "2015", "2024"] as const) {
    const route = routes.get(year);
    assert.ok(route);
    assert.match(route, /FloodVisitorGuide/);
    assert.match(route, new RegExp(`<FloodVisitorGuide year="${year}" \\/>`));
  }
});

test("visitor guide still protects the 2001 measurement discrepancy", () => {
  assert.match(guide, /2,90 m e 1,90 m para o mesmo dia/);
  assert.match(guide, /Isso não é um erro do site/);
  assert.match(guide, /diferença de 1 metro/);
  assert.match(guide, /mostramos os dois/);
});

test("history index invites ordinary visitors before research terminology", () => {
  assert.match(indexPage, /você não precisa\s+entender de meteorologia ou hidrologia para começar/);
  assert.match(indexPage, /“2,20 m” ou “3,04 m” normalmente é a leitura de uma régua/);
  assert.match(indexPage, /não\s+a altura da água em todas as casas/);
  assert.match(indexPage, /Quando dois documentos discordam, mostramos a diferença/);
});

test("AGENTS documents simple adult copy without institutional distance or over-explaining", () => {
  assert.match(agents, /acessível|autonomia de leitura equivalente à 6ª série/i);
  assert.match(agents, /isso não significa infantilizar o texto/i);
  assert.match(agents, /não empilhe uma camada "para leigos"/i);
  assert.match(agents, /A MOBI e o Tempo Pelotas fazem parte da comunidade local/i);
  assert.match(agents, /uma explicação não deve exigir outra explicação/i);
});
