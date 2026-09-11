import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dashboard = readFileSync("src/components/auth/AccountDashboard.tsx", "utf8");
const liveOverview = readFileSync("src/components/auth/AccountLiveOverview.tsx", "utf8");
const liveStyles = readFileSync("src/components/auth/AccountLiveOverview.css", "utf8");

test("painel Free coloca valor pessoal antes das ferramentas de publicação", () => {
  assert.match(dashboard, /Meu Tempo Pelotas/);
  assert.match(dashboard, /<AccountLiveOverview \/>/);
  assert.match(dashboard, /<AccountFavoritesPanel snapshot=\{favorites\} \/>/);
  assert.match(dashboard, /Para meu site/);
  assert.match(dashboard, /Próximas camadas/);
  assert.ok(
    dashboard.indexOf("<AccountLiveOverview />") < dashboard.indexOf("Para meu site"),
    "o resumo pessoal deve aparecer antes da área de publicação",
  );
  assert.ok(
    dashboard.indexOf("<AccountFavoritesPanel snapshot={favorites} />") <
      dashboard.indexOf("Para meu site"),
    "favoritos devem permanecer na experiência pessoal, antes dos widgets",
  );
});

test("painel vivo reutiliza a consolidação meteorológica real do portal", () => {
  assert.match(liveOverview, /getWeatherIntelligence/);
  assert.match(liveOverview, /toProductionWeatherData/);
  assert.match(liveOverview, /toProductionAlerts/);
  assert.match(liveOverview, /weatherConditionLabels/);
  assert.match(liveOverview, /weather\.hourly\.slice\(0, 6\)/);
  assert.match(liveOverview, /alert\.relevance === "pelotas"/);
  assert.doesNotMatch(liveOverview, /Math\.random/);
  assert.doesNotMatch(liveOverview, /mock|demo|exemplo/i);
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

test("falha de dados não é substituída por valores inventados", () => {
  assert.match(liveOverview, /status === "unavailable"/);
  assert.match(liveOverview, /nenhuma informação demonstrativa foi exibida/);
  assert.match(liveOverview, /fallbackWeatherData/);
});

test("painel vivo é responsivo e preserva foco de teclado", () => {
  assert.match(liveStyles, /grid-template-columns: repeat\(4/);
  assert.match(liveStyles, /@media \(max-width: 1120px\)/);
  assert.match(liveStyles, /@media \(max-width: 720px\)/);
  assert.match(liveStyles, /a:focus-visible/);
});
