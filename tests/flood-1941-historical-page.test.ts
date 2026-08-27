import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/enchente-1941-pelotas.tsx", "utf8");
const page = readFileSync("src/components/history/Flood1941HistoricalPage.tsx", "utf8");
const page2024 = readFileSync("src/components/history/Flood2024HistoricalPage.tsx", "utf8");
const content = readFileSync("src/lib/content/flood-1941-pelotas.ts", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");

test("1941 flood record is a public canonical editorial route", () => {
  assert.match(route, /createFileRoute\("\/enchente-1941-pelotas"\)/);
  assert.match(route, /Enchente de 1941 em Pelotas: fotos, nível e história/);
  assert.match(route, /createEditorialPageJsonLd/);
  assert.match(publicRoutes, /\/enchente-1941-pelotas/);
});

test("historical claims stay tied to documented evidence", () => {
  assert.match(content, /2,88 m/);
  assert.match(content, /61 fotos/);
  assert.match(content, /17 e 18 de maio de 1941/);
  assert.match(content, /Início de junho de 1941/);
  assert.match(content, /Universidade Católica de Pelotas/);
  assert.match(content, /Universidade Federal de Pelotas/);
  assert.match(content, /Prefeitura Municipal de Pelotas/);
});

test("page explains how the 2.88 m reference was reconstructed", () => {
  assert.match(page, /Praça do Porto/);
  assert.match(page, /antigo prédio da Alfândega/);
  assert.match(page, /mapa de 1940/);
  assert.match(page, /não deve ser transferida automaticamente/);
});

test("1941 and 2024 are linked without collapsing station references", () => {
  assert.match(page, /12 de maio de 2024/);
  assert.match(page, /15 de maio/);
  assert.match(page, /níveis de estações diferentes não devem ser convertidos/);
  assert.match(page, /\/enchente-2024-pelotas-laranjal/);
  assert.match(page2024, /\/enchente-1941-pelotas/);
  assert.match(page, /\/nivel-da-lagoa-dos-patos-laranjal/);
  assert.match(page, /\/nivel-do-guaiba/);
});
