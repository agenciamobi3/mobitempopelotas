import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const access = readFileSync("src/lib/auth/registered-enrichment.functions.ts", "utf8");
const component = readFileSync("src/components/auth/RegisteredWeatherEnrichment.tsx", "utf8");
const hydrology = readFileSync("src/components/auth/RegisteredHydrologyEnrichment.tsx", "utf8");
const hydrologySeries = readFileSync(
  "src/components/auth/RegisteredSeriesHydrologyEnrichment.tsx",
  "utf8",
);
const hydrologyOverview = readFileSync(
  "src/components/auth/RegisteredHydrologyOverviewEnrichment.tsx",
  "utf8",
);
const extendedForecast = readFileSync(
  "src/components/auth/RegisteredExtendedForecastEnrichment.tsx",
  "utf8",
);
const meteogramEnrichment = readFileSync(
  "src/components/auth/RegisteredMeteogramEnrichment.tsx",
  "utf8",
);
const styles = readFileSync("src/components/auth/RegisteredWeatherEnrichment.css", "utf8");
const today = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");
const rain = readFileSync("src/routes/chuva-em-pelotas.tsx", "utf8");
const wind = readFileSync("src/routes/vento-em-pelotas.tsx", "utf8");
const week = readFileSync("src/routes/previsao-7-dias-pelotas.tsx", "utf8");
const extendedRoute = readFileSync("src/routes/previsao-15-dias-pelotas.tsx", "utf8");
const meteogramRoute = readFileSync("src/routes/meteograma-pelotas.tsx", "utf8");
const saoGoncalo = readFileSync("src/routes/nivel-do-canal-sao-goncalo.tsx", "utf8");
const jaguarao = readFileSync("src/routes/nivel-do-rio-jaguarao.tsx", "utf8");
const laranjal = readFileSync("src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx", "utf8");
const guaiba = readFileSync("src/routes/nivel-do-guaiba.tsx", "utf8");
const hydrologyRoute = readFileSync("src/routes/situacao-hidrologica-pelotas.tsx", "utf8");

test("enriquecimento Free exige apenas sessão autenticada e resposta privada", () => {
  assert.match(access, /createServerFn\(\{ method: "GET" \}\)/);
  assert.match(access, /client\.auth\.getUser\(\)/);
  assert.match(access, /status:\s*"authenticated"/);
  assert.match(access, /status:\s*"unauthenticated"/);
  assert.match(access, /Cache-Control", "private, no-store, max-age=0"/);
  assert.match(access, /Vary", "Cookie, Authorization"/);
  assert.doesNotMatch(access, /service_role|createSupabaseAdminClient/);
});

test("camada cadastrada usa dados reais já consolidados e não cria números demonstrativos", () => {
  assert.match(component, /data\.weather\.hourly/);
  assert.match(component, /data\.weather\.daily/);
  assert.match(component, /data\.weather\.quality/);
  assert.match(component, /visibilityKm/);
  assert.match(component, /cloudCoverLow/);
  assert.match(component, /cape/);
  assert.match(component, /dewPoint/);
  assert.match(component, /precipitationMm/);
  assert.match(component, /precipitationProbability/);
  assert.match(component, /windGust/);
  assert.match(component, /quality\.discrepancies/);
  assert.match(component, /quality\.degradedSources/);
  assert.doesNotMatch(component, /Math\.random|mock|demo|exemplo/i);
});

test("visitante público recebe convite Free sem os detalhes autenticados", () => {
  assert.match(component, /access\.status === "unauthenticated"/);
  assert.match(component, /Entrar gratuitamente/);
  assert.match(component, /A informação pública desta página continua aberta/);
  assert.match(component, /não transforma dados públicos em conteúdo pago/);
  assert.match(component, /to="\/conta"/);
});

test("páginas meteorológicas dedicadas recebem enriquecimento contextual", () => {
  assert.match(today, /RegisteredWeatherEnrichment/);
  assert.match(today, /variant="today"/);
  assert.match(rain, /RegisteredWeatherEnrichment/);
  assert.match(rain, /variant="rain"/);
  assert.match(wind, /RegisteredWeatherEnrichment/);
  assert.match(wind, /variant="wind"/);
  assert.match(week, /RegisteredWeatherEnrichment/);
  assert.match(week, /variant="week"/);
});

test("enriquecimento preserva semântica meteorológica e rastreabilidade", () => {
  assert.match(component, /Acumulado previsto · 24h/);
  assert.match(component, /Não é chuva já medida/);
  assert.match(component, /Temperatura × orvalho · 6h/);
  assert.match(component, /quanto menor, mais próximo o ar está da saturação/);
  assert.match(component, /Qualidade da consolidação/);
  assert.match(component, /Diferenças entre fontes/);
  assert.match(component, /Contexto da coleta/);
  assert.match(component, /Valores derivados continuam sujeitos às limitações/);
});

test("páginas hidrológicas Defesa Civil recebem contexto Free da mesma rede", () => {
  assert.match(saoGoncalo, /RegisteredHydrologyEnrichment/);
  assert.match(saoGoncalo, /stationCode="DCRS-00063"/);
  assert.match(jaguarao, /RegisteredHydrologyEnrichment/);
  assert.match(jaguarao, /stationCode="DCRS-00115"/);
  assert.match(hydrology, /station\.rain\.h1Mm/);
  assert.match(hydrology, /station\.rain\.h6Mm/);
  assert.match(hydrology, /station\.rain\.h12Mm/);
  assert.match(hydrology, /station\.rain\.h24Mm/);
  assert.match(hydrology, /station\.rain\.h72Mm/);
  assert.match(hydrology, /station\.rain\.h168Mm/);
  assert.match(hydrology, /data\.recentStationCount/);
  assert.match(hydrology, /data\.regionalStationCount/);
  assert.match(hydrology, /data\.statewideStationCount/);
});

test("contexto hidrológico Defesa Civil não transforma réguas em classificação inventada", () => {
  assert.match(hydrology, /não para comparar diretamente suas cotas/);
  assert.match(hydrology, /referência física continuam próprios de cada régua/);
  assert.match(hydrology, /não representa automaticamente toda a bacia/);
  assert.match(hydrology, /não cria uma cobrança sobre os dados da rede/);
  assert.doesNotMatch(hydrology, /risco alto|risco baixo|cota de atenção|inundação iminente/i);
});

test("Laranjal aprofunda somente a própria série e usa o nível atualizado do cliente", () => {
  assert.match(laranjal, /RegisteredSeriesHydrologyEnrichment/);
  assert.match(laranjal, /variant="laranjal"/);
  assert.match(laranjal, /data=\{level\}/);
  assert.match(hydrologySeries, /data\.change1hCm/);
  assert.match(hydrologySeries, /data\.change6hCm/);
  assert.match(hydrologySeries, /data\.change24hCm/);
  assert.match(hydrologySeries, /data\.periodAverage/);
  assert.match(hydrologySeries, /data\.periodMinimum/);
  assert.match(hydrologySeries, /data\.periodMaximum/);
  assert.match(hydrologySeries, /mesma série da Estação Laranjal/);
  assert.match(hydrologySeries, /não inventa classificação de risco/);
});

test("Guaíba mantém Cais Mauá e Gasômetro como referências independentes", () => {
  assert.match(guaiba, /RegisteredSeriesHydrologyEnrichment/);
  assert.match(guaiba, /variant="guaiba"/);
  assert.match(hydrologySeries, /data\.references \?\? \[\]/);
  assert.match(hydrologySeries, /Cais Mauá e Gasômetro não formam uma única régua/);
  assert.match(hydrologySeries, /não subtrai nem normaliza as duas séries/);
  assert.match(hydrologySeries, /reference\.floodReference/);
  assert.match(hydrologySeries, /data\.distanceToFloodReference/);
  assert.match(hydrologySeries, /não é transferido para Pelotas nem para outras réguas/);
});

test("Situação das Águas resume cobertura das redes sem criar uma cota comum", () => {
  assert.match(hydrologyRoute, /RegisteredHydrologyOverviewEnrichment/);
  assert.match(hydrologyRoute, /defesaCivil=\{data\.defesaCivil\}/);
  assert.match(hydrologyRoute, /anaRhnRegional=\{data\.anaRhnRegional\}/);
  assert.match(hydrologyOverview, /availableLayers/);
  assert.match(hydrologyOverview, /lagoon\.available/);
  assert.match(hydrologyOverview, /defesaCivil\.recentStationCount/);
  assert.match(hydrologyOverview, /anaRhnRegional\.stations\.length/);
  assert.match(hydrologyOverview, /sace\.counts\.transmitting/);
  assert.match(hydrologyOverview, /sace\.counts\.aboveNormal/);
  assert.match(hydrologyOverview, /Não cria uma cota única/);
  assert.match(hydrologyOverview, /Não transforma ausência de dado em condição normal/);
});

test("previsão de 15 dias separa planejamento próximo da segunda semana", () => {
  assert.match(extendedRoute, /RegisteredExtendedForecastEnrichment/);
  assert.match(extendedRoute, /forecast=\{extendedForecast\}/);
  assert.match(extendedForecast, /forecast\.days\.slice\(0, 7\)/);
  assert.match(extendedForecast, /forecast\.days\.slice\(7, 15\)/);
  assert.match(extendedForecast, /forecast\.source\.returnedDays/);
  assert.match(extendedForecast, /forecast\.source\.requestedDays/);
  assert.match(extendedForecast, /forecast\.source\.model/);
  assert.match(extendedForecast, /tendência para planejamento/);
  assert.match(extendedForecast, /não transforme uma previsão distante em alerta ou certeza operacional/i);
});

test("meteograma Free resume somente as horas realmente recebidas", () => {
  assert.match(meteogramRoute, /RegisteredMeteogramEnrichment/);
  assert.match(meteogramRoute, /meteogram=\{meteogram\}/);
  assert.match(meteogramEnrichment, /meteogram\.hours\.slice\(0, 48\)/);
  assert.match(meteogramEnrichment, /precipitationMm/);
  assert.match(meteogramEnrichment, /visibilityKm/);
  assert.match(meteogramEnrichment, /hour\.cape/);
  assert.match(meteogramEnrichment, /hour\.dewPoint/);
  assert.match(meteogramEnrichment, /hour\.pressure/);
  assert.match(meteogramEnrichment, /hour\.windGust/);
  assert.match(meteogramEnrichment, /proximidade indica ar mais próximo da saturação, não confirmação de neblina/);
  assert.match(meteogramEnrichment, /não cria alertas meteorológicos próprios/);
  assert.match(meteogramEnrichment, /permanece ausente em vez de ser preenchido artificialmente/);
});

test("segunda leva reaproveita o payload da página e não cria funções de dados privadas", () => {
  for (const source of [hydrologySeries, hydrologyOverview, extendedForecast, meteogramEnrichment]) {
    assert.match(source, /getRegisteredEnrichmentAccess/);
    assert.doesNotMatch(source, /createServerFn|service_role|fetch\(/);
    assert.doesNotMatch(source, /Math\.random|mock|demo|exemplo/i);
  }
});

test("superfície Free permanece responsiva e acessível", () => {
  assert.match(styles, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 1040px\)/);
  assert.match(styles, /@media \(max-width: 720px\)/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /forced-colors: active/);
});
