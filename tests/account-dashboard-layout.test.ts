import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("src/production/styles/account-dashboard-shell.css", "utf8");
const dashboard = readFileSync("src/components/auth/AccountDashboard.tsx", "utf8");
const navigation = readFileSync("src/components/auth/AccountDashboardNavigation.tsx", "utf8");
const favorites = readFileSync("src/components/auth/AccountFavoritesPanel.tsx", "utf8");
const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");

test("painel autenticado usa workspace amplo com sidebar fixa", () => {
  assert.match(shell, /\.account-app-nav\s*\{[\s\S]*position:\s*fixed/);
  assert.match(shell, /width:\s*264px/);
  assert.match(shell, /\.account-app-main\s*\{[\s\S]*margin-left:\s*264px/);
  assert.match(shell, /\.account-page\.account-dashboard\s*\{[\s\S]*width:\s*min\(1600px, 100%\)/);
  assert.match(dashboard, /className="account-app-shell"/);
  assert.match(dashboard, /AccountDashboardNavigation/);
  assert.doesNotMatch(dashboard, /<SiteHeader|<SiteFooter/);
});

test("workspace reduz densidade editorial e mantém ferramentas em grade", () => {
  assert.match(shell, /\.account-dashboard__topbar/);
  assert.match(shell, /\.account-dashboard__summary[\s\S]*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(shell, /\.account-live__card[\s\S]*min-height:\s*164px/);
  assert.match(shell, /\.account-dashboard__tools-grid[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(shell, /\.account-dashboard__roadmap-grid[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(dashboard, /Observatório Tempo Pelotas|AccountObservatoryProduct/);
  assert.match(dashboard, /Gerador de widgets/);
});

test("favoritos mantêm acompanhamento visível e recolhem o catálogo", () => {
  assert.match(favorites, /<details className="account-favorites__manager">/);
  assert.match(favorites, /Gerenciar favoritos/);
  assert.match(favorites, /account-favorites__catalog/);
  assert.match(shell, /\.account-favorites__manager/);
  assert.match(shell, /\.account-favorites__manager\[open\]/);
});

test("sidebar vira rail no tablet e navegação inferior no celular", () => {
  assert.match(shell, /@media \(max-width: 1180px\)[\s\S]*width:\s*84px/);
  assert.match(shell, /@media \(max-width: 760px\)[\s\S]*\.account-app-nav\s*\{[\s\S]*display:\s*none/);
  assert.match(shell, /\.account-app-mobile-nav[\s\S]*display:\s*grid/);
  assert.match(navigation, /account-app-mobile-nav/);
  assert.match(navigation, /href="#favoritos"/);
  assert.match(navigation, /to="\/observatorio"/);
});

test("refinamento do painel fica no final das duas entradas de estilos", () => {
  const cssImport = '@import "./styles/account-dashboard-shell.css";';
  const tsImport = 'import "./styles/account-dashboard-shell.css";';

  assert.ok(cssEntry.includes(cssImport));
  assert.ok(tsEntry.includes(tsImport));
  assert.equal(cssEntry.trim().split("\n").at(-1), cssImport);
  assert.equal(tsEntry.trim().split("\n").at(-1), tsImport);
});
