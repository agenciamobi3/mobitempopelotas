import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");
const guaibaRoute = readFileSync("src/routes/nivel-do-guaiba.tsx", "utf8");
const saoGoncaloRoute = readFileSync("src/routes/nivel-do-canal-sao-goncalo.tsx", "utf8");
const jaguaraoRoute = readFileSync("src/routes/nivel-do-rio-jaguarao.tsx", "utf8");
const defesaCivilRefresh = readFileSync(
  "src/components/hydrology/DefesaCivilStationVisualRefresh.css",
  "utf8",
);

const LEVEL_ROUTES = [
  ["Guaíba", "/nivel-do-guaiba", guaibaRoute],
  ["Canal São Gonçalo", "/nivel-do-canal-sao-goncalo", saoGoncaloRoute],
  ["Rio Jaguarão", "/nivel-do-rio-jaguarao", jaguaraoRoute],
] as const;

test("páginas detalhadas de nível usam o contrato editorial e não ContentPageShell", () => {
  for (const [label, , source] of LEVEL_ROUTES) {
    assert.match(source, /hydrology-editorial-route/, `${label} deve usar a rota editorial`);
    assert.doesNotMatch(source, /ContentPageShell/, `${label} não deve voltar ao shell de conteúdo antigo`);
  }
});

test("páginas detalhadas de nível deixam o SiteLayout moderno montar header e footer", () => {
  const standaloneBlock = siteLayout.match(/const internalWeatherStandaloneRoutes = \[([\s\S]*?)\] as const;/)?.[1] ?? "";

  for (const [label, path] of LEVEL_ROUTES) {
    assert.ok(!standaloneBlock.includes(`"${path}"`), `${label} não deve constar nas rotas standalone`);
  }
});

test("estações da Defesa Civil compartilham refresh visual editorial escopado", () => {
  assert.match(saoGoncaloRoute, /DefesaCivilStationVisualRefresh\.css/);
  assert.match(jaguaraoRoute, /DefesaCivilStationVisualRefresh\.css/);
  assert.match(saoGoncaloRoute, /hydrology-editorial-route--defesa-civil-station/);
  assert.match(jaguaraoRoute, /hydrology-editorial-route--defesa-civil-station/);
  assert.match(defesaCivilRefresh, /\.hydrology-editorial-route--defesa-civil-station/);
  assert.match(defesaCivilRefresh, /width: 100vw/);
  assert.match(defesaCivilRefresh, /linear-gradient\(105deg/);
});
