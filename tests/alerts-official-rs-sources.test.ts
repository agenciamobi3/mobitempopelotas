import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/alertas.tsx", "utf8");
const sources = readFileSync("src/components/weather/CivilDefenseOfficialSources.tsx", "utf8");
const styles = readFileSync("src/components/weather/CivilDefenseOfficialSources.css", "utf8");
const safety = readFileSync("src/production/lib/safety-banners.ts", "utf8");

test("alerts route exposes complementary official state sources without merging their scales", () => {
  assert.match(route, /CivilDefenseOfficialSources/);
  assert.match(route, /<CivilDefenseOfficialSources \/>/);
  assert.match(route, /Prepara RS/);
  assert.match(route, /Boletins hidrometeorológicos da Defesa Civil RS/);
  assert.match(sources, /não combina automaticamente classificações do INMET e da Defesa Civil/);
});

test("state source directory points only to official RS public portals", () => {
  assert.match(sources, /https:\/\/prepara\.rs\.gov\.br\/elnino/);
  assert.match(sources, /https:\/\/defesacivil\.rs\.gov\.br\/avisos-e-boletins/);
  assert.match(sources, /https:\/\/defesacivil\.rs\.gov\.br\/avisos-e-alertas/);
  assert.match(sources, /target="_blank" rel="noopener noreferrer"/);
});

test("Civil Defense channel provenance records the latest manual review date", () => {
  assert.match(safety, /reviewedAt:\s*"2026-09-07"/);
  assert.match(safety, /como-se-cadastrar-para-receber-avisos-e-alertas-da-defesa-civil-no-celular/);
});

test("official source directory remains an open editorial list", () => {
  assert.match(styles, /\.alerts-official-sources__list/);
  assert.match(styles, /border-bottom:/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(styles, /radial-gradient|linear-gradient|box-shadow/);
});
