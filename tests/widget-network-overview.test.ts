import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const analyticsFunctions = readFileSync("src/lib/widgets/widget-analytics.functions.ts", "utf8");
const networkOverview = readFileSync("src/components/widgets/WidgetNetworkOverview.tsx", "utf8");
const networkStyles = readFileSync("src/components/widgets/WidgetNetworkOverview.css", "utf8");
const widgetBuilder = readFileSync("src/components/widgets/WidgetBuilder.tsx", "utf8");

test("visão da rede nasce da mesma leitura agregada dos widgets", () => {
  assert.match(analyticsFunctions, /export type WidgetAnalyticsPayload/);
  assert.match(analyticsFunctions, /widgets: WidgetAnalyticsSnapshot/);
  assert.match(analyticsFunctions, /network: WidgetNetworkAnalyticsSummary/);
  assert.match(analyticsFunctions, /const networkHosts = new Map/);
  assert.match(analyticsFunctions, /networkLast30Days \+= loads/);
  assert.match(analyticsFunctions, /rankHosts\(networkHosts\)/);
  assert.match(analyticsFunctions, /TOP_DISTRIBUTION_WIDGETS = 5/);
  assert.match(analyticsFunctions, /topWidgets30Days: rankedWidgets\.slice/);
  assert.doesNotMatch(analyticsFunctions, /from\("widget_installations"\)/);
});

test("painel consolida alcance, sites e widgets sem chamar analytics outra vez", () => {
  assert.match(widgetBuilder, /type WidgetAnalyticsPayload/);
  assert.match(widgetBuilder, /WidgetNetworkOverview/);
  assert.match(widgetBuilder, /summary=\{analytics\.network\}/);
  assert.match(widgetBuilder, /summary=\{analytics\.widgets\[widget\.id\]\}/);
  assert.equal((widgetBuilder.match(/useServerFn\(getWidgetAnalyticsSnapshot\)/g) ?? []).length, 1);
  assert.match(networkOverview, /Rede de distribuição/);
  assert.match(networkOverview, /Visualizações/);
  assert.match(networkOverview, /Sites parceiros/);
  assert.match(networkOverview, /Widgets distribuídos/);
  assert.match(networkOverview, /Principais domínios/);
  assert.match(networkOverview, /Widgets mais vistos/);
  assert.match(networkOverview, /domínios externos[\s\S]*últimos 30 dias/);
});

test("rankings da rede mostram participação, atividade e estado vazio responsivo", () => {
  assert.match(networkOverview, /%/);
  assert.match(networkOverview, /Última atividade em/);
  assert.match(networkOverview, /<progress/);
  assert.match(networkOverview, /Ainda não há domínios externos registrados/);
  assert.match(networkOverview, /Nenhum widget teve uso externo nesta janela/);
  assert.match(networkStyles, /widget-network__rankings/);
  assert.match(networkStyles, /grid-template-columns: repeat\(2/);
  assert.match(networkStyles, /@media \(max-width: 800px\)/);
  assert.match(networkStyles, /grid-template-columns: 1fr/);
});
