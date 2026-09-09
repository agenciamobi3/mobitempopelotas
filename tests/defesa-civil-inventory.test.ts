import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const server = readFileSync("src/lib/hydrology/defesa-civil-rs.server.ts", "utf8");
const area = readFileSync("src/components/hydrology/DefesaCivilHydroNetwork.tsx", "utf8");
const styles = readFileSync("src/components/hydrology/DefesaCivilHydroInventory.css", "utf8");
const endpoint = readFileSync("src/routes/api/defesa-civil/stations.ts", "utf8");
const regionalRegistry = readFileSync("src/lib/hydrology/defesa-civil-regional-pages.ts", "utf8");
const regionalModule = readFileSync("src/components/regional/RegionalCityDefesaCivil.tsx", "utf8");
const dedicatedPage = readFileSync("src/components/hydrology/DefesaCivilStationHydrologyPage.tsx", "utf8");
const dedicatedStyles = readFileSync("src/components/hydrology/DefesaCivilStationHydrologyPage.css", "utf8");
const jaguaraoRoute = readFileSync("src/routes/nivel-do-rio-jaguarao.tsx", "utf8");
const saoGoncaloRoute = readFileSync("src/routes/nivel-do-canal-sao-goncalo.tsx", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");

test("Defesa Civil station inventory preserves official capability flags", () => {
  assert.match(server, /filter:[\s\S]*relacao:/);
  assert.match(server, /tem_chuva_acumulada/);
  assert.match(server, /tem_nivel_do_rio/);
  assert.match(server, /tem_pressao_atmosferica/);
  assert.match(server, /tem_umidade/);
  assert.match(server, /tem_vento/);
  assert.match(server, /function toFlag/);
  assert.match(server, /function stationCapabilities/);
});

test("Defesa Civil classifies stations from capabilities instead of station names", () => {
  assert.match(server, /DefesaCivilStationClassification/);
  assert.match(server, /"HYDROLOGY"/);
  assert.match(server, /"METEOROLOGY"/);
  assert.match(server, /"BOTH"/);
  assert.match(server, /"UNKNOWN"/);
  assert.match(server, /const hydrology = capabilities\.riverLevel/);
  assert.match(server, /const meteorology =/);
  assert.doesNotMatch(server, /stationName\(station\)[\s\S]{0,160}(HYDROLOGY|METEOROLOGY|BOTH)/);
});

test("Defesa Civil preserves richer documented hydrology and rainfall fields as optional data", () => {
  assert.match(server, /rio_nivel_tendencia \{ value \}/);
  assert.match(server, /rio_area_drenagem \{ value \}/);
  assert.match(server, /h048 \{ value \}/);
  assert.match(server, /h072 \{ value \}/);
  assert.match(server, /h096 \{ value \}/);
  assert.match(server, /h120 \{ value \}/);
  assert.match(server, /h144 \{ value \}/);
  assert.match(server, /trend: metricText\(station\.data\?\.rio\?\.rio_nivel_tendencia\)/);
  assert.match(server, /drainageArea: metricValue\(station\.data\?\.rio\?\.rio_area_drenagem\)/);
  assert.match(server, /h48Mm: metricValue\(rain\?\.h048\)/);
  assert.match(server, /h144Mm: metricValue\(rain\?\.h144\)/);
  assert.doesNotMatch(server, /\?\?\s*0\b/);
});

test("regional inventory counts each dynamic station classification", () => {
  assert.match(server, /inventory: Record<DefesaCivilStationClassification, number>/);
  assert.match(server, /emptyInventory\(\)/);
  assert.match(server, /summary\[station\.classification\] \+= 1/);
  assert.match(area, /data\.inventory\.HYDROLOGY/);
  assert.match(area, /data\.inventory\.METEOROLOGY/);
  assert.match(area, /data\.inventory\.BOTH/);
  assert.match(area, /data\.inventory\.UNKNOWN/);
});

test("live Defesa Civil station cards keep number formatting and sensor semantics safe", () => {
  assert.match(area, /const maximumFractionDigits = Math\.max\(0, digits\)/);
  assert.match(area, /Math\.min\(1, maximumFractionDigits\)/);
  assert.match(area, /const hasHydrology = station\.capabilities\.riverLevel/);
  assert.doesNotMatch(area, /station\.capabilities\.riverLevel \|\| station\.river\.levelM !== null/);
});

test("public network UI keeps source context but omits raw station trend cards", () => {
  assert.match(area, /Inventário regional por capacidade/);
  assert.match(area, /Classificação automática baseada nas capacidades e variáveis/);
  assert.match(area, /não representa risco, prioridade ou estado operacional oficial/);
  assert.doesNotMatch(area, /Tendência informada pela estação/);
  assert.doesNotMatch(area, /preservado como dado da fonte/);
  assert.doesNotMatch(area, /defesa-civil-hydro__river-trend/);
  assert.match(area, /Fonte oficial e créditos/);
  assert.match(area, /Dados disponibilizados pela Defesa Civil RS através da MKS/);
});

test("sanitized public endpoint exposes only normalized station inventory", () => {
  assert.match(endpoint, /createFileRoute\("\/api\/defesa-civil\/stations"\)/);
  assert.match(endpoint, /fetchDefesaCivilHydroData\(\)/);
  assert.match(endpoint, /X-Robots-Tag": "noindex, nofollow"/);
  assert.match(endpoint, /X-Content-Type-Options": "nosniff"/);
  assert.match(endpoint, /classification: station\.classification/);
  assert.match(endpoint, /capabilities: station\.capabilities/);
  assert.match(endpoint, /trend: station\.river\.trend/);
  assert.match(endpoint, /h144Mm: station\.rain\.h144Mm/);
  assert.doesNotMatch(endpoint, /raw|cookie|authorization|token|secret/i);
  assert.doesNotMatch(endpoint, /drainageArea/);
});

test("inventory UI remains responsive and readable without trend-card styling", () => {
  assert.match(styles, /\.defesa-civil-hydro__inventory/);
  assert.match(styles, /\.defesa-civil-hydro__classification/);
  assert.doesNotMatch(styles, /\.defesa-civil-hydro__river-trend/);
  assert.match(styles, /@media \(max-width: 680px\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(styles, /!important/);
});

test("only autonomous Defesa Civil intents are promoted to dedicated hydrology pages", () => {
  assert.match(regionalRegistry, /"jaguarao-rs": \{[\s\S]*path: "\/nivel-do-rio-jaguarao"[\s\S]*stationCode: "DCRS-00115"/);
  assert.match(regionalRegistry, /"capao-do-leao-rs": \{[\s\S]*path: "\/nivel-do-canal-sao-goncalo"[\s\S]*stationCode: "DCRS-00063"/);
  assert.doesNotMatch(regionalRegistry, /"turucu-rs": \{\s*path:/);
  assert.doesNotMatch(regionalRegistry, /"cristal-rs": \{\s*path:/);
  assert.doesNotMatch(regionalRegistry, /"arroio-grande-rs": \{\s*path:/);
  assert.doesNotMatch(regionalRegistry, /"bage-rs": \{\s*path:/);
  assert.doesNotMatch(regionalRegistry, /"santa-vitoria-do-palmar-rs": \{\s*path:/);
  assert.match(regionalModule, /regionalDefesaCivilDedicatedPage\(citySlug\)/);
  assert.match(regionalModule, /className="regional-defesa-civil__dedicated-link"/);
});

test("dedicated Defesa Civil pages preserve local reference and never synthesize risk", () => {
  assert.match(dedicatedPage, /station\.river\.levelM/);
  assert.match(dedicatedPage, /station\.river\.trend/);
  assert.match(dedicatedPage, /station\.rain\.h1Mm/);
  assert.match(dedicatedPage, /station\.rain\.h24Mm/);
  assert.match(dedicatedPage, /não troca a ausência\s+por zero/);
  assert.match(dedicatedPage, /não transforma o\s+valor, sozinho, em cota de atenção ou inundação/);
  assert.match(dedicatedPage, /não faz conversões automáticas entre elas/);
  assert.doesNotMatch(dedicatedPage, /\?\?\s*0\b/);
});

test("dedicated Defesa Civil pages use the clean editorial surface contract", () => {
  assert.match(dedicatedStyles, /--station-soft:\s*#f5f8f8/);
  assert.match(dedicatedStyles, /\.defesa-civil-station-page__hero[\s\S]*border-bottom:/);
  assert.match(dedicatedStyles, /\.defesa-civil-station-page__primary-reading[\s\S]*border-bottom:/);
  assert.doesNotMatch(dedicatedStyles, /box-shadow:/);
  assert.match(dedicatedStyles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("Jaguarão and Canal São Gonçalo routes are indexable, source-backed and distinct from weather pages", () => {
  assert.match(jaguaraoRoute, /createFileRoute\("\/nivel-do-rio-jaguarao"\)/);
  assert.match(jaguaraoRoute, /stationCode: "DCRS-00115"/);
  assert.match(jaguaraoRoute, /loader: \(\) => getDefesaCivilHydroData\(\)/);
  assert.match(jaguaraoRoute, /weatherPath: "\/tempo-em\/jaguarao-rs"/);
  assert.match(jaguaraoRoute, /Nível do Rio Jaguarão hoje/);
  assert.match(jaguaraoRoute, /location: PAGE_LOCATION/);
  assert.match(jaguaraoRoute, /addressLocality: "Jaguarão"/);

  assert.match(saoGoncaloRoute, /createFileRoute\("\/nivel-do-canal-sao-goncalo"\)/);
  assert.match(saoGoncaloRoute, /stationCode: "DCRS-00063"/);
  assert.match(saoGoncaloRoute, /loader: \(\) => getDefesaCivilHydroData\(\)/);
  assert.match(saoGoncaloRoute, /weatherPath: "\/tempo-em\/capao-do-leao-rs"/);
  assert.match(saoGoncaloRoute, /não é a mesma do Porto de Pelotas/);
  assert.match(saoGoncaloRoute, /location: PAGE_LOCATION/);
  assert.match(saoGoncaloRoute, /addressLocality: "Capão do Leão"/);

  assert.match(publicRoutes, /path: "\/nivel-do-rio-jaguarao", changeFrequency: "hourly"/);
  assert.match(publicRoutes, /path: "\/nivel-do-canal-sao-goncalo", changeFrequency: "hourly"/);
});
