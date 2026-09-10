import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createPageHead } from "../src/lib/page-meta.ts";
import {
  INDEXABLE_REGIONAL_CITIES,
  REGIONAL_CITIES,
  REGIONAL_HOME_CITY_SLUG,
  nearestRegionalCities,
  regionalCityDistanceKm,
  regionalCityPath,
} from "../src/lib/regional-cities.ts";
import { PUBLIC_ROUTES } from "../src/lib/public-routes.ts";

const server = readFileSync("src/lib/weather/regional-city-weather.server.ts", "utf8");
const route = readFileSync("src/routes/tempo-em/$citySlug.tsx", "utf8");
const directoryRoute = readFileSync("src/routes/tempo-na-regiao-sul-rs.tsx", "utf8");
const page = readFileSync("src/components/regional/RegionalCityWeatherPage.tsx", "utf8");
const hero = readFileSync("src/components/regional/RegionalCityHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/regional/RegionalCityHero.css", "utf8");
const adapter = readFileSync("src/components/regional/regional-city-forecast-story.ts", "utf8");
const identityStyles = readFileSync("src/components/regional/RegionalCityIdentity.css", "utf8");
const performanceStyles = readFileSync("src/components/regional/RegionalCityPerformance.css", "utf8");
const visualStyles = readFileSync("src/components/regional/RegionalCityVisualRefresh.css", "utf8");
const sharedHero = readFileSync("src/components/weather/WeatherSplitHero.tsx", "utf8");
const sharedHeroStyles = readFileSync("src/components/weather/WeatherSplitHero.css", "utf8");
const sharedForecast = readFileSync("src/components/weather/HomeForecastStory.tsx", "utf8");
const header = readFileSync("src/production/components/home-editorial-header.tsx", "utf8");

test("regional registry has unique slugs, IBGE codes and valid coordinates", () => {
  assert.ok(REGIONAL_CITIES.length >= 20);
  assert.equal(new Set(REGIONAL_CITIES.map((city) => city.slug)).size, REGIONAL_CITIES.length);
  assert.equal(new Set(REGIONAL_CITIES.map((city) => city.ibgeCode)).size, REGIONAL_CITIES.length);
  for (const city of REGIONAL_CITIES) {
    assert.match(city.ibgeCode, /^43\d{5}$/);
    assert.ok(city.latitude < -29 && city.latitude > -35);
    assert.ok(city.longitude < -50 && city.longitude > -56);
    assert.ok(city.descriptor.trim().length >= 20);
  }
});

test("nearby regional cities are selected by geographic distance", () => {
  const pelotas = REGIONAL_CITIES.find((city) => city.slug === REGIONAL_HOME_CITY_SLUG);
  assert.ok(pelotas);
  const nearest = nearestRegionalCities(pelotas, 5);
  assert.equal(nearest.length, 5);
  assert.ok(nearest.every((item) => item.city.slug !== pelotas.slug));
  assert.ok(nearest.every((item) => Number.isFinite(item.distanceKm) && item.distanceKm > 0));
  for (let index = 1; index < nearest.length; index += 1) {
    assert.ok(nearest[index - 1]!.distanceKm <= nearest[index]!.distanceKm);
  }
  const capao = REGIONAL_CITIES.find((city) => city.slug === "capao-do-leao-rs");
  assert.ok(capao);
  assert.ok(regionalCityDistanceKm(pelotas, capao) < 20);
  assert.match(page, /nearestRegionalCities\(city, 5\)/);
  assert.match(page, /km em linha reta/);
  assert.doesNotMatch(page, /item\.group === city\.group/);
});

test("Pelotas consolida autoridade na Home e sitemap inclui somente cidades indexáveis", () => {
  const publicPaths = new Set(PUBLIC_ROUTES.map((item) => item.path));
  const pelotas = REGIONAL_CITIES.find((city) => city.slug === REGIONAL_HOME_CITY_SLUG);
  assert.ok(pelotas);
  assert.equal(regionalCityPath(pelotas), "/");
  assert.ok(publicPaths.has("/"));
  assert.ok(!publicPaths.has("/tempo-em/pelotas-rs"));

  for (const city of INDEXABLE_REGIONAL_CITIES.filter(
    (item) => item.slug !== REGIONAL_HOME_CITY_SLUG,
  )) {
    assert.ok(publicPaths.has(regionalCityPath(city)), `sitemap sem ${city.name}`);
  }

  for (const city of REGIONAL_CITIES.filter((item) => item.coverage === "basic")) {
    assert.ok(!publicPaths.has(regionalCityPath(city)), `cidade basic não deve entrar no sitemap: ${city.name}`);
  }

  assert.match(route, /createFileRoute\("\/tempo-em\/\$citySlug"\)/);
  assert.match(route, /params\.citySlug === REGIONAL_HOME_CITY_SLUG/);
  assert.match(route, /statusCode:\s*301/);
  assert.match(route, /to:\s*"\/"/);
  assert.match(route, /getRegionalCityWeather/);
  assert.match(directoryRoute, /createFileRoute\("\/tempo-na-regiao-sul-rs"\)/);
});

test("regional page metadata uses the requested city's coordinates and local intent", () => {
  const bage = REGIONAL_CITIES.find((city) => city.slug === "bage-rs");
  assert.ok(bage);
  const head = createPageHead("Tempo em Bagé, RS", "Previsão local.", regionalCityPath(bage), [], {
    geo: { region: "BR-RS", placename: bage.name, latitude: bage.latitude, longitude: bage.longitude },
  });
  assert.ok(head.meta.some((entry) => "name" in entry && entry.name === "geo.placename" && "content" in entry && entry.content === "Bagé"));
  assert.ok(head.meta.some((entry) => "name" in entry && entry.name === "geo.position" && "content" in entry && entry.content === `${bage.latitude};${bage.longitude}`));
  assert.match(route, /placename:\s*city\.name/);
  assert.match(route, /latitude:\s*city\.latitude/);
  assert.match(route, /longitude:\s*city\.longitude/);
  assert.match(route, /regionalCityPageTitle\(city\)/);
  assert.match(route, /regionalCityMetaDescription\(city\)/);
  assert.match(page, /regionalCityEditorialProfile\(city\)/);
});

test("city pages query real coordinate forecasts and municipal INMET alerts", () => {
  assert.match(server, /api\.open-meteo\.com\/v1\/forecast/);
  assert.match(server, /getByGeocode\/\$\{city\.ibgeCode\}/);
  assert.match(server, /temperature_2m_max/);
  assert.match(server, /precipitation_sum/);
  assert.match(server, /wind_gusts_10m_max/);
  assert.match(server, /hourly:/);
  assert.match(server, /precipitation_probability/);
  assert.match(server, /sunrise,sunset/);
  assert.match(server, /hourlyStart \+ 12/);
  assert.match(page, /RegionalOfficialAlertPanel/);
  assert.match(page, /hasVerifiedRegionalAlertSemantics/);
});

test("regional first fold keeps real data and the current editorial visual", () => {
  assert.match(page, /<RegionalCityHero data=\{data\}/);
  assert.match(page, /import "\.\/RegionalCityVisualRefresh\.css"/);
  assert.match(hero, /<WeatherSplitHero/);
  assert.match(hero, /title={`Tempo agora em \$\{city\.name\}`}/);
  assert.match(hero, /const currentCopy = current/);
  assert.match(hero, /\$\{condition\} agora em \$\{city\.name\}/);
  assert.match(hero, /const rangeCopy = today/);
  assert.match(hero, /Hoje varia de/);
  assert.match(hero, /const rainCopy =/);
  assert.match(hero, /currentLabel="Agora"/);
  assert.match(hero, /highlightLabel="Maior chance de chuva · 24h"/);
  assert.match(hero, /label: "Mínima hoje"/);
  assert.match(hero, /label: "Máxima hoje"/);
  assert.match(hero, /label: "Vento agora"/);
  assert.match(hero, /label: "Maior rajada · 24h"/);
  assert.match(hero, /TriangleAlert/);
  assert.match(hero, /badgeLabel=\{priorityAlert \? `INMET · aviso para \$\{city\.name\}` : condition\}/);
  assert.match(hero, /href="#previsao-hoje"/);
  assert.match(hero, /href="#avisos-municipais"/);
  assert.match(sharedHero, /weather-split-hero__copy/);
  assert.match(sharedHero, /weather-split-hero__card/);
  assert.match(sharedHero, /facts\.slice\(0, 4\)/);
  assert.match(sharedHeroStyles, /grid-template-columns: minmax\(0, 1\.08fr\) minmax\(390px, 0\.92fr\)/);
  assert.match(sharedHeroStyles, /linear-gradient\(145deg, #102437, #18334f 58%, #25375c\)/);
  assert.match(heroStyles, /\.regional-city-split-hero/);
  assert.match(visualStyles, /width:\s*100vw/);
  assert.match(visualStyles, /linear-gradient\(106deg, #f0fbfc/);
  assert.match(visualStyles, /grid-template-columns: minmax\(0, 1\.02fr\) minmax\(430px, 0\.98fr\)/);
  assert.match(visualStyles, /font-size: clamp\(2\.75rem, 4\.05vw, 4\.05rem\)/);
  assert.match(visualStyles, /\.weather-split-hero__card dl[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(visualStyles, /border-radius:\s*22px/);
});

test("regional pages reuse alert and forecast structures without hidden chapter markup", () => {
  assert.match(page, /home-inmet-alerts/);
  assert.match(page, /<HomeForecastStory/);
  assert.match(page, /internal-forecast-widget regional-city-shared-forecast/);
  assert.doesNotMatch(page, /InternalPageChapters|regionalSections|pageSections/);
  assert.match(sharedForecast, /context\?: "home" \| "today-page" \| "regional-page"/);
  assert.match(sharedForecast, /locationName\?: string/);
  assert.match(adapter, /precipitationMm: hour\.precipitationMm/);
  assert.match(adapter, /rainChance: day\.rainChance/);
  assert.doesNotMatch(page, /RegionalCityHourlySection/);
});

test("regional pages defer lower sections and keep anchors aligned", () => {
  assert.match(page, /import "\.\/RegionalCityPerformance\.css"/);
  assert.match(page, /regional-city-page/);
  assert.match(performanceStyles, /content-visibility:\s*auto/);
  assert.match(performanceStyles, /contain-intrinsic-size:\s*auto 760px/);
  assert.match(performanceStyles, /scroll-margin-top:\s*7\.5rem/);
  assert.match(performanceStyles, /@media \(max-width:\s*700px\)/);
  assert.match(identityStyles, /--regional-frame-max:\s*var\(--tp-home-container-max, 1440px\)/);
  assert.match(identityStyles, /--regional-frame-gap:\s*var\(--tp-home-container-gutter, 48px\)/);
  assert.match(identityStyles, /--regional-gutter:/);
  assert.doesNotMatch(identityStyles, /today-retail-hero/);
  assert.match(identityStyles, /#previsao-hoje/);
  assert.match(identityStyles, /#tendencia/);
  assert.match(identityStyles, /#cidades-proximas/);
});

test("regional navigation keeps Pelotas on Home and exposes typed nearby-city links", () => {
  assert.match(header, /id: "region"/);
  assert.match(header, /Previsão regional e cidades da Zona Sul do Rio Grande do Sul/);
  assert.match(header, /to="\/"/);
  assert.doesNotMatch(header, /tempo-em\/pelotas-rs/);
  assert.match(header, /label: "Rio Grande"/);
  assert.match(header, /params: \{ citySlug: "rio-grande-rs" \}/);
  assert.match(header, /label: "Região"/);
});
