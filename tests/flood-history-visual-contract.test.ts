import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routes = {
  index: readFileSync("src/routes/historia-das-enchentes-pelotas.tsx", "utf8"),
  1941: readFileSync("src/routes/enchente-1941-pelotas.tsx", "utf8"),
  2001: readFileSync("src/routes/enchente-2001-pelotas.tsx", "utf8"),
  2015: readFileSync("src/routes/enchente-2015-pelotas.tsx", "utf8"),
  2024: readFileSync("src/routes/enchente-2024-pelotas-laranjal.tsx", "utf8"),
} as const;

const indexCss = readFileSync("src/components/history/FloodHistoryIndexPage.css", "utf8");
const hero1941Css = readFileSync("src/components/history/Flood1941Hero.css", "utf8");
const hero2001Css = readFileSync("src/components/history/Flood2001Hero.css", "utf8");
const sharedCss = readFileSync("src/components/history/FloodHistoricalVisualSystem.css", "utf8");
const homeContract2024 = readFileSync("src/components/history/Flood2024HomeContract.css", "utf8");

test("arquivo histórico preserva o shell editorial e a colaboração das páginas dedicadas", () => {
  for (const [name, route] of Object.entries(routes)) {
    assert.match(route, /ContentPageShell/, `${name} deve permanecer no shell editorial compartilhado`);
  }

  for (const year of ["1941", "2001", "2015", "2024"] as const) {
    assert.match(
      routes[year],
      /historicalCollaboration=\{HISTORICAL_COLLABORATION_CONTEXTS\[PAGE_PATH\]\}/,
      `${year} deve preservar o acervo colaborativo`,
    );
    assert.match(routes[year], /showHistoricalCollaborationPrompt=\{false\}/);
  }
});

test("heroes históricos usam superfície editorial full-bleed sem remover o rail de conteúdo", () => {
  for (const css of [hero1941Css, hero2001Css, sharedCss, homeContract2024]) {
    assert.match(css, /\.tp-flood-hero/);
  }

  assert.match(hero1941Css, /width: 100vw/);
  assert.match(hero2001Css, /width: 100vw/);
  assert.match(sharedCss, /width: 100vw/);
  assert.match(homeContract2024, /linear-gradient/);
  assert.match(indexCss, /\.tp-flood-index-hero::before/);
  assert.match(indexCss, /width: 100vw/);
  assert.match(indexCss, /width: min\(1440px, calc\(100% - 96px\)\)/);
});

test("índice histórico mantém os quatro registros como cartões editoriais responsivos", () => {
  assert.match(indexCss, /\.tp-flood-index-grid/);
  assert.match(indexCss, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(indexCss, /\.tp-flood-index-card::before/);
  assert.match(indexCss, /@media \(max-width: 820px\)/);
  assert.match(indexCss, /@media \(max-width: 560px\)/);
  assert.match(indexCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(indexCss, /@media \(forced-colors: active\)/);
});

test("página de 2001 preserva a verificação histórica ANA junto do conteúdo editorial", () => {
  assert.match(routes["2001"], /getAnaRhnHistoricalConsistency/);
  assert.match(routes["2001"], /loader: \(\) => getAnaRhnHistoricalConsistency\(\)/);
  assert.match(routes["2001"], /<AnaRhnHistoricalConsistency data=\{consistency\} \/>/);
});

test("modernização histórica continua aditiva e não cria shell paralelo", () => {
  for (const route of Object.values(routes)) {
    assert.doesNotMatch(route, /<SiteHeader/);
    assert.doesNotMatch(route, /<SiteFooter/);
  }

  assert.doesNotMatch(indexCss, /!important/);
});
