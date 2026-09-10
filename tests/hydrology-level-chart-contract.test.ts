import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const chart = readFileSync("src/components/hydrology/HydrologyLevelChart.tsx", "utf8");
const chartCss = readFileSync("src/components/hydrology/HydrologyLevelChart.css", "utf8");
const movementMath = readFileSync("src/lib/hydrology/level-movement.ts", "utf8");
const levelSeries = readFileSync("src/lib/hydrology/level-series.ts", "utf8");
const guaiba = readFileSync("src/components/hydrology/GuaibaLevelPage.tsx", "utf8");
const laranjal = readFileSync("src/components/hydrology/HydrologyPages.tsx", "utf8");
const overview = readFileSync("src/components/hydrology/HydrologyOverviewV2.tsx", "utf8");
const lagoon = readFileSync("src/components/hydrology/LagoonHydrologyLocalityPage.tsx", "utf8");
const lagoonExplorer = readFileSync(
  "src/components/hydrology/LagoonNetworkLevelExplorer.tsx",
  "utf8",
);
const lagoonExplorerCss = readFileSync(
  "src/components/hydrology/LagoonNetworkLevelExplorer.css",
  "utf8",
);
const defesaCivil = readFileSync(
  "src/components/hydrology/DefesaCivilStationHydrologyPage.tsx",
  "utf8",
);
const qualityWorkflow = readFileSync(".github/workflows/quality.yml", "utf8");
const laranjalRoute = readFileSync("src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx", "utf8");
const lagoonLocalityRoute = readFileSync(
  "src/routes/nivel-da-lagoa-dos-patos/$localitySlug.tsx",
  "utf8",
);
const guaibaRoute = readFileSync("src/routes/nivel-do-guaiba.tsx", "utf8");
const saoGoncaloRoute = readFileSync("src/routes/nivel-do-canal-sao-goncalo.tsx", "utf8");
const jaguaraoRoute = readFileSync("src/routes/nivel-do-rio-jaguarao.tsx", "utf8");
const overviewRoute = readFileSync("src/routes/situacao-hidrologica-pelotas.tsx", "utf8");

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

test("série compartilhada centraliza ordem temporal, deduplicação e descarte de inválidos", () => {
  assert.match(chart, /normalizeHydrologyLevelSeries/);
  assert.match(chart, /hydrologyGapThresholdMs/);
  assert.match(chart, /splitHydrologySeriesOnGaps/);
  assert.doesNotMatch(chart, /function normalizePoints/);
  assert.doesNotMatch(chart, /function splitCoordinatesOnGaps/);

  assert.match(levelSeries, /function normalizeHydrologyLevelSeries/);
  assert.match(levelSeries, /new Map<number, T & \{ epoch: number \}>/);
  assert.match(levelSeries, /new Date\(point\.timestamp\)\.getTime\(\)/);
  assert.match(levelSeries, /!Number\.isFinite\(point\.level\)/);
  assert.match(levelSeries, /!Number\.isFinite\(epoch\)/);
  assert.match(levelSeries, /\.sort\(\(left, right\) => left\.epoch - right\.epoch\)/);
});

test("eixo horizontal respeita tempo real e lacunas usam a política compartilhada", () => {
  assert.match(chart, /const timeRange = Math\.max\(1, latestEpoch - firstEpoch\)/);
  assert.match(chart, /const xForEpoch = \(epoch: number\)/);
  assert.match(chart, /\(epoch - firstEpoch\) \/ timeRange/);
  assert.match(chart, /GAP_MULTIPLIER = 2\.5/);
  assert.match(
    chart,
    /hydrologyGapThresholdMs\(valid, \{ multiplier: GAP_MULTIPLIER \}\)/,
  );
  assert.match(chart, /splitHydrologySeriesOnGaps\(coordinates, thresholdMs\)/);
  assert.match(chart, /segment\.length >= 2/);
  assert.match(chart, /série com lacunas/);
  assert.match(chart, /não liga\s+artificialmente períodos sem observação/);
  assert.match(levelSeries, /DEFAULT_HYDROLOGY_GAP_MULTIPLIER = 2\.5/);
  assert.match(levelSeries, /function hydrologyGapThresholdMs/);
  assert.match(levelSeries, /function splitHydrologySeriesOnGaps/);
  assert.match(chartCss, /hydrology-rich-chart__gap-note/);
});

test("movimento recente usa helper puro e apenas o último trecho contínuo da série", () => {
  assert.match(chart, /deriveRecentHydrologyMovement/);
  assert.match(chart, /toHydrologyCentimeters/);
  assert.match(chart, /const latestSegment = segments\.at\(-1\) \?\? \[\]/);
  assert.match(chart, /const movement = deriveRecentHydrologyMovement\(latestSegment, unit\)/);
  assert.match(chart, /Movimento recente/);
  assert.match(chart, /Ritmo recente/);
  assert.match(chart, /Amplitude observada/);
  assert.match(chart, /Diferença entre o máximo e o mínimo da janela/);
  assert.match(chart, /hydrology-rich-chart__recent-line/);
  assert.match(chart, /formatRate\(movement\.rateCmPerHour\)/);

  assert.match(movementMath, /RECENT_MOVEMENT_WINDOW_MS = 3 \* 60 \* 60 \* 1_000/);
  assert.match(movementMath, /MOVEMENT_RATE_EPSILON_CM_PER_HOUR = 0\.1/);
  assert.match(movementMath, /function normalizeMovementPoints/);
  assert.match(movementMath, /new Map<number, HydrologyTimedLevelPoint>/);
  assert.match(movementMath, /!Number\.isFinite\(point\.epoch\)/);
  assert.match(movementMath, /!Number\.isFinite\(point\.level\)/);
  assert.match(movementMath, /deriveRecentHydrologyMovement/);
  assert.match(
    movementMath,
    /toHydrologyCentimeters\(latest\.level - start\.level, unit\)/,
  );
  assert.match(
    movementMath,
    /rateCmPerHour = changeCm \/ \(durationMs \/ \(60 \* 60 \* 1_000\)\)/,
  );

  assert.match(chartCss, /hydrology-rich-chart__motion/);
  assert.match(chartCss, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(chartCss, /hydrology-rich-chart__recent-line/);
  assert.match(chartCss, /stroke-width:\s*6/);
});

test("gráfico de nível permanece responsivo e legível em telas estreitas", () => {
  assert.match(chartCss, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(chartCss, /overflow-x:\s*auto/);
  assert.match(chartCss, /-webkit-overflow-scrolling:\s*touch/);
  assert.match(chartCss, /@media \(max-width: 840px\)/);
  assert.match(chartCss, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(chartCss, /@media \(max-width: 560px\)/);
  assert.match(
    chartCss,
    /hydrology-rich-chart__motion[\s\S]{0,100}grid-template-columns:\s*minmax\(0, 1fr\)/,
  );
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
  assert.match(chart, /className="hydrology-rich-chart__plot"[\s\S]{0,120}role="region"/);
  assert.match(chart, /role="region"[\s\S]{0,80}tabIndex=\{0\}/);
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

test("índice da Lagoa oferece uma única área gráfica com seletor de estação", () => {
  assert.match(lagoon, /import \{ LagoonNetworkLevelExplorer \}/);
  assert.match(lagoon, /<LagoonNetworkLevelExplorer network=\{network\} \/>/);
  assert.match(lagoonExplorer, /useState\(initialStationId\)/);
  assert.match(lagoonExplorer, /role="group"/);
  assert.match(lagoonExplorer, /aria-pressed=\{selectedNow\}/);
  assert.match(lagoonExplorer, /setSelectedStationId\(itemLocality\.stationId\)/);
  assert.match(lagoonExplorer, /<HydrologyLevelChart/);
  assert.match(lagoonExplorer, /references=\{references\}/);
  assert.match(lagoonExplorer, /hydrologyLocalityPath\(locality\)/);
  assert.match(lagoonExplorer, /não são convertidos nem somados entre si/);
  assert.match(lagoonExplorer, /não cria uma curva sem histórico real/);
  assert.doesNotMatch(lagoonExplorer, /<HydrologyLevelChart[\s\S]*\.map\(/);
});

test("seletor de estações da Lagoa é adaptável sem empilhar cinco gráficos", () => {
  assert.match(lagoonExplorerCss, /grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(lagoonExplorerCss, /@media \(max-width: 1180px\)/);
  assert.match(lagoonExplorerCss, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(lagoonExplorerCss, /@media \(max-width: 880px\)/);
  assert.match(lagoonExplorerCss, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(lagoonExplorerCss, /@media \(max-width: 620px\)/);
  assert.match(lagoonExplorerCss, /overflow-x:\s*auto/);
  assert.match(lagoonExplorerCss, /scroll-snap-type:\s*x proximity/);
  assert.match(lagoonExplorerCss, /@media \(forced-colors: active\)/);
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

test("rotas detalhadas de nível apontam para componentes cobertos pelo gráfico compartilhado", () => {
  assert.match(laranjalRoute, /<LaranjalLevelPage/);
  assert.match(lagoonLocalityRoute, /<LagoonHydrologyLocalityPage/);
  assert.match(guaibaRoute, /<GuaibaLevelPage/);
  assert.match(saoGoncaloRoute, /<DefesaCivilStationHydrologyPage/);
  assert.match(jaguaraoRoute, /<DefesaCivilStationHydrologyPage/);
  assert.match(overviewRoute, /<HydrologyOverviewV2/);
});

test("workflow de qualidade executa contratos visual, movimento e série dos gráficos de nível", () => {
  assert.match(qualityWorkflow, /Contrato visual dos gráficos de nível/);
  assert.match(qualityWorkflow, /hydrology-level-chart-contract\.test\.ts/);
  assert.match(qualityWorkflow, /hydrology-level-movement\.test\.ts/);
  assert.match(qualityWorkflow, /hydrology-level-series\.test\.ts/);
});
