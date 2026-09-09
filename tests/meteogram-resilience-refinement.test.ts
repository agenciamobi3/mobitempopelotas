import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/meteograma-pelotas.tsx", "utf8");
const server = readFileSync("src/lib/weather/meteogram.server.ts", "utf8");
const functions = readFileSync("src/lib/weather/meteogram.functions.ts", "utf8");
const loader = readFileSync("src/lib/weather/public-weather-page-loader.ts", "utf8");
const page = readFileSync("src/components/weather/MeteogramPage.tsx", "utf8");
const highlights = readFileSync("src/components/weather/MeteogramForecastHighlights.tsx", "utf8");
const simagro = readFileSync("src/components/weather/SimagroModelProducts.tsx", "utf8");

test("meteograma possui duas candidatas horárias e variáveis secundárias não derrubam o núcleo", () => {
  assert.match(server, /BEST_MATCH_ENDPOINT = "https:\/\/api\.open-meteo\.com\/v1\/forecast"/);
  assert.match(server, /GFS_ENDPOINT = "https:\/\/api\.open-meteo\.com\/v1\/gfs"/);
  assert.match(server, /REQUEST_TIMEOUT_MS = 2_100/);
  assert.match(server, /FORECAST_HOURS = 48/);
  assert.match(server, /optionalNumberSeries/);
  assert.match(server, /Promise\.all\(candidates\.map\(fetchCandidate\)\)/);
  assert.match(server, /candidate\.hours\.length > selected\.hours\.length/);
});

test("rota usa o loader público resiliente em vez de repetir chamadas", () => {
  assert.match(route, /loadPublicWeatherWithMeteogram/);
  assert.match(loader, /PUBLIC_WEATHER_PAGE_DEADLINE_MS = 2_500/);
  assert.match(loader, /settlePageDependency/);
  assert.doesNotMatch(route, /Promise\.allSettled|await getWeatherIntelligence|await getPelotasMeteogram/);
});

test("cache diferencia janela completa, curta e indisponível", () => {
  assert.match(functions, /data\.hours\.length >= data\.source\.forecastHours/);
  assert.match(functions, /max-age=300, stale-while-revalidate=600/);
  assert.match(functions, /max-age=60, stale-while-revalidate=120/);
  assert.match(functions, /no-store, max-age=0/);
});

test("fallback horário preserva direção do vento e horário selecionado ganha nuvens", () => {
  assert.match(page, /windDirectionDegrees:\s*hour\.windDirectionDegrees \?\? null/);
  assert.match(page, /selectedMetric\("Nuvens"/);
  assert.match(page, /Baixas \$\{formatNumber\(hour\.cloudCoverLow, "%"\)\}/);
  assert.match(page, /Médias \$\{formatNumber\(hour\.cloudCoverMid, "%"\)\}/);
  assert.match(page, /Altas \$\{formatNumber\(hour\.cloudCoverHigh, "%"\)\}/);
  assert.doesNotMatch(page, /Camada próxima ao solo não informada/);
});

test("hero e rodapé deixam a proveniência técnica para a página de dados", () => {
  assert.match(page, /Janela analisada/);
  assert.match(page, /Próximas 24 horas/);
  assert.match(page, /to="\/status-dos-dados">Sobre os dados/);
  assert.doesNotMatch(page, /Previsão: \{sourceLabel|function sourceLabel|href=\{meteogram\.source\.url\}/);
});

test("resumo de 48h não converte ausência em zero nem inventa risco", () => {
  assert.match(route, /MeteogramForecastHighlights/);
  assert.match(highlights, /Destaques das próximas \{windowLabel\}/);
  assert.match(highlights, /Chuva prevista/);
  assert.match(highlights, /Maior rajada/);
  assert.match(highlights, /Menor visibilidade/);
  assert.match(highlights, /Maior CAPE/);
  assert.match(highlights, /horários com volume informado/);
  assert.doesNotMatch(highlights, /\?\? 0|risco alto|risco baixo|perigo/i);
});

test("falha visual do SIMAGRO oferece o arquivo original sem reconstruir valores", () => {
  assert.match(simagro, /Abrir imagem no SIMAGRO/);
  assert.match(simagro, /href=\{selected\.imageUrl\}/);
  assert.match(simagro, /Abrir SIMAGRO RS/);
  assert.doesNotMatch(simagro, /OCR|canvas|getImageData|proxy/i);
});
