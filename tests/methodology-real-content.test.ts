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

test("a nota exibida é identificada como qualidade meteorológica e a síntese mostra sua origem real", () => {
  assert.match(component, />Qualidade meteorológica</);
  assert.match(component, /weather\.weather\.quality\.score/);
  assert.match(component, /weather\.intelligence\.origin === "gemini"/);
  assert.match(component, /Síntese assistida por Gemini/);
  assert.match(component, /Regras determinísticas/);
  assert.doesNotMatch(component, />Estado atual<\/span>/);
});

test("o conteúdo explica corretamente os limites das réguas e das previsões", () => {
  assert.match(component, /Cada régua possui referência vertical e cota próprias/);
  assert.match(component, /não devem ser comparados diretamente/);
  assert.match(component, /não prevê\s+o nível do Laranjal apenas a partir do Guaíba/);
  assert.match(component, /Modelo global principal/);
  assert.match(component, /Modelo global de contingência/);
});

test("links externos e âncoras dos capítulos permanecem estruturados", () => {
  assert.match(component, /className="methodology-chapter-nav"/);
  assert.match(component, /href="#fontes-ativas"/);
  assert.match(component, /href="#fluxo-dados"/);
  assert.match(component, /href="#regras-integridade"/);
  assert.match(component, /href="#tipos-informacao"/);
  assert.match(component, /href="#limites-uso"/);
  assert.match(component, /rel="noopener noreferrer"/);
  assert.match(component, /aria-label=\{`Abrir página de \$\{source\.organization\} em nova aba`\}/);
});

test("a camada visual mantém responsividade e o contrato final oculta o índice legado", () => {
  assert.match(component, /MethodologyPageRefinement\.css/);
  assert.match(refinement, /backdrop-filter:\s*none/);
  assert.match(refinement, /\.methodology-chapter-nav/);
  assert.match(refinement, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(refinement, /data-category="hydrology"/);
  assert.match(refinement, /content-visibility:\s*auto/);
  assert.match(refinement, /@media \(max-width: 680px\)/);
  assert.match(refinement, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(homeContract, /\.methodology-chapter-nav\s*\{[\s\S]*display:\s*none/);
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
