import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const details = readFileSync("src/components/weather/InmetAlertCoverageDetails.tsx", "utf8");
const styles = readFileSync("src/components/weather/InmetAlertCoverageDetails.css", "utf8");

test("detailed coverage keeps active alerts first and then prioritizes direct Pelotas scope", () => {
  assert.match(details, /if \(left\.period !== right\.period\) return left\.period === "active" \? -1 : 1/);
  assert.match(details, /const relevance = \{ pelotas: 2, regional: 1, state: 0 \} as const/);

  const sortingStart = details.indexOf("function sortedAlerts");
  const sortingEnd = details.indexOf("export function InmetAlertCoverageDetails", sortingStart);
  const sorting = details.slice(sortingStart, sortingEnd);
  assert.ok(sorting.indexOf("left.relevance") < sorting.indexOf("priority[right.severity]"));
});

test("collapsed alert summaries expose scope before users open long municipality lists", () => {
  assert.match(details, /Pelotas citada diretamente/);
  assert.match(details, /Abrangência regional relevante/);
  assert.match(details, /Abrangência estadual relevante/);
  assert.match(details, /\{scopeLabel\(alert\)\} · \{placeCount\(alert\)\}/);
});

test("coverage detail preserves publication, validity, municipality list and official source link", () => {
  assert.match(details, /<dt>Publicado<\/dt>/);
  assert.match(details, /<dt>Início<\/dt>/);
  assert.match(details, /<dt>Término<\/dt>/);
  assert.match(details, /Municípios identificados no aviso/);
  assert.match(details, /Descrição oficial da área/);
  assert.match(details, /Conferir aviso no INMET/);
});

test("coverage presentation is an open editorial list rather than nested cards", () => {
  assert.match(styles, /\.inmet-alert-coverage-details \{[\s\S]*border:\s*0/);
  assert.match(styles, /\.inmet-alert-coverage-details__list[\s\S]*border-top:/);
  assert.match(styles, /details \{[\s\S]*border-bottom:/);
  assert.match(styles, /details\.is-potential/);
  assert.match(styles, /details\.is-danger/);
  assert.match(styles, /details\.is-great-danger/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.doesNotMatch(styles, /radial-gradient|linear-gradient/);
  assert.doesNotMatch(styles, /box-shadow:\s*(?!none)/);
});
