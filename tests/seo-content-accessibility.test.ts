import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const editorialRouteFiles = [
  "src/routes/alertas.tsx",
  "src/routes/vento-em-pelotas.tsx",
  "src/routes/radar-e-satelite-pelotas.tsx",
  "src/routes/clima-em-pelotas.tsx",
  "src/routes/historico-climatico-pelotas.tsx",
  "src/routes/cameras-ao-vivo-pelotas.tsx",
  "src/routes/mapa-de-geadas-rio-grande-do-sul.tsx",
  "src/routes/situacao-hidrologica-pelotas.tsx",
  "src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx",
] as const;

function read(path: string) {
  return readFileSync(path, "utf8");
}

test("content routes with dedicated editorial blocks expose visible answers and FAQ structured data", () => {
  for (const path of editorialRouteFiles) {
    const source = read(path);
    assert.match(source, /EditorialContentSection/);
    assert.match(source, /createFaqPageJsonLd/);
    assert.match(source, /about:\s*\[/);
  }
});

test("seven-day forecast keeps visible direct content without a duplicate editorial or FAQ layer", () => {
  const route = read("src/routes/previsao-7-dias-pelotas.tsx");
  const page = read("src/components/weather/SevenDayForecastPageV2.tsx");
  assert.match(route, /createEditorialPageJsonLd/);
  assert.match(route, /about:\s*\[/);
  assert.match(route, /ForecastHorizonBridge/);
  assert.doesNotMatch(route, /EditorialContentSection|createFaqPageJsonLd|SEVEN_DAY_PAGE_CONTENT/);
  assert.match(page, /Previsão dos próximos 7 dias/);
  assert.match(page, /Temperaturas nos próximos 7 dias/);
  assert.match(page, /Chuva e rajadas nos próximos 7 dias/);
  assert.match(page, /INMET e UFPel nos próximos dias/);
});

test("meteogram keeps visible direct content without a duplicate editorial or FAQ layer", () => {
  const route = read("src/routes/meteograma-pelotas.tsx");
  const page = read("src/components/weather/MeteogramPage.tsx");
  const simagro = read("src/components/weather/SimagroModelProducts.tsx");
  assert.match(route, /createEditorialPageJsonLd/);
  assert.match(route, /about:\s*\[/);
  assert.match(route, /MeteogramPage/);
  assert.match(route, /SimagroModelProducts/);
  assert.doesNotMatch(route, /EditorialContentSection|createFaqPageJsonLd|METEOGRAM_CONTENT/);
  assert.match(page, /Como o tempo pode mudar nas próximas horas/);
  assert.match(page, /Esta página mostra previsão, não medição/);
  assert.match(simagro, /Meteogramas WRF e GFS do SIMAGRO RS/);
});

test("rain keeps visible direct content without a duplicate editorial or FAQ layer", () => {
  const route = read("src/routes/chuva-em-pelotas.tsx");
  const page = read("src/components/weather/RainForecastPageV2.tsx");
  const accumulation = read("src/components/weather/RainAccumulationContext.tsx");
  const hourlyVolume = read("src/components/weather/RainHourlyVolumeContext.tsx");
  assert.match(route, /createEditorialPageJsonLd/);
  assert.match(route, /RAIN_CITATIONS/);
  assert.match(route, /about:\s*\[/);
  assert.doesNotMatch(route, /EditorialContentSection|createFaqPageJsonLd|RAIN_PAGE_CONTENT/);
  assert.match(accumulation, /Chuva medida e prevista/);
  assert.match(page, /Chance de chuva nas próximas 12 horas/);
  assert.match(page, /Chuva nos próximos 7 dias/);
  assert.match(page, /INMET para Pelotas/);
  assert.match(hourlyVolume, /Volume de chuva por hora/);
});

test("core search intents remain distinct and internally connected", () => {
  const home = read("src/routes/index.tsx");
  const today = read("src/routes/tempo-hoje-pelotas.tsx");
  const rainRoute = read("src/routes/chuva-em-pelotas.tsx");
  const rainPage = read("src/components/weather/RainForecastPageV2.tsx");
  const laranjal = read("src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx");
  const situation = read("src/routes/situacao-hidrologica-pelotas.tsx");

  assert.match(home, /Tempo agora em Pelotas: temperatura, chuva e previsão/);
  assert.match(home, /"Tempo agora em Pelotas"/);
  assert.match(today, /Tempo hoje em Pelotas: temperatura e previsão por hora/);
  assert.match(today, /Previsão de 15 dias/);
  assert.match(rainRoute, /Chuva em Pelotas hoje: acumulado, chance e previsão/);
  assert.match(rainPage, /\/radar-e-satelite-pelotas/);
  assert.match(rainPage, /\/vento-em-pelotas/);
  assert.match(laranjal, /O nível da Lagoa dos Patos está em tempo real\?/);
  assert.match(laranjal, /atrasada ou indisponível/);
  assert.match(laranjal, /\/nivel-do-guaiba/);
  assert.match(laranjal, /\/enchente-1941-pelotas/);
  assert.match(laranjal, /\/enchente-2024-pelotas-laranjal/);
  assert.match(situation, /\/enchente-1941-pelotas/);
  assert.match(situation, /\/enchente-2024-pelotas-laranjal/);
});

test("monitoring content distinguishes imagery, history, hydrology and local observation", () => {
  const source = read("src/lib/editorial-content.ts");
  const localMonitoring = read("src/components/weather/HomeLocalMonitoring.tsx");
  assert.match(source, /RADAR_EDITORIAL_CONTENT/);
  assert.match(source, /HISTORY_EDITORIAL_CONTENT/);
  assert.match(source, /CAMERAS_EDITORIAL_CONTENT/);
  assert.match(source, /HYDROLOGY_EDITORIAL_CONTENT/);
  assert.match(source, /LARANJAL_LEVEL_EDITORIAL_CONTENT/);
  assert.match(localMonitoring, /Rede de Monitoramento Hidrometeorológico/);
  assert.match(localMonitoring, /estações confirmadas em Pelotas/);
  assert.match(source, /não substituem alertas oficiais/i);
  assert.match(source, /normal climatológica/i);
  assert.match(source, /não deve ser interpretada isoladamente/i);
});

test("alert page distinguishes unavailable INMET data from an all-clear state", () => {
  const route = read("src/routes/alertas.tsx");
  const page = read("src/components/weather/WeatherAlertsPage.tsx");
  const refinements = read("src/components/weather/WeatherAlertsRefinements.css");
  assert.match(route, /Alertas meteorológicos em Pelotas e região/);
  assert.match(route, /createFaqPageJsonLd/);
  assert.match(route, /como-interpretar-alertas/);
  assert.match(page, /Não foi possível confirmar os alertas do INMET/);
  assert.match(page, /Não interprete a falha como ausência de risco/);
  assert.match(page, /sourceAvailable/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /Última consulta ao INMET/);
  assert.match(refinements, /alerts-clear-state\.is-unavailable/);
  assert.match(refinements, /@media \(max-width: 760px\)/);
});

test("editorial links preserve visible names and attach descriptions", () => {
  const source = read("src/components/content/EditorialContentSection.tsx");
  assert.match(source, /aria-describedby=\{descriptionId\}/);
  assert.doesNotMatch(source, /aria-label=\{`\$\{link\.label\}/);
});

test("external operational links identify new tabs safely", () => {
  const alerts = read("src/components/weather/WeatherAlertsPage.tsx");
  const footer = read("src/components/layout/Footer.tsx");
  const redemet = read("src/components/redemet/RedemetOverview.tsx");
  const cameras = read("src/components/cameras/CameraExplorer.tsx");
  assert.match(alerts, /target="_blank"[\s\S]*rel="noopener noreferrer"/);
  assert.match(alerts, /site do INMET, em nova aba/);
  assert.match(footer, /target="_blank"[\s\S]*rel="noopener noreferrer"/);
  assert.match(footer, /tempo-pelotas-purple\.svg/);
  assert.match(redemet, /rel="noopener noreferrer"/);
  assert.match(redemet, /site do \$\{sourceName\}, em nova aba/);
  assert.match(cameras, /rel="noopener noreferrer"/);
  assert.match(cameras, /provedor externo, em nova aba/);
});

test("radar and camera images avoid unnecessary synchronous decoding", () => {
  const redemet = read("src/components/redemet/RedemetOverview.tsx");
  const cameras = read("src/components/cameras/CameraExplorer.tsx");
  assert.match(redemet, /decoding="async"/);
  assert.match(redemet, /fetchPriority=\{kind === "radar" \? "high" : "auto"\}/);
  assert.match(cameras, /loading="lazy"[\s\S]*decoding="async"/);
});

test("editorial WebPage schema remains aligned with visible page semantics", () => {
  const source = read("src/lib/structured-data.ts");
  const frost = read("src/routes/mapa-de-geadas-rio-grande-do-sul.tsx");
  const regionalDirectory = read("src/routes/tempo-na-regiao-sul-rs.tsx");
  assert.match(source, /isAccessibleForFree:\s*true/);
  assert.match(source, /"@type": "ReadAction"/);
  assert.match(source, /keywords:\s*about\.join/);
  assert.match(source, /const location = options\.location \?\? createPelotasPlaceJsonLd\(\)/);
  assert.match(source, /contentLocation:\s*location/);
  assert.match(source, /"@type": "BreadcrumbList"/);
  assert.doesNotMatch(source, /SpeakableSpecification/);
  assert.match(frost, /location:\s*RIO_GRANDE_DO_SUL_LOCATION/);
  assert.match(frost, /\{ geo: null \}/);
  assert.match(regionalDirectory, /location:\s*SOUTHERN_RS_LOCATION/);
  assert.match(regionalDirectory, /\{ geo: null \}/);
});

test("below-fold editorial content uses delayed rendering", () => {
  const source = read("src/components/content/EditorialContentSection.css");
  assert.match(source, /content-visibility:\s*auto/);
  assert.match(source, /contain-intrinsic-size:\s*auto 900px/);
});

test("below-fold editorial content owns the Home surface without legacy decorative chrome", () => {
  const source = read("src/components/content/EditorialContentSection.css");
  assert.match(source, /--editorial-answer-line:\s*rgb\(7 30 47 \/ 10%\)/);
  assert.match(source, /margin:\s*clamp\(16px, 2vw, 24px\) 0 0/);
  assert.match(source, /border-radius:\s*16px/);
  assert.match(source, /background:\s*#fff/);
  assert.match(source, /box-shadow:\s*none/);
  assert.doesNotMatch(source, /radial-gradient|linear-gradient/);
  assert.match(source, /\.editorial-answer-facts li[\s\S]*background:\s*var\(--editorial-answer-soft\)/);
  assert.match(source, /\.editorial-answer-related a:hover[\s\S]*transform:\s*none/);
  assert.match(source, /\.editorial-answer-faq-list summary[\s\S]*min-height:\s*44px/);
  assert.match(source, /@media \(forced-colors: active\)/);
});
