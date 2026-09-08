import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const structuredData = readFileSync("src/lib/structured-data.ts", "utf8");
const sourceCitations = readFileSync("src/lib/seo-source-citations.ts", "utf8");
const llms = readFileSync("public/llms.txt", "utf8");
const home = readFileSync("src/routes/index.tsx", "utf8");
const today = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");
const tomorrow = readFileSync("src/routes/tempo-amanha-pelotas.tsx", "utf8");
const sevenDay = readFileSync("src/routes/previsao-7-dias-pelotas.tsx", "utf8");
const rain = readFileSync("src/routes/chuva-em-pelotas.tsx", "utf8");
const wind = readFileSync("src/routes/vento-em-pelotas.tsx", "utf8");
const retiredStationRoute = readFileSync("src/routes/estacao-embrapa-pelotas.tsx", "utf8");

test("json-ld editorial pode declarar proveniência sem alterar conteúdo visível", () => {
  assert.match(structuredData, /citations\?: readonly string\[\]/);
  assert.match(structuredData, /citation: citationItems\(citations\)/);
  assert.match(structuredData, /isBasedOn: citations/);
  assert.match(structuredData, /"@type": "CreativeWork"/);
});

test("fontes públicas usadas pelo SEO/GEO ficam centralizadas", () => {
  assert.match(sourceCitations, /redehidrometeorologica\.defesacivil\.rs\.gov\.br\/Mapa/);
  assert.match(sourceCitations, /https:\/\/open-meteo\.com\//);
  assert.match(sourceCitations, /https:\/\/portal\.inmet\.gov\.br\//);
  assert.match(sourceCitations, /https:\/\/avisos\.inmet\.gov\.br\//);
  assert.match(sourceCitations, /https:\/\/wp\.ufpel\.edu\.br\/cppmet\//);
  assert.match(sourceCitations, /absoluteUrl\("\/metodologia"\)/);
  assert.doesNotMatch(sourceCitations, /agromet\.cpact\.embrapa\.br/);
});

test("páginas meteorológicas centrais ligam conteúdo às fontes documentadas", () => {
  assert.match(home, /citations: CORE_WEATHER_CITATIONS/);
  assert.match(today, /citations: CORE_WEATHER_CITATIONS/);
  assert.match(tomorrow, /citations: CORE_WEATHER_CITATIONS/);
  assert.match(sevenDay, /citations: CORE_WEATHER_CITATIONS/);
  assert.match(rain, /citations: RAIN_CITATIONS/);
  assert.match(wind, /citations: WIND_CITATIONS/);
});

test("URL histórica da estação aposentada não publica Dataset observacional novo", () => {
  assert.match(retiredStationRoute, /redirect/);
  assert.match(retiredStationRoute, /to: "\/metodologia"/);
  assert.doesNotMatch(retiredStationRoute, /createDatasetJsonLd|SEO_SOURCE_URLS\.embrapa/);
});

test("llms.txt orienta agentes para canônicos, observação local e semântica dos dados", () => {
  assert.match(llms, /Canonical: https:\/\/tempopelotas\.com\.br/);
  assert.match(llms, /Methodology: https:\/\/tempopelotas\.com\.br\/metodologia/);
  assert.match(llms, /Defesa Civil RS/);
  assert.match(llms, /Observation is not forecast\./);
  assert.match(llms, /Forecast is not an official alert\./);
  assert.match(llms, /An unavailable value is not zero/);
  assert.match(llms, /Sustained wind must not be substituted for a missing gust measurement/);
  assert.match(llms, /cite the canonical page used/);
});
