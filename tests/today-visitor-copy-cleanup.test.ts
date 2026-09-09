import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hero = readFileSync("src/components/weather/TodayRetailHero.tsx", "utf8");
const observation = readFileSync("src/components/weather/InternalWeatherWidgets.tsx", "utf8");
const atmosphere = readFileSync("src/components/weather/TodayAtmosphericSignals.tsx", "utf8");

test("today observation identifies Defesa Civil once without per-metric source repetition", () => {
  assert.match(observation, /Medição da Rede Defesa Civil RS/);
  assert.doesNotMatch(observation, /Dados e fontes/);
  assert.doesNotMatch(observation, /function sourceName/);
  assert.doesNotMatch(observation, /metric\.source/);
  assert.match(observation, /Atualizado em/);
});

test("today observed hero removes generic freshness and measurement labels", () => {
  assert.doesNotMatch(hero, /Medição atual/);
  assert.doesNotMatch(hero, /Leitura recente/);
  assert.doesNotMatch(hero, />Leitura atual</);
  assert.doesNotMatch(hero, /Fonte:\s*\{sourceName\}/);
  assert.doesNotMatch(hero, /updateLabel/);

  assert.match(hero, /Previsão da próxima hora/);
  assert.match(hero, /href="\/alertas"/);
  assert.match(hero, /alertLabel\(officialAlertCount\)/);
});

test("today atmospheric footer keeps the useful signal without technical provider label", () => {
  assert.doesNotMatch(atmosphere, /Previsão horária:/);
  assert.doesNotMatch(atmosphere, /modelLabel/);
  assert.match(atmosphere, /A pressão deve/);
  assert.match(atmosphere, /Atualizado em/);
});
