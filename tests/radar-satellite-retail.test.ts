import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/radar-e-satelite-pelotas.tsx", "utf8");
const loader = readFileSync("src/lib/redemet/radar-page-loader.ts", "utf8");
const fallback = readFileSync("src/lib/redemet/redemet-fallback.ts", "utf8");
const recovery = readFileSync("src/production/lib/redemet-browser-recovery.ts", "utf8");
const page = readFileSync("src/components/redemet/RedemetOverview.tsx", "utf8");
const pageStyles = readFileSync("src/components/redemet/RedemetOverview.css", "utf8");
const context = readFileSync("src/components/redemet/RadarForecastContext.tsx", "utf8");
const contextStyles = readFileSync("src/components/redemet/RadarForecastContext.css", "utf8");
const styles = `${pageStyles}\n${contextStyles}`;
const visibleCopy = `${route}\n${page}\n${context}`;

const remValues = [...styles.matchAll(/font-size:\s*(0\.\d+)rem/g)].map((match) =>
  Number(match[1]),
);

test("radar route uses simple SEO copy and recovers live collections after hydration", () => {
  assert.match(route, /Radar de chuva e satélite em Pelotas: imagens recentes/);
  assert.match(route, /horários reais das coletas/);
  assert.match(route, /As imagens desta página são reais\?/);
  assert.match(route, /Quando uma coleta não chega, o portal mostra esse estado/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, RADAR_PAGE_CONTENT\.faqs\)/);
  assert.match(route, /useRedemetOverviewBrowserRecovery\(baseline\.redemet\)/);
  assert.match(route, /useWeatherIntelligenceBrowserRecovery\(baseline\.weather\)/);
  assert.match(route, /<RedemetOverview data=\{redemet\} isRefreshing=\{isRecovering\} \/>/);
  assert.match(route, /<RedemetDerivedContext data=\{redemet\} \/>/);
  assert.match(route, /<RadarForecastContext radar=\{redemet\.radar\} weather=\{weather\} \/>/);
  assert.doesNotMatch(route, /OfficialDataAccessNotice|RedemetHomeContract|RedemetEmptyStatePolish/);
  assert.doesNotMatch(route, /cadência observada|janela temporal|integração server-side/i);
});

test("radar recovery keeps short SSR but replaces empty fallbacks with real backend collections", () => {
  assert.match(loader, /PUBLIC_RADAR_PAGE_DEADLINE_MS = 2_800/);
  assert.match(loader, /Promise\.race/);
  assert.match(loader, /Promise\.all\(/);
  assert.match(loader, /getRedemetOverview\(\)/);
  assert.match(loader, /createUnavailableRedemetOverview/);

  assert.match(recovery, /getRedemetOverview/);
  assert.match(recovery, /hasPrimaryRedemetCollections/);
  assert.match(recovery, /useRedemetOverviewBrowserRecovery/);
  assert.match(recovery, /mergeRedemetOverview/);
  assert.match(recovery, /if \(recovered\.frames\.length > 0\) return recovered/);
  assert.match(recovery, /if \(baseline\.frames\.length > 0\) return baseline/);
  assert.match(recovery, /runServerRecovery\(\(\) => getRedemetOverview\(\)\)/);
  assert.match(recovery, /setData\(\(current\) => mergeRedemetOverview\(current, recovered\)\)/);
  assert.match(fallback, /available: false/);
  assert.match(fallback, /frames: \[\]/);
});

test("monitor shows received collections instead of technical integration cards", () => {
  assert.match(page, /Pelotas · monitoramento regional/);
  assert.match(page, /Radar, satélite e raios na região de Pelotas/);
  assert.match(page, /Última coleta recebida/);
  assert.match(page, /Coletas reais recebidas/);
  assert.match(page, /O que chegou das fontes agora/);
  assert.match(page, /SourceSummaryRow/);
  assert.match(page, /Radar REDEMET/);
  assert.match(page, /Satélite REDEMET/);
  assert.match(page, /Satélite INMET/);
  assert.match(page, /Raios REDEMET/);
  assert.match(page, /Última coleta/);
  assert.match(page, /frameCountLabel/);
  assert.doesNotMatch(page, /InternalPageChapters|SourceSummaryCard/);
  assert.doesNotMatch(visibleCopy, /quadro utilizável|integração pendente|configuração da integração|grade de previsão|cadência observada/i);
});

test("missing collections remain explicit and never fabricate an image or timestamp", () => {
  assert.match(page, /Buscando a coleta mais recente/);
  assert.match(page, /continua consultando \$\{sourceName\} em segundo plano/);
  assert.match(page, /Nenhuma imagem recente recebida/);
  assert.match(page, /Nada é preenchido manualmente/);
  assert.match(page, /Horário não recebido/);
  assert.match(page, /sem coleta recente/);
  assert.doesNotMatch(page, /new Date\(\)\.toISOString\(\)/);
});

test("image and storm timelines preserve the real received sequence", () => {
  assert.match(page, /useFramePlayback/);
  assert.match(page, /FRAME_INTERVAL_MS/);
  assert.match(page, /window\.setInterval/);
  assert.match(page, /Coleta \{playback\.selectedIndex \+ 1\} de \{layer\.frames\.length\}/);
  assert.match(page, /Reproduzir/);
  assert.match(page, /Pausar/);
  assert.match(page, /Mais recente/);
  assert.match(page, /Abrir imagem/);
  assert.match(page, /aria-pressed=\{playback\.isPlaying\}/);
  assert.match(page, /redemet-storm-controls/);
  assert.match(page, /FreshnessBadge value=\{selected\?\.observedAt \?\? null\} reading/);
});

test("radar, satellite and lightning remain separate concepts in plain language", () => {
  assert.match(page, /Onde aparecem áreas de chuva/);
  assert.match(page, /O radar mostra a região, não uma rua específica/);
  assert.match(page, /Como estão as nuvens sobre a Região Sul/);
  assert.match(page, /Nuvens no satélite não significam necessariamente chuva/);
  assert.match(page, /Raios detectados/);
  assert.match(page, /Eles não são um alerta de risco/);
  assert.match(page, /Imagem observada não é previsão/);
});

test("radar comparison never substitutes sustained wind for a missing gust", () => {
  assert.match(context, /nearestForecastHour/);
  assert.match(context, /difference > 3 \* 60 \* 60 \* 1_000/);
  assert.match(context, /isUsableRedemetObservedAt/);
  assert.match(context, /A imagem é uma observação recebida da REDEMET/);
  assert.match(context, /não foram medidos pelo radar/);
  assert.match(context, /formatValue\(forecast\.windGust, " km\/h"\)/);
  assert.doesNotMatch(context, /forecast\.windGust \?\? forecast\.windSpeed/);
  assert.match(context, /A sequência de imagens mostra o passado recente/);
});

test("new radar visual is open editorial monitoring with functional dark imagery", () => {
  assert.match(pageStyles, /\.redemet-hero\s*\{[\s\S]*background:\s*var\(--redemet-soft\)/);
  assert.match(pageStyles, /\.redemet-hero h1[\s\S]*font-size:\s*clamp\(3rem, 5\.7vw, 6\.1rem\)/);
  assert.match(pageStyles, /\.redemet-source-overview__list[\s\S]*border-top:/);
  assert.match(pageStyles, /\.redemet-source-row/);
  assert.match(pageStyles, /\.redemet-monitor__surface[\s\S]*border:/);
  assert.match(pageStyles, /\.redemet-image-frame[\s\S]*background:\s*#0d171e/);
  assert.match(pageStyles, /\.redemet-frame-controls > button[\s\S]*width:\s*44px[\s\S]*height:\s*44px/);
  assert.match(pageStyles, /:focus-visible/);
  assert.match(pageStyles, /@media \(max-width: 760px\)/);
  assert.match(pageStyles, /@media \(max-width: 560px\)/);
  assert.match(pageStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(pageStyles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(pageStyles, /radial-gradient|linear-gradient/);
  assert.match(pageStyles, /box-shadow:\s*none/);

  assert.match(contextStyles, /\.radar-forecast-context[\s\S]*border-top:/);
  assert.match(contextStyles, /grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(contextStyles, /radial-gradient|linear-gradient/);
  assert.ok(remValues.every((value) => value >= 0.7), "microtext must remain readable");
});
