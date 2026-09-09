import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const config = readFileSync("src/lib/weather/now-source.config.ts", "utf8");
const selector = readFileSync("src/lib/weather/now-source.server.ts", "utf8");
const aggregator = readFileSync("src/lib/weather/aggregated-weather.server.ts", "utf8");
const traceability = readFileSync("src/lib/weather/weather-traceability.ts", "utf8");
const homeAdapter = readFileSync("src/production/adapters/home.ts", "utf8");
const hero = readFileSync("src/production/components/weather-hero.tsx", "utf8");

test("Agora tem dois módulos observacionais e Embrapa nasce como principal", () => {
  assert.match(config, /NOW_SOURCE_MODULES = \["embrapa", "defesa-civil-rs"\]/);
  assert.match(config, /NOW_PRIMARY_SOURCE: NowObservationSourceKey = "embrapa"/);
  assert.match(config, /getNowSourcePriority/);
});

test("módulos são consultados em paralelo com deadline e failover por prioridade", () => {
  assert.match(selector, /settleModule\(fetchEmbrapaObservation\(\)\)/);
  assert.match(selector, /settleModule\(fetchDefesaCivilCurrentObservation\(\)\)/);
  assert.match(selector, /NOW_MODULE_DEADLINE_MS = 5_500/);
  assert.match(selector, /getNowSourcePriority\(primarySource\)/);
  assert.match(selector, /fallbackUsed: selected !== null && selected\.source !== primarySource/);
});

test("Embrapa só pode compor Agora com temperatura e horário recente", () => {
  assert.match(selector, /observation\.current\.temperature !== null/);
  assert.match(selector, /observationAgeMinutes !== null/);
  assert.match(selector, /observationAgeMinutes <= OBSERVATION_MAX_AGE_MINUTES/);
  assert.match(selector, /normalizeEmbrapaObservedAt/);
});

test("agregador preserva a observação bruta da Defesa Civil para consumidores específicos", () => {
  assert.match(aggregator, /const observation = now\.defesaCivilObservation/);
  assert.match(aggregator, /const current = now\.current/);
  assert.match(aggregator, /currentSource: now\.selectedSource/);
  assert.match(aggregator, /primarySource: now\.primarySource/);
  assert.match(aggregator, /fallbackUsed: now\.fallbackUsed/);
});

test("queda do módulo inativo não degrada o Agora servido pela Embrapa", () => {
  assert.match(
    traceability,
    /source === "defesa-civil-rs" && currentSource === "embrapa"/,
  );
});

test("adapter do Hero aceita qualquer módulo observacional selecionado", () => {
  assert.match(homeAdapter, /data\.quality\.currentSource === null/);
  assert.match(homeAdapter, /data\.now\?\.selectedSource/);
  assert.doesNotMatch(homeAdapter, /data\.quality\.currentSource !== "defesa-civil-rs"/);
});

test("Hero não repete a fonte abaixo da leitura atual", () => {
  assert.doesNotMatch(hero, /tp-home-hero__source-inline/);
  assert.doesNotMatch(hero, /Fonte da observação/);
  assert.doesNotMatch(hero, /Condição observada<\/span>/);
});
