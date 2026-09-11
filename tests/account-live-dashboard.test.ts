import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dashboard = readFileSync("src/components/auth/AccountDashboard.tsx", "utf8");
const liveOverview = readFileSync("src/components/auth/AccountLiveOverview.tsx", "utf8");
const favoritesPanel = readFileSync("src/components/auth/AccountFavoritesPanel.tsx", "utf8");
const liveFunctions = readFileSync("src/lib/auth/account-dashboard-live.functions.ts", "utf8");
const liveStyles = readFileSync("src/components/auth/AccountLiveOverview.css", "utf8");
const favoriteStyles = readFileSync("src/components/auth/AccountFavoriteLive.css", "utf8");

test("painel Free coloca valor pessoal antes das ferramentas de publicação", () => {
  assert.match(dashboard, /Meu Tempo Pelotas/);
  assert.match(dashboard, /<AccountLiveOverview/);
  assert.match(dashboard, /<AccountFavoritesPanel/);
  assert.match(dashboard, /Para meu site/);
  assert.match(dashboard, /Próximas camadas/);
  assert.ok(
    dashboard.indexOf("<AccountLiveOverview") < dashboard.indexOf("Para meu site"),
    "o resumo pessoal deve aparecer antes da área de publicação",
  );
  assert.ok(
    dashboard.indexOf("<AccountFavoritesPanel") < dashboard.indexOf("Para meu site"),
    "favoritos devem permanecer na experiência pessoal, antes dos widgets",
  );
});

test("painel vivo e favoritos vivos compartilham um único snapshot autenticado", () => {
  assert.match(dashboard, /useServerFn\(getAccountDashboardLiveSnapshot\)/);
  assert.match(dashboard, /liveSnapshot\?\.weather/);
  assert.match(dashboard, /liveSnapshot\?\.favorites/);
  assert.match(dashboard, /onFavoritesChanged=\{refreshLiveSnapshot\}/);
  assert.match(liveFunctions, /client\.auth\.getUser\(\)/);
  assert.match(liveFunctions, /\.from\("user_favorites"\)/);
  assert.match(liveFunctions, /\.eq\("user_id", user\.id\)/);
  assert.match(liveFunctions, /Cache-Control", "private, no-store, max-age=0"/);
  assert.doesNotMatch(liveOverview, /getWeatherIntelligence|getAggregatedPelotasWeather/);
});

test("snapshot usa as fontes canônicas e só busca hidrologia quando o favorito exige", () => {
  assert.match(liveFunctions, /fetchAggregatedPelotasWeather/);
  assert.match(liveFunctions, /fetchSelectedLaranjalLevelData/);
  assert.match(liveFunctions, /fetchGuaibaObservation/);
  assert.match(liveFunctions, /fetchDefesaCivilHydroData/);
  assert.match(liveFunctions, /needsLaranjal/);
  assert.match(liveFunctions, /needsGuaiba/);
  assert.match(liveFunctions, /needsDefesaCivil/);
  assert.match(liveFunctions, /favoriteKeys\.includes\("laranjal-level"\)/);
  assert.match(liveFunctions, /favoriteKeys\.includes\("guaiba-level"\)/);
  assert.match(liveFunctions, /DCRS-00063/);
  assert.match(liveFunctions, /DCRS-00115/);
});

test("favoritos vivos mostram previsão e águas sem inventar classificação de risco", () => {
  assert.match(favoritesPanel, /Favoritos Vivos · Free/);
  assert.match(favoritesPanel, /FavoriteLiveContent/);
  assert.match(favoritesPanel, /card\.primary/);
  assert.match(favoritesPanel, /card\.secondary/);
  assert.match(favoritesPanel, /Atualizado/);
  assert.match(liveFunctions, /forecast-7-days/);
  assert.match(liveFunctions, /regional-waters/);
  assert.match(liveFunctions, /sao-goncalo-level/);
  assert.match(liveFunctions, /jaguarao-level/);
  assert.match(liveFunctions, /Tendência da fonte/);
  assert.match(liveFunctions, /Cada régua continua sendo interpretada na própria referência/);
  assert.doesNotMatch(liveFunctions, /cota de atenção|risco alto|risco baixo|inundação iminente/i);
});

test("painel vivo oferece leitura útil e rotas de aprofundamento", () => {
  assert.match(liveOverview, /Agora · medição/);
  assert.match(liveOverview, /Hoje/);
  assert.match(liveOverview, /Próximas horas/);
  assert.match(liveOverview, /Avisos oficiais/);
  assert.match(liveOverview, /to="\/tempo-hoje-pelotas"/);
  assert.match(liveOverview, /to="\/previsao-7-dias-pelotas"/);
  assert.match(liveOverview, /to="\/chuva-em-pelotas"/);
  assert.match(liveOverview, /to="\/alertas"/);
});

test("falha de dados não é substituída por valores inventados nem loading permanente", () => {
  assert.match(liveOverview, /failed:\s*boolean/);
  assert.match(liveOverview, /summary === null && !failed/);
  assert.match(dashboard, /setLiveFailed\(true\)/);
  assert.match(dashboard, /liveSnapshot === null && !liveFailed/);
  assert.match(liveOverview, /nenhuma informação demonstrativa foi exibida/);
  assert.match(liveFunctions, /EMPTY_WEATHER/);
  assert.doesNotMatch(liveFunctions, /Math\.random/);
  assert.doesNotMatch(liveFunctions, /mock|demo|exemplo/i);
});

test("painel vivo e favoritos vivos são responsivos e preservam foco de teclado", () => {
  assert.match(liveStyles, /grid-template-columns: repeat\(4/);
  assert.match(liveStyles, /@media \(max-width: 1120px\)/);
  assert.match(liveStyles, /@media \(max-width: 720px\)/);
  assert.match(liveStyles, /a:focus-visible/);
  assert.match(favoriteStyles, /account-favorites__shortcut--live/);
  assert.match(favoriteStyles, /@media \(max-width: 760px\)/);
  assert.match(favoriteStyles, /forced-colors: active/);
});
