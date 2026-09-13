import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("src/production/styles/account-dashboard-shell.css", "utf8");
const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");

test("painel autenticado usa shell amplo e denso em desktop", () => {
  assert.match(shell, /\.account-page\.account-dashboard\s*\{[\s\S]*width: min\(1780px, 100%\)/);
  assert.match(shell, /\.account-dashboard__hero[\s\S]*#071e2f/);
  assert.match(shell, /\.account-dashboard__summary[\s\S]*gap: 0/);
  assert.match(shell, /\.account-live__card[\s\S]*min-height: 190px/);
  assert.match(shell, /repeat\(auto-fit, minmax\(260px, 1fr\)\)/);
});

test("refinamento do painel fica no final das duas entradas de estilos", () => {
  const cssImport = '@import "./styles/account-dashboard-shell.css";';
  const tsImport = 'import "./styles/account-dashboard-shell.css";';

  assert.ok(cssEntry.includes(cssImport));
  assert.ok(tsEntry.includes(tsImport));
  assert.equal(cssEntry.trim().split("\n").at(-1), cssImport);
  assert.equal(tsEntry.trim().split("\n").at(-1), tsImport);
});
