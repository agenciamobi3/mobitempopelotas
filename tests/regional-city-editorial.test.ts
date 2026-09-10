import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { regionalWeatherIcon } from "../src/components/regional/regional-weather-presentation.ts";

const pageSource = readFileSync(
  new URL("../src/components/regional/RegionalCityWeatherPage.tsx", import.meta.url),
  "utf8",
);
const routeSource = readFileSync(
  new URL("../src/routes/tempo-em/$citySlug.tsx", import.meta.url),
  "utf8",
);
const heroSource = readFileSync(
  new URL("../src/components/regional/RegionalCityHero.tsx", import.meta.url),
  "utf8",
);
const editorialSource = readFileSync(
  new URL("../src/lib/regional-city-editorial.ts", import.meta.url),
  "utf8",
);
const heroCss = readFileSync(
  new URL("../src/components/regional/RegionalCityHero.css", import.meta.url),
  "utf8",
);
const splitHeroSource = readFileSync(
  new URL("../src/components/weather/WeatherSplitHero.tsx", import.meta.url),
  "utf8",
);
const splitHeroCss = readFileSync(
  new URL("../src/components/weather/WeatherSplitHero.css", import.meta.url),
  "utf8",
);
const adapterSource = readFileSync(
  new URL("../src/components/regional/regional-city-forecast-story.ts", import.meta.url),
  "utf8",
);
const forecastStorySource = readFileSync(
  new URL("../src/components/weather/HomeForecastStory.tsx", import.meta.url),
  "utf8",
);
const pageCss = readFileSync(
  new URL("../src/components/regional/RegionalCityWeatherPage.module.css", import.meta.url),
  "utf8",
);
const identityCss = readFileSync(
  new URL("../src/components/regional/RegionalCityIdentity.css", import.meta.url),
  "utf8",
);
const accentCss = readFileSync(
  new URL("../src/components/regional/RegionalCityAccentContract.css", import.meta.url),
  "utf8",
);
const visualCss = readFileSync(
  new URL("../src/components/regional/RegionalCityVisualRefresh.css", import.meta.url),
  "utf8",
);

test("páginas regionais usam o main semântico fornecido pelo layout global", () => {
  assert.doesNotMatch(pageSource, /<main\b/);
  assert.match(pageSource, /<div className=\{`\$\{styles\.page\} regional-city-page`\}>/);
});

test("páginas regionais reutilizam os componentes meteorológicos sem duplicar a grade", () => {
  assert.match(heroSource, /<WeatherSplitHero/);
  assert.match(pageSource, /<HomeForecastStory/);
  assert.match(pageSource, /internal-forecast-widget regional-city-shared-forecast/);
  assert.doesNotMatch(pageSource, /InternalPageChapters/);
  assert.doesNotMatch(pageSource, /regionalSections|pageSections/);
  assert.doesNotMatch(pageSource, /<RegionalCityHourlySection/);
  assert.doesNotMatch(pageSource, /regional-city-summary/);
  assert.doesNotMatch(pageSource, /className="regional-city-forecast"/);
});

test("primeira dobra regional responde com dados reais antes da copy institucional", () => {
  assert.match(heroSource, /title={`Tempo agora em \$\{city\.name\}`}/);
  assert.match(heroSource, /const currentCopy = current/);
  assert.match(heroSource, /\$\{condition\} agora em \$\{city\.name\}/);
  assert.match(heroSource, /const rangeCopy = today/);
  assert.match(heroSource, /Hoje varia de/);
  assert.match(heroSource, /const rainCopy =/);
  assert.match(heroSource, /Sem destaque de chuva nas próximas 24 horas/);
  assert.match(heroSource, /currentLabel="Agora"/);
  assert.match(heroSource, /highlightLabel="Maior chance de chuva · 24h"/);
  assert.match(heroSource, /label: "Mínima hoje"/);
  assert.match(heroSource, /label: "Máxima hoje"/);
  assert.match(heroSource, /label: "Vento agora"/);
  assert.match(heroSource, /label: "Maior rajada · 24h"/);
  assert.match(heroSource, /href="#previsao-hoje"/);
  assert.match(heroSource, /href="#tendencia"/);
  assert.match(heroSource, /href="#avisos-municipais"/);
  assert.match(heroSource, /TriangleAlert/);
  assert.match(splitHeroSource, /weather-split-hero__copy/);
  assert.match(splitHeroSource, /weather-split-hero__card/);
  assert.match(splitHeroSource, /weather-split-hero__highlight/);
  assert.match(splitHeroSource, /facts\.slice\(0, 4\)/);
  assert.match(splitHeroCss, /grid-template-columns: minmax\(0, 1\.08fr\) minmax\(390px, 0\.92fr\)/);
  assert.match(splitHeroCss, /@media \(max-width: 980px\)/);
  assert.match(heroCss, /\.regional-city-split-hero/);
});

test("SEO regional mantém intenção direta e contexto próprio nas cidades prioritárias", () => {
  assert.match(editorialSource, /Tempo em \$\{city\.name\} hoje: previsão, chuva e vento/);
  for (const slug of [
    "rio-grande-rs",
    "sao-jose-do-norte-rs",
    "sao-lourenco-do-sul-rs",
    "cangucu-rs",
    "piratini-rs",
    "dom-pedrito-rs",
    "bage-rs",
    "jaguarao-rs",
    "santa-vitoria-do-palmar-rs",
    "chui-rs",
    "capao-do-leao-rs",
  ]) {
    assert.match(editorialSource, new RegExp(`"${slug}"`));
  }
  assert.match(pageSource, /regionalCityMetaDescription\(city\)/);
  assert.match(pageSource, /O que vale observar em \{city\.name\}/);
  assert.match(pageSource, /editorial\?\.introduction/);
  assert.match(pageSource, /editorial\?\.facts/);
});

test("SEO regional evita FAQ templated em massa sem evidência específica", () => {
  assert.doesNotMatch(pageSource, /regionalCityFaqs|perguntas-frequentes|regional-city-faq/);
  assert.doesNotMatch(routeSource, /regionalCityFaqs|createFaqPageJsonLd/);
  assert.doesNotMatch(pageCss, /\.faq\b/);
});

test("hero regional não inventa pico de chuva, rajada ou leitura atual", () => {
  assert.match(heroSource, /const highestRainChance = peakRainCandidate\?\.rainChance \?\? null/);
  assert.match(heroSource, /const hasPositiveRainChance = \(highestRainChance \?\? 0\) > 0/);
  assert.match(heroSource, /const peakRain = hasPositiveRainChance \? peakRainCandidate : null/);
  assert.match(heroSource, /Sem horário de chuva em destaque/);
  assert.match(heroSource, /function gustMetric/);
  assert.match(heroSource, /if \(value <= 0\) return "Sem rajadas"/);
  assert.match(heroSource, /Condição atual de \$\{city\.name\} em atualização/);
  assert.match(heroSource, /Chance de chuva em atualização/);
});

test("hero regional escolhe CTA conforme a série realmente disponível", () => {
  assert.match(heroSource, /const hasHourlyForecast = Boolean\(today && data\.hourly\.length > 0\)/);
  assert.match(heroSource, /const hasDailyTrend = data\.daily\.length > 1/);
  assert.match(heroSource, /hasHourlyForecast \? \(/);
  assert.match(heroSource, /Ver próximas horas/);
  assert.match(heroSource, /hasDailyTrend \? \(/);
  assert.match(heroSource, /Ver próximos dias/);
  assert.match(heroSource, /to="\/tempo-na-regiao-sul-rs"/);
  assert.match(heroSource, /Ver região/);
});

test("camada regional atual usa abertura clara full-bleed e rail de 1440", () => {
  const identityIndex = pageSource.indexOf("RegionalCityIdentity.css");
  const accentIndex = pageSource.indexOf("RegionalCityAccentContract.css");
  const visualIndex = pageSource.indexOf("RegionalCityVisualRefresh.css");
  assert.ok(identityIndex >= 0);
  assert.ok(accentIndex > identityIndex);
  assert.ok(visualIndex > accentIndex);
  assert.match(accentCss, /\.regional-city-page \.regional-city-split-hero/);
  assert.match(visualCss, /width:\s*100vw/);
  assert.match(visualCss, /linear-gradient\(106deg, #f0fbfc/);
  assert.match(visualCss, /var\(--tp-home-container-max, 1440px\)/);
  assert.match(visualCss, /grid-template-columns: minmax\(0, 1\.02fr\) minmax\(430px, 0\.98fr\)/);
  assert.match(visualCss, /\.weather-split-hero__copy h1[\s\S]*font-size: clamp\(2\.75rem, 4\.05vw, 4\.05rem\)/);
  assert.match(visualCss, /\.weather-split-hero__card dl[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(visualCss, /border-radius:\s*22px/);
  assert.doesNotMatch(visualCss, /!important/);
});

test("âncoras regionais permanecem disponíveis sem índice visual ou markup morto", () => {
  for (const anchor of [
    "#avisos-municipais",
    "#previsao-hoje",
    "#tendencia",
    "#como-interpretar-previsao-regional",
    "#cidades-proximas",
  ]) {
    assert.match(`${pageSource}\n${heroSource}`, new RegExp(anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(pageSource, /InternalPageChapters|regionalSections|pageSections/);
});

test("aviso municipal segue o mesmo contrato visual do painel INMET interno", () => {
  assert.match(pageSource, /home-inmet-alerts/);
  assert.match(pageSource, /home-inmet-alerts__main/);
  assert.match(pageSource, /home-inmet-alerts__mark/);
  assert.match(pageSource, /home-inmet-alerts__meta/);
  assert.match(pageSource, /home-inmet-alerts__aside/);
  assert.match(pageSource, /data-alert-active=\{alert \? "true" : "false"\}/);
  assert.match(pageSource, /Sem aviso ativo do INMET para \$\{data\.city\.name\}/);
  assert.match(pageSource, /Confira a classificação no INMET/);
  assert.match(pageSource, /Ver no INMET/);
});

test("previsão regional é adaptada sem duplicar a grade meteorológica", () => {
  assert.match(adapterSource, /ForecastStoryData/);
  assert.match(adapterSource, /formatRegionalHour\(hour\.time\)/);
  assert.match(adapterSource, /regionalWeatherIcon\(hour\.condition, hour\.time\)/);
  assert.match(adapterSource, /precipitationProbability: hour\.rainChance/);
  assert.match(adapterSource, /precipitationMm: hour\.precipitationMm/);
  assert.match(adapterSource, /windGust: hour\.windGust/);
  assert.match(adapterSource, /dateIso: day\.date/);
  assert.match(forecastStorySource, /context\?: "home" \| "today-page" \| "regional-page"/);
  assert.match(forecastStorySource, /locationName\?: string/);
  assert.match(forecastStorySource, /hour\.precipitationMm/);
});

test("tema regional usa capítulos abertos e mantém links de cidades como unidades navegáveis", () => {
  assert.match(pageCss, /\.page \{[\s\S]*width: 100%/);
  assert.match(pageCss, /\.context/);
  assert.match(pageCss, /\.related/);
  assert.match(pageCss, /\.sources/);
  assert.match(pageCss, /\.context,[\s\S]*\.sources[\s\S]*border-radius:\s*0/);
  assert.match(pageCss, /\.context ul[\s\S]*border-top:/);
  assert.match(pageCss, /\.related > div[\s\S]*border-top:/);
  assert.doesNotMatch(pageCss, /radial-gradient|linear-gradient/);
  assert.doesNotMatch(pageCss, /\.forecastGrid/);
  assert.doesNotMatch(pageCss, /\.nowCard/);
  assert.match(heroCss, /\.regional-city-split-hero/);
  assert.match(identityCss, /--regional-frame-max:\s*var\(--tp-home-container-max, 1440px\)/);
  assert.match(identityCss, /--regional-frame-gap:\s*var\(--tp-home-container-gutter, 48px\)/);
  assert.match(identityCss, /section\.regional-city-official-alert/);
});

test("apresentação meteorológica diferencia condição e período do dia", () => {
  assert.equal(regionalWeatherIcon("Céu limpo", "2026-07-29T14:00"), "sun");
  assert.equal(regionalWeatherIcon("Céu limpo", "2026-07-29T22:00"), "moon");
  assert.equal(regionalWeatherIcon("Parcialmente nublado", "2026-07-29T10:00"), "partly-cloudy");
  assert.equal(
    regionalWeatherIcon("Parcialmente nublado", "2026-07-29T23:00"),
    "partly-cloudy-night",
  );
  assert.equal(regionalWeatherIcon("Chuva"), "rain");
  assert.equal(regionalWeatherIcon("Temporal"), "storm");
  assert.equal(regionalWeatherIcon("Neblina"), "cloud");
});
