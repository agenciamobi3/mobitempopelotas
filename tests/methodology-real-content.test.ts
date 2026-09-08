import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/metodologia.tsx", "utf8");
const loader = readFileSync("src/lib/methodology/methodology-page-loader.ts", "utf8");
const hydrologyFallbacks = readFileSync(
  "src/lib/hydrology/public-hydrology-page-loader.ts",
  "utf8",
);
const redemetFallback = readFileSync("src/lib/redemet/redemet-fallback.ts", "utf8");
const component = readFileSync("src/components/methodology/MethodologyPage.tsx", "utf8");
const refinement = readFileSync(
  "src/components/methodology/MethodologyPageRefinement.css",
  "utf8",
);
const homeContract = readFileSync(
  "src/components/methodology/MethodologyHomeContract.css",
  "utf8",
);

test("a rota de metodologia usa um loader único para todas as integrações ativas", () => {
  assert.match(route, /loadMethodologyPageData/);
  assert.match(route, /loader: \(\) => loadMethodologyPageData\(\)/);
  assert.match(loader, /getWeatherIntelligence\(\)/);
  assert.match(loader, /getLaranjalLevelData\(\)/);
  assert.match(loader, /getRedemetOverview\(\)/);
  assert.match(loader, /getGuaibaObservation\(\)/);
  assert.match(loader, /getLagoonMonitoringNetwork\(\)/);
  assert.match(loader, /getForecastAccuracySummary\(\)/);
  assert.match(route, /guaiba=\{data\.guaiba\}/);
  assert.match(route, /lagoon=\{data\.lagoon\}/);
});

test("falha isolada de fonte não promove a metodologia ao boundary global", () => {
  assert.match(loader, /Promise\.allSettled/);
  assert.doesNotMatch(loader, /await Promise\.all\(/);
  assert.match(loader, /createUnavailableWeatherIntelligence\(\)/);
  assert.match(loader, /createUnavailableLaranjalLevelData\(\)/);
  assert.match(loader, /createUnavailableRedemetOverview\(\)/);
  assert.match(loader, /createUnavailableGuaibaObservationData\(\)/);
  assert.match(loader, /createUnavailableLagoonMonitoringNetworkData\(\)/);
  assert.match(loader, /createUnavailableAccuracy\(\)/);
  assert.match(hydrologyFallbacks, /status: "unavailable"/);
  assert.match(hydrologyFallbacks, /currentLevel: null/);
  assert.match(redemetFallback, /available: false/);
  assert.match(redemetFallback, /frames: \[\]/);
  assert.match(loader, /providers: \[\]/);
});

test("o inventário apresenta cinco integrações meteorológicas e três hidrológicas", () => {
  for (const sourceId of [
    "embrapa",
    "inmet",
    "cppmet",
    "redemet",
    "forecast",
    "laranjal",
    "guaiba",
    "lagoon-network",
  ]) {
    assert.match(component, new RegExp(`id: "${sourceId}"`));
  }

  assert.match(component, /meteorologyCards\.length/);
  assert.match(component, /hydrologyCards\.length/);
  assert.match(component, /guaiba\.source\.name/);
  assert.match(component, /guaiba\.station/);
  assert.match(component, /lagoon\.source\.organizations/);
  assert.match(component, /lagoon\.available/);
  assert.match(component, /lagoon\.total/);
});

test("a nota exibida é identificada como qualidade dos dados e a síntese mostra sua origem real", () => {
  assert.match(component, />Qualidade dos dados do tempo</);
  assert.match(component, /weather\.weather\.quality\.score/);
  assert.match(component, /weather\.intelligence\.origin === "gemini"/);
  assert.match(component, /Resumo com apoio do Gemini/);
  assert.match(component, /Resumo montado pelo portal/);
  assert.doesNotMatch(component, />Estado atual<\/span>/);
});

test("o conteúdo explica corretamente os limites das réguas e das previsões", () => {
  assert.match(component, /Cada estação usa uma referência própria/);
  assert.match(component, /não devem ser comparados diretamente/);
  assert.match(component, /não calcula o\s+nível futuro do Laranjal apenas pelo Guaíba/);
  assert.match(component, /Previsão detalhada principal/);
  assert.match(component, /Previsão usada quando a principal falha/);
});

test("seções continuam endereçáveis sem renderizar o índice numerado antigo", () => {
  for (const id of [
    "fontes-ativas",
    "fluxo-dados",
    "regras-integridade",
    "tipos-informacao",
    "limites-uso",
  ]) {
    assert.match(component, new RegExp(`id="${id}"`));
  }
  assert.doesNotMatch(component, /methodology-chapter-nav/);
  assert.match(component, /rel="noopener noreferrer"/);
  assert.match(component, /aria-label=\{`Abrir página de \$\{source\.organization\} em nova aba`\}/);
});

test("a camada visual permanece responsiva sem depender de CSS de navegação removida", () => {
  assert.match(component, /MethodologyPageRefinement\.css/);
  assert.match(refinement, /backdrop-filter:\s*none/);
  assert.doesNotMatch(refinement, /\.methodology-chapter-nav/);
  assert.match(refinement, /data-category="hydrology"/);
  assert.match(refinement, /content-visibility:\s*auto/);
  assert.match(refinement, /@media \(max-width: 680px\)/);
  assert.match(refinement, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(homeContract, /\.methodology-chapter-nav/);
});

test("metodologia usa composição técnica aberta sem decoração de dashboard", () => {
  assert.match(route, /MethodologyHomeContract\.css/);
  assert.match(homeContract, /transparência técnica em composição editorial aberta/i);
  assert.match(homeContract, /\.methodology-hero[\s\S]*background:\s*var\(--methodology-home-soft\)/);
  assert.match(homeContract, /\.methodology-hero[\s\S]*border-radius:\s*0[\s\S]*box-shadow:\s*none/);
  assert.match(homeContract, /\.methodology-source-card[\s\S]*border-top:\s*3px solid #18bdcd/);
  assert.match(homeContract, /data-category="hydrology"[\s\S]*border-top-color:\s*#5e2ced/);
  assert.match(homeContract, /\.methodology-pipeline[\s\S]*border-radius:\s*0/);
  assert.match(homeContract, /\.methodology-actions[\s\S]*background:\s*transparent/);
  assert.doesNotMatch(homeContract, /radial-gradient|linear-gradient/);
  assert.doesNotMatch(homeContract, /!important/);
});
