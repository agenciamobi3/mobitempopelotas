import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/enchente-1941-pelotas.tsx", "utf8");
const page = readFileSync("src/components/history/Flood1941HistoricalPage.tsx", "utf8");
const styles = readFileSync("src/components/history/Flood1941HistoricalPage.css", "utf8");
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

test("page explains the 2.88 m finding in direct language without changing its meaning", () => {
  assert.match(page, /Praça do Porto/);
  assert.match(page, /antigo prédio da Alfândega/);
  assert.match(page, /mapa de 1940/);
  assert.match(page, /não significa que\s+havia 2,88 m de água em todas as ruas ou casas/);
  assert.match(page, /onde e como cada nível foi medido/);
});

test("1941 page keeps the main reading simple instead of stacking a second explainer", () => {
  assert.doesNotMatch(route, /FloodVisitorGuide/);
  assert.match(page, /Partes de Pelotas ficaram alagadas por semanas/);
  assert.match(page, /Nem todos os dias de 1941 têm registros preservados/);
  assert.doesNotMatch(page, /referência altimétrica|documento cartográfico|território urbano|telemetria|registros operacionais muito mais densos/i);
});

test("1941 uses restrained visual cues to separate information without replacing text", () => {
  assert.match(route, /internal-weather-shell--flood-1941/);
  assert.match(page, /from "lucide-react"/);
  assert.match(page, /tp-flood-1941-fact__label/);
  assert.match(page, /tp-flood-1941-method/);
  assert.match(page, /tp-flood-1941-event-icon/);
  assert.match(page, /tp-flood-1941-comparison-list/);
  assert.match(page, /tp-flood-1941-source-link/);
  assert.match(styles, /\.tp-flood-1941-method/);
  assert.match(styles, /\.tp-flood-1941-event-icon/);
  assert.match(styles, /\.tp-flood-1941-comparison-list/);
  assert.match(styles, /\.tp-flood-1941-source-link/);
  assert.match(styles, /internal-weather-shell--flood-1941 \.tp-history-collab__grid article/);
});

test("1941 and 2024 are linked without collapsing station references", () => {
  assert.match(page, /12 de maio de 2024/);
  assert.match(page, /15 de maio/);
  assert.match(page, /Números medidos em\s+outros lugares não podem ser comparados diretamente/);
  assert.match(page, /\/enchente-2024-pelotas-laranjal/);
  assert.match(page2024, /\/enchente-1941-pelotas/);
  assert.match(page, /\/nivel-da-lagoa-dos-patos-laranjal/);
  assert.match(page, /\/nivel-do-guaiba/);
});
