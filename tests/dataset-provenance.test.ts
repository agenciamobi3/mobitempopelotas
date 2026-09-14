import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const historyPage = readFileSync("src/components/history/WeatherHistoryPage.tsx", "utf8");
const hydrologyPage = readFileSync("src/components/hydrology/HydrologyOverviewV2.tsx", "utf8");

for (const [label, source] of [
  ["histórico meteorológico", historyPage],
  ["hidrologia", hydrologyPage],
] as const) {
  test(`Dataset de ${label} publica proveniência e política de uso`, () => {
    assert.match(source, /"@type": "Dataset"/);
    assert.match(source, /creator:/);
    assert.match(source, /publisher:/);
    assert.match(source, /license:/);
    assert.match(source, /status-dos-dados/);
    assert.match(source, /sem relicenciar conteúdo de terceiros/);
    assert.doesNotMatch(source, /creativecommons\.org|CC BY|CC0/);
  });
}
