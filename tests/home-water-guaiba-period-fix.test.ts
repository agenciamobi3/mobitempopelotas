import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fix = readFileSync("src/production/styles/home-water-guaiba-period-fix.css", "utf8");
const refinements = readFileSync(
  "src/production/styles/home-editorial-status-refinements.css",
  "utf8",
);
const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");

test("marcador 24 h do Guaiba nao herda a escala gigante das setas de tendencia", () => {
  assert.match(refinements, /\.tp-home-water__trend-mark\s*\{[\s\S]*font-size:\s*2\.45rem/);
  assert.match(
    fix,
    /\.tp-home-water__guaiba-reference \.tp-home-water__trend-mark\s*\{[\s\S]*font-size:\s*0\.62rem/,
  );
  assert.match(fix, /height:\s*28px/);
  assert.match(fix, /border-radius:\s*999px/);
});

test("ajuste do Guaiba entra nas duas entradas globais sem mover o refinamento final do painel", () => {
  const cssImport = '@import "./styles/home-water-guaiba-period-fix.css";';
  const tsImport = 'import "./styles/home-water-guaiba-period-fix.css";';

  assert.ok(cssEntry.includes(cssImport));
  assert.ok(tsEntry.includes(tsImport));
  assert.equal(cssEntry.trim().split("\n").at(-1), '@import "./styles/account-dashboard-shell.css";');
  assert.equal(tsEntry.trim().split("\n").at(-1), 'import "./styles/account-dashboard-shell.css";');
});
