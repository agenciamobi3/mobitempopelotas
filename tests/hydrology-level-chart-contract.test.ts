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
const qualityWorkflow = readFileSync(".github/workflows/quality.yml", "utf8");

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
  assert.match(chart, /validReferences/);
  assert.match(chart, /Referências desta régua/);
  assert.match(chart, /Fora da escala atual/);
});

test("série compartilhada normaliza ordem temporal e não aceita pontos inválidos", () => {
  assert.match(chart, /function normalizePoints/);
  assert.match(chart, /new Map<number, HydrologyLevelChartPoint>/);
  assert.match(chart, /new Date\(point\.timestamp\)\.getTime\(\)/);
  assert.match(chart, /!Number\.isFinite\(point\.level\)/);
  assert.match(chart, /!Number\.isFinite\(timestamp\)/);
  assert.match(chart, /\.sort\(\(\[left\], \[right\]\) => left - right\)/);
});

test("gráfico de nível permanece responsivo e legível em telas estreitas", () => {
  assert.match(chartCss, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(chartCss, /overflow-x:\s*auto/);
  assert.match(chartCss, /-webkit-overflow-scrolling:\s*touch/);
  assert.match(chartCss, /@media \(max-width: 840px\)/);
  assert.match(chartCss, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(chartCss, /@media \(max-width: 560px\)/);
  assert.match(chartCss, /stroke-linecap:\s*round/);
  assert.match(chartCss, /stroke-linejoin:\s*round/);
  assert.match(chartCss, /hydrology-rich-chart__plot:focus-visible/);
  assert.match(chartCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(chartCss, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(chartCss, /!important/);
});

test("pontos da série oferecem inspeção sem criar uma floresta de tab stops", () => {
  assert.match(chart, /hydrology-rich-chart__hit-point/);
  assert.match(chart, /<title>\{`\$\{formatLevel\(point\.level, unit\)\}/);
  assert.doesNotMatch(chart, /className="hydrology-rich-chart__hit-point"[\s\S]{0,180}tabIndex/);
  assert.match(chart, /className="hydrology-rich-chart__plot"[\s\S]{0,120}tabIndex=\{0\}/);
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
  assert.match(
    defesaCivil,
    /não cria pontos intermediários nem desenha uma tendência sem série histórica/,
  );
  assert.match(chart, /hasSeries \?/);
  assert.match(chart, /hydrology-rich-chart__single-note/);
});

test("workflow de qualidade executa o contrato dos gráficos de nível", () => {
  assert.match(qualityWorkflow, /Contrato visual dos gráficos de nível/);
  assert.match(qualityWorkflow, /node --test tests\/hydrology-level-chart-contract\.test\.ts/);
});
