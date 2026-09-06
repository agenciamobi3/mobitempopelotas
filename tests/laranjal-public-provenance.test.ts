import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const embed = readFileSync("src/components/embed/LaranjalLevelEmbed.tsx", "utf8");
const embedGuide = readFileSync("src/components/embed/LaranjalEmbedGuide.tsx", "utf8");
const widgetApi = readFileSync("src/routes/api/widgets/nivel-laranjal.ts", "utf8");
const publicPortal = readFileSync("src/lib/public-portal.server.ts", "utf8");
const homeWater = readFileSync("src/production/components/home-water-editorial.tsx", "utf8");
const methodologyLoader = readFileSync(
  "src/lib/methodology/methodology-page-loader.ts",
  "utf8",
);
const historicalArchive = readFileSync("src/lib/history/historical-archive.server.ts", "utf8");

test("widget visual identifica a proveniência realmente selecionada", () => {
  assert.match(embed, /data\.source\.station/);
  assert.match(embed, /data\.source\.name/);
  assert.match(embed, /data\.source\.reference/);
  assert.match(embed, /data\.source\.role === "contingency"/);
  assert.doesNotMatch(embed, /Fonte: LabHidroSens \/ UFPel/);
  assert.doesNotMatch(embed, />Tempo real</);
  assert.match(embedGuide, /à fonte identificada no widget/);
  assert.doesNotMatch(embedGuide, /atribuição ao Tempo Pelotas e à UFPel/);
});

test("API do widget e snapshot público usam o seletor local", () => {
  assert.match(widgetApi, /fetchSelectedLaranjalLevelData/);
  assert.doesNotMatch(widgetApi, /fetchLaranjalLevelData/);
  assert.match(publicPortal, /fetchSelectedLaranjalLevelData/);
  assert.match(publicPortal, /source\.role === "contingency"/);
  assert.match(publicPortal, /source\.station/);
  assert.match(publicPortal, /source\.name/);
  assert.doesNotMatch(publicPortal, /import \{ fetchLaranjalLevelData \}/);
});

test("Home troca o rótulo geográfico quando a fonte local é CIEX/FURG", () => {
  assert.match(homeWater, /laranjal\.source\.role === "contingency"/);
  assert.match(homeWater, /const localPlace = alternative \? "Pelotas" : "Praia do Laranjal"/);
  assert.match(homeWater, /laranjal\.source\.location/);
  assert.match(homeWater, /laranjal\.source\.station/);
  assert.match(homeWater, /laranjal\.source\.reference/);
  assert.match(homeWater, /Nível da Lagoa em Pelotas e referências regionais/);
});

test("Metodologia audita Lab como fonte primária sem mascará-lo pelo seletor", () => {
  assert.match(methodologyLoader, /fetchLaranjalLevelData/);
  assert.doesNotMatch(methodologyLoader, /getLaranjalLevelData/);
  assert.doesNotMatch(methodologyLoader, /fetchSelectedLaranjalLevelData/);
  assert.match(methodologyLoader, /fonte\s+primária em si/);
});

test("arquivo histórico continua coletando a série Lab sem passar pelo seletor", () => {
  assert.match(historicalArchive, /fetchLaranjalLevelData/);
  assert.match(historicalArchive, /sourceKey: "labhidrosens-ufpel"/);
  assert.match(historicalArchive, /stationKey: "labhidrosens-laranjal"/);
  assert.doesNotMatch(historicalArchive, /fetchSelectedLaranjalLevelData/);
});
