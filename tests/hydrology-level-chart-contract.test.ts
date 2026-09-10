import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const chart = readFileSync("src/components/hydrology/HydrologyLevelChart.tsx", "utf8");
const chartCss = readFileSync("src/components/hydrology/HydrologyLevelChart.css", "utf8");
const guaiba = readFileSync("src/components/hydrology/GuaibaLevelPage.tsx", "utf8");
const laranjal = readFileSync("src/components/hydrology/HydrologyPages.tsx", "utf8");
const overview = readFileSync("src/components/hydrology/HydrologyOverviewV2.tsx", "utf8");
const lagoon = readFileSync("src/components/hydrology/LagoonHydrologyLocalityPage.tsx", "utf8");
const defesaCivil = readFileSync(
  "src/components/hydrology/DefesaCivilStationHydrologyPage.tsx",
  "utf8",
);

test("gráfico de nível compartilhado é rico e não se resume a uma linha", () => {
  assert.match(chart, /hydrology-rich-chart__summary/);
  assert.match(chart, /linearGradient/);
  assert.match(chart, /hydrology-rich-chart__area/);
  assert.match(chart, /hydrology-rich-chart__grid/);
  assert.match(chart, /hydrology-rich-chart__latest-guide/);
  assert.match(chart, /is-minimum/);
  assert.match(chart, /is-maximum/);
  assert.match(chart, /is-latest/);
  assert.match(chart, /Variação na janela/);
  assert.match(chart, /Mínimo observado/);
  assert.match(chart, /Máximo observado/);
  assert.match(chart, /references\.filter/);
});

test("gráfico de nível permanece responsivo e legível em telas estreitas", () => {
  assert.match(chartCss, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(chartCss, /overflow-x:\s*auto/);
  assert.match(chartCss, /@media \(max-width: 840px\)/);
  assert.match(chartCss, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(chartCss, /@media \(max-width: 560px\)/);
  assert.match(chartCss, /stroke-linecap:\s*round/);
  assert.match(chartCss, /stroke-linejoin:\s*round/);
});

test("Guaíba, Laranjal e visão integrada usam o mesmo componente de gráfico", () => {
  assert.match(guaiba, /import \{ HydrologyLevelChart \}/);
  assert.match(guaiba, /<HydrologyLevelChart/);
  assert.doesNotMatch(guaiba, /function GuaibaSparkline/);
  assert.doesNotMatch(guaiba, /<polyline/);

  assert.match(laranjal, /import \{ HydrologyLevelChart \}/);
  assert.match(laranjal, /<HydrologyLevelChart/);
  assert.doesNotMatch(laranjal, /function Sparkline/);

  assert.match(overview, /import \{ HydrologyLevelChart \}/);
  assert.match(overview, /<HydrologyLevelChart/);
  assert.doesNotMatch(overview, /function LevelSparkline/);
});

test("páginas locais da Lagoa abandonam o line chart isolado e usam o contrato compartilhado", () => {
  assert.match(lagoon, /import \{ HydrologyLevelChart \}/);
  assert.match(lagoon, /<HydrologyLevelChart/);
  assert.doesNotMatch(lagoon, /from "recharts"/);
  assert.doesNotMatch(lagoon, /<LineChart/);
  assert.match(lagoon, /Cota local publicada/);
  assert.match(lagoon, /Máxima de maio de 2024/);
});

test("estações da Defesa Civil não fabricam série quando só existe a leitura atual", () => {
  assert.match(defesaCivil, /<HydrologyLevelChart/);
  assert.match(defesaCivil, /station\.river\.levelM !== null/);
  assert.match(defesaCivil, /não cria pontos intermediários nem desenha uma tendência sem série histórica/);
  assert.match(chart, /hasSeries \? /);
  assert.match(chart, /hydrology-rich-chart__single-note/);
});
