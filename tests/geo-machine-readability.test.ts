import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const structuredData = readFileSync("src/lib/structured-data.ts", "utf8");
const sourceCitations = readFileSync("src/lib/seo-source-citations.ts", "utf8");
const llms = readFileSync("public/llms.txt", "utf8");
const today = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");
const tomorrow = readFileSync("src/routes/tempo-amanha-pelotas.tsx", "utf8");
const sevenDay = readFileSync("src/routes/previsao-7-dias-pelotas.tsx", "utf8");
const rain = readFileSync("src/routes/chuva-em-pelotas.tsx", "utf8");
const wind = readFileSync("src/routes/vento-em-pelotas.tsx", "utf8");
const embrapa = readFileSync("src/routes/estacao-embrapa-pelotas.tsx", "utf8");

test("json-ld editorial pode declarar proveniência sem alterar conteúdo visível", () => {
  assert.match(structuredData, /citations\?: readonly string\[\]/);
  assert.match(structuredData, /citation: citationItems\(citations\)/);
  assert.match(structuredData, /isBasedOn: citations/);
  assert.match(structuredData, /"@type": "CreativeWork"/);
});

test("fontes públicas usadas pelo SEO/GEO ficam centralizadas", () => {
  assert.match(sourceCitations, /https:\/\/open-meteo\.com\//);
  assert.match(sourceCitations, /agromet\.cpact\.embrapa\.br/);
  assert.match(sourceCitations, /https:\/\/portal\.inmet\.gov\.br\//);
  assert.match(sourceCitations, /https:\/\/avisos\.inmet\.gov\.br\//);
  assert.match(sourceCitations, /https:\/\/wp\.ufpel\.edu\.br\/cppmet\//);
  assert.match(sourceCitations, /absoluteUrl\("\/metodologia"\)/);
});

test("páginas meteorológicas centrais ligam conteúdo às fontes documentadas", () => {
  assert.match(today, /citations: CORE_WEATHER_CITATIONS/);
  assert.match(tomorrow, /citations: CORE_WEATHER_CITATIONS/);
  assert.match(sevenDay, /citations: CORE_WEATHER_CITATIONS/);
  assert.match(rain, /citations: RAIN_CITATIONS/);
  assert.match(wind, /citations: WIND_CITATIONS/);
});

test("Estação Embrapa publica proveniência e Dataset observacional sem se declarar previsão", () => {
  assert.match(embrapa, /createDatasetJsonLd/);
  assert.match(embrapa, /Medições meteorológicas da Estação Embrapa em Pelotas/);
  assert.match(embrapa, /sourceUrl: SEO_SOURCE_URLS\.embrapa/);
  assert.match(embrapa, /citations: \[SEO_SOURCE_URLS\.methodology, SEO_SOURCE_URLS\.embrapa\]/);
  assert.match(embrapa, /Temperatura do ar/);
  assert.match(embrapa, /Umidade relativa do ar/);
  assert.match(embrapa, /Pressão atmosférica/);
  assert.match(embrapa, /Velocidade do vento/);
  assert.match(embrapa, /Chuva acumulada/);
  assert.match(embrapa, /Não representa a previsão meteorológica das próximas horas/);
  assert.match(embrapa, /snapshot\.health\.data\.observationTime/);
  assert.match(embrapa, /snapshot\.history\.from/);
});

test("llms.txt orienta agentes para canônicos, metodologia e semântica dos dados", () => {
  assert.match(llms, /Canonical: https:\/\/tempopelotas\.com\.br/);
  assert.match(llms, /Methodology: https:\/\/tempopelotas\.com\.br\/metodologia/);
  assert.match(llms, /estacao-embrapa-pelotas/);
  assert.match(llms, /Observation is not forecast\./);
  assert.match(llms, /Forecast is not an official alert\./);
  assert.match(llms, /An unavailable value is not zero/);
  assert.match(llms, /future hourly and daily forecasts come from separately identified forecast models/);
  assert.match(llms, /cite the canonical page used/);
});
