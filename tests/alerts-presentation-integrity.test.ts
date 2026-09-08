import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("src/components/weather/WeatherAlertsPage.tsx", "utf8");

test("alert priority is local-first inside the same active or upcoming group", () => {
  assert.match(page, /const relevancePriority: Record<InmetAlert\["relevance"\], number>/);
  assert.match(page, /pelotas:\s*2/);
  assert.match(page, /regional:\s*1/);
  assert.match(page, /state:\s*0/);

  const prioritizeStart = page.indexOf("function prioritizeAlerts");
  const prioritizeEnd = page.indexOf("function scopeLabel", prioritizeStart);
  const prioritize = page.slice(prioritizeStart, prioritizeEnd);
  assert.ok(prioritize.indexOf("relevanceDifference") >= 0);
  assert.ok(prioritize.indexOf("severityDifference") > prioritize.indexOf("relevanceDifference"));
});

test("active warnings still outrank future warnings before local sorting is applied", () => {
  assert.match(page, /const active = prioritizeAlerts\(weather\.alerts\.filter\(\(alert\) => alert\.period === "active"\)\)/);
  assert.match(page, /const upcoming = prioritizeAlerts\(weather\.alerts\.filter\(\(alert\) => alert\.period === "upcoming"\)\)/);
  assert.match(page, /const featured = active\[0\] \?\? upcoming\[0\] \?\? null/);
});

test("structured alert coverage does not manufacture Pelotas for broader warnings", () => {
  assert.match(page, /function alertCoverageName/);
  assert.match(page, /alert\.relevance === "regional"\) return "Região Sul do Rio Grande do Sul"/);
  assert.match(page, /return "Rio Grande do Sul"/);
  assert.match(page, /\.\.\.\(alert\.relevance === "pelotas"/);
  assert.match(page, /name: "Município de Pelotas"/);

  const schemaStart = page.indexOf("function alertSchema");
  const schemaEnd = page.indexOf("function AlertsHero", schemaStart);
  const schema = page.slice(schemaStart, schemaEnd);
  assert.doesNotMatch(schema, /municipalities\.join\(", "\) : "Pelotas, RS"/);
});

test("featured warning exposes publication time, explicit scope and territorial details", () => {
  assert.match(page, /<dt>Publicado<\/dt>/);
  assert.match(page, /formatDateTime\(alert\.sentAt\)/);
  assert.match(page, /function scopeLabel/);
  assert.match(page, /Abrangência regional/);
  assert.match(page, /Abrangência estadual/);
  assert.match(page, /href="#abrangencia-oficial-alertas"/);
  assert.match(page, /Ver abrangência detalhada/);
});
