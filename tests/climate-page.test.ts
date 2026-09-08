import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/clima-em-pelotas.tsx", "utf8");
const page = readFileSync("src/components/climate/ClimatePelotasPage.tsx", "utf8");
const styles = readFileSync("src/components/climate/ClimatePelotasPage.css", "utf8");
const homeContract = readFileSync(
  "src/components/climate/ClimatePelotasHomeContract.css",
  "utf8",
);
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");
const header = readFileSync("src/production/components/home-editorial-header.tsx", "utf8");

const climateSource = `${route}\n${page}`;

test("climate route is a real editorial page with independent degraded states", () => {
  assert.match(route, /createFileRoute\("\/clima-em-pelotas"\)/);
  assert.match(route, /getWeatherIntelligence\(\)/);
  assert.match(route, /getPelotasWeatherHistory\(\)/);
  assert.match(route, /Promise\.allSettled/);
  assert.doesNotMatch(route, /Promise\.all\(/);
  assert.match(route, /createUnavailableWeatherIntelligence\(\)/);
  assert.match(route, /createUnavailableWeatherHistory\(/);
  assert.match(route, /ClimatePelotasHero/);
  assert.match(route, /ClimatePelotasPage/);
  assert.match(route, /EditorialContentSection/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, CLIMATE_CONTENT\.faqs\)/);
  assert.doesNotMatch(route, /redirect\s*\(/);
  assert.doesNotMatch(route, /statusCode:\s*301/);
});

test("climate page distinguishes weather, climate and recent history in direct language", () => {
  assert.match(page, /Tempo mostra o presente; clima descreve muitos anos/);
  assert.match(page, /Últimos 30 dias: dados recentes, não média histórica/);
  assert.match(page, /não mostram, sozinhos, se o período ficou acima ou abaixo do clima normal/);
  assert.match(page, /As Normais Climatológicas usam muitos anos de dados/);
  assert.match(route, /um mês isolado não representa o clima normal da cidade/i);
  assert.match(route, /Uma frente fria, uma onda de calor ou um mês chuvoso não definem sozinhos o clima/);
  assert.doesNotMatch(climateSource, /ponto de grade/i);
  assert.doesNotMatch(climateSource, /tendências sazonais/i);
  assert.doesNotMatch(climateSource, /acesso direto ao produto/i);
});

test("climate page describes all four seasons without fixed climatological numbers", () => {
  assert.match(page, /title: "Verão"/);
  assert.match(page, /title: "Outono"/);
  assert.match(page, /title: "Inverno"/);
  assert.match(page, /title: "Primavera"/);
  assert.match(page, /seasonForMonth/);
  assert.match(page, /seasons\[0\]!/);
  assert.match(page, /Frentes e massas de ar/);
  assert.match(page, /Lagoa dos Patos e oceano/);
  assert.match(page, /Chuva pode ocorrer em qualquer época/);
  assert.doesNotMatch(climateSource, /normal climatológica[^\n]{0,80}\b\d{1,3}(?:[.,]\d+)?\s*(?:°C|mm|%)/i);
});

test("official climate references are transparent and external links are safe", () => {
  assert.match(page, /https:\/\/portal\.inmet\.gov\.br\/normais/);
  assert.match(page, /Normais Climatológicas do INMET/);
  assert.match(page, /target="_blank"/);
  assert.match(page, /rel="noopener noreferrer"/);
  assert.match(route, /Normais Climatológicas do INMET/);
  assert.match(route, /períodos oficiais, incluindo 1991–2020/);
});

test("recent climate context uses the existing real history dataset", () => {
  assert.match(page, /history\.summary/);
  assert.match(page, /history\.source\.periodStart/);
  assert.match(page, /history\.source\.periodEnd/);
  assert.match(page, /summary\.averageMax/);
  assert.match(page, /summary\.averageMin/);
  assert.match(page, /summary\.totalPrecipitation/);
  assert.match(page, /summary\.strongestWindGust/);
  assert.match(page, /summary\.warmestDay/);
  assert.match(page, /summary\.coldestDay/);
  assert.match(page, /sem\s+preencher\s+a\s+ausência\s+dos\s+dados\s+com\s+números\s+simulados/);
  assert.match(page, /atualizado em \{formatDateTime\(history\.source\.fetchedAt\)\}/);
});

test("climate layout follows the clean editorial rail and responsive contract", () => {
  assert.match(styles, /internal-weather-shell--climate \.climate-hero/);
  assert.match(styles, /max-width: var\(--internal-weather-frame-max/);
  assert.match(styles, /\.climate-chapters\s*\{[\s\S]*?display:\s*none/);
  assert.match(styles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.climate-hero__content,[\s\S]*?\.climate-hero__panel[\s\S]*?border-radius:\s*0[\s\S]*?box-shadow:\s*none/);
  assert.match(styles, /content-visibility:\s*auto/);
  assert.match(styles, /@media \(max-width: 1080px\)/);
  assert.match(styles, /@media \(max-width: 820px\)/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /:focus-visible/);
  assert.doesNotMatch(styles, /radial-gradient|linear-gradient/);
});

test("climate hero keeps only restrained seasonal accents", () => {
  assert.match(route, /ClimatePelotasHomeContract\.css/);
  assert.match(homeContract, /acento sazonal mínimo/i);
  assert.match(homeContract, /:has\(\.lucide-snowflake\)/);
  assert.match(homeContract, /:has\(\.lucide-sun\)/);
  assert.match(homeContract, /:has\(\.lucide-leaf\)/);
  assert.match(homeContract, /\.climate-season-grid article\.is-current/);
  assert.match(homeContract, /\.climate-hero__recent[\s\S]*background:\s*transparent[\s\S]*box-shadow:\s*none/);
  assert.doesNotMatch(homeContract, /radial-gradient|linear-gradient/);
  assert.doesNotMatch(homeContract, /!important/);
});

test("climate route is discoverable through sitemap and canonical editorial navigation", () => {
  assert.match(publicRoutes, /path: "\/clima-em-pelotas", changeFrequency: "daily"/);
  assert.match(header, /"\/clima-em-pelotas"/);
  assert.match(header, /label: "Clima de Pelotas"/);
  assert.match(header, /Estações do ano, Lagoa dos Patos e dinâmica do clima local/);
});
