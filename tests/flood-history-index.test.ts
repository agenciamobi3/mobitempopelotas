import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/historia-das-enchentes-pelotas.tsx", "utf8");
const page = readFileSync("src/components/history/FloodHistoryIndexPage.tsx", "utf8");
const styles = readFileSync("src/components/history/FloodHistoryIndexPage.css", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");
const header = readFileSync("src/production/components/home-editorial-header.tsx", "utf8");
const footer = readFileSync("src/components/layout/Footer.tsx", "utf8");

test("flood history hub has canonical editorial route and research framing", () => {
  assert.match(route, /createFileRoute\("\/historia-das-enchentes-pelotas"\)/);
  assert.match(route, /História das enchentes em Pelotas: 1941, 2001, 2015 e 2024/);
  assert.match(route, /createEditorialPageJsonLd/);
  assert.match(page, /Arquivo climático e hidrológico de Pelotas/);
  assert.match(page, /Para trabalhos e pesquisas/);
  assert.match(page, /estudantes, moradores e pesquisadores/);
});

test("hub exposes every dedicated flood record and preserves 2001 research status", () => {
  for (const path of [
    "/enchente-1941-pelotas",
    "/enchente-2001-pelotas",
    "/enchente-2015-pelotas",
    "/enchente-2024-pelotas-laranjal",
  ]) {
    assert.match(page, new RegExp(path.replaceAll("/", "\\/")));
  }
  assert.match(page, /Pesquisa em andamento/);
  assert.match(page, /não precise começar por arqueologia\s+digital/);
});

test("hub teaches source and gauge caveats instead of flattening historical data", () => {
  assert.match(page, /fonte oficial, imprensa contemporânea, pesquisa\s+acadêmica/);
  assert.match(page, /não compare cotas de anos diferentes sem saber estação, régua, datum e referência/);
  assert.match(page, /não foi localizada, a lacuna permanece identificada/);
});

test("hub is indexable and discoverable from water navigation", () => {
  assert.match(publicRoutes, /path: "\/historia-das-enchentes-pelotas"/);
  assert.match(header, /label: "História das enchentes"/);
  assert.match(footer, /label: "História das enchentes"/);
  assert.match(page, /href="\/contribuir"/);
});

test("hub uses the current home-editorial rail and a full-bleed historical hero", () => {
  assert.match(styles, /width: min\(1440px, calc\(100% - 96px\)\)/);
  assert.match(styles, /\.tp-flood-index-hero::before/);
  assert.match(styles, /width: 100vw/);
  assert.match(styles, /linear-gradient\(105deg, #f1fbfc 0%, #f8fbfb 47%, #faf8ff 78%, #f3f0ff 100%\)/);
  assert.match(styles, /\.tp-flood-index-card::before/);
  assert.match(styles, /linear-gradient\(90deg, #18bdcd, #5e2ced 72%, transparent\)/);
});

test("hub layout remains responsive and accessible without hidden desktop-only content", () => {
  assert.match(styles, /\.tp-flood-index-grid/);
  assert.match(styles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 820px\)/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /grid-template-columns: 1fr/);
  assert.match(styles, /min-height: 44px/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(styles, /!important/);
});
