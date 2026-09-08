import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/status-dos-dados.tsx", "utf8");
const styles = readFileSync("src/routes/status-dos-dados.css", "utf8");
const historyStyles = readFileSync("src/routes/status-dos-dados-history.css", "utf8");

test("status hero stays compact and identifies the page as public data transparency", () => {
  assert.match(route, /Transparência dos dados/);
  assert.match(route, /Dados e fontes do Tempo Pelotas/);
  assert.match(route, /Verificação geral/);
  assert.match(styles, /font-size: clamp\(3rem, 4\.6vw, 4\.9rem\)/);
  assert.match(styles, /width: min\(1440px, calc\(100% - 48px\)\)/);
});

test("sources render as open editorial rows instead of a two-column card grid", () => {
  assert.match(route, /data-status-service__identity/);
  assert.match(route, /data-status-service__content/);
  assert.match(route, /data-status-service__meta/);
  assert.match(styles, /\.data-status-services \{\n  border-bottom:/);
  assert.doesNotMatch(styles, /\.data-status-services \{[\s\S]{0,180}grid-template-columns: repeat\(2/);
  assert.match(
    styles,
    /grid-template-columns: minmax\(210px, 0\.72fr\) minmax\(320px, 1\.35fr\) minmax\(190px, 0\.52fr\)/,
  );
  assert.doesNotMatch(route, /data-status-service__dot/);
});

test("data condition has its own editorial line and does not become another status badge", () => {
  assert.match(route, /service\.dataCondition \? \(/);
  assert.match(route, /data-status-service__condition/);
  assert.match(route, /Condição do dado:/);
  assert.match(styles, /\.data-status-service__condition \{/);
  assert.match(styles, /border-top: 1px solid/);
  assert.match(styles, /\.data-status-service__state::before/);
});

test("publication criteria stay at the end after current sources and monitoring history", () => {
  const groupsIndex = route.indexOf("data-status-groups");
  const historyIndex = route.indexOf("data-status-history");
  const explainerIndex = route.indexOf("data-status-explainer");

  assert.ok(groupsIndex > -1);
  assert.ok(historyIndex > groupsIndex);
  assert.ok(explainerIndex > historyIndex);
  assert.match(route, /Como interpretar/);
  assert.match(route, /Critérios de publicação/);
});

test("history uses open strips and rows rather than nested dashboard cards", () => {
  assert.match(historyStyles, /\.data-status-availability-summary \{/);
  assert.match(historyStyles, /border-top: 1px solid/);
  assert.match(historyStyles, /\.data-status-maintenance article \{\n  display: grid/);
  assert.match(historyStyles, /\.data-status-incident dl \{/);
  assert.doesNotMatch(historyStyles, /\.data-status-incident dl \{[\s\S]{0,220}background:/);
});
