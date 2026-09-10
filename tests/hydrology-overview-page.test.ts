import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/situacao-hidrologica-pelotas.tsx", "utf8");
const loader = readFileSync("src/lib/hydrology/public-hydrology-page-loader.ts", "utf8");
const page = readFileSync("src/components/hydrology/HydrologyOverviewV2.tsx", "utf8");
const styles = readFileSync("src/components/hydrology/HydrologyOverviewV2.css", "utf8");
const homeContract = readFileSync(
  "src/components/hydrology/HydrologyOverviewHomeContract.css",
  "utf8",
);
const defesaCivilServer = readFileSync("src/lib/hydrology/defesa-civil-rs.server.ts", "utf8");
const defesaCivilFunction = readFileSync("src/lib/hydrology/defesa-civil-rs.functions.ts", "utf8");
const defesaCivilArea = readFileSync(
  "src/components/hydrology/DefesaCivilHydroNetwork.tsx",
  "utf8",
);
const defesaCivilMap = readFileSync("src/components/hydrology/DefesaCivilHydroMap.tsx", "utf8");
const defesaCivilStyles = readFileSync(
  "src/components/hydrology/DefesaCivilHydroNetwork.css",
  "utf8",
);
const envExample = readFileSync(".env.example", "utf8");

const hydrologySource = `${route}\n${page}`;
const defesaCivilSource = `${defesaCivilServer}\n${defesaCivilFunction}\n${defesaCivilArea}\n${defesaCivilMap}`;

test("hydrology route loads six independent sources through the resilient shared loader", () => {
  assert.match(route, /createFileRoute\("\/situacao-hidrologica-pelotas"\)/);
  assert.match(route, /loadHydrologyOverviewPageData/);
  assert.match(route, /loader: \(\) => loadHydrologyOverviewPageData\(\)/);
  assert.match(loader, /getWeatherIntelligence\(\)/);
  assert.match(loader, /getLaranjalLevelData\(\)/);
  assert.match(loader, /getGuaibaObservation\(\)/);
  assert.match(loader, /getLagoonMonitoringNetwork\(\)/);
  assert.match(loader, /getSaceGuaibaData\(\)/);
  assert.match(loader, /getDefesaCivilHydroData\(\)/);
  assert.match(loader, /Promise\.allSettled/);
  assert.doesNotMatch(loader, /await Promise\.all\(/);
  assert.match(
    loader,
    /settlePageDependency\(\(\) => getWeatherIntelligence\(\), createUnavailableWeatherIntelligence\)/,
  );
  assert.match(loader, /createUnavailableLaranjalLevelData/);
  assert.match(loader, /createUnavailableGuaibaObservationData/);
  assert.match(loader, /createUnavailableLagoonMonitoringNetworkData/);
  assert.match(loader, /createUnavailableSaceGuaibaData/);
  assert.match(loader, /createUnavailableDefesaCivilHydroData/);
  assert.match(
    loader,
    /settledValueOrFallback\(weatherResult, createUnavailableWeatherIntelligence\)/,
  );
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /HydrologyOverviewHero/);
  assert.match(route, /HydrologyOverviewV2/);
  assert.match(route, /DefesaCivilHydroNetwork/);
  assert.doesNotMatch(route, /useHydrologyNetworkRecovery/);
  assert.match(route, /sace=\{data\.sace\}/);
  assert.match(route, /data=\{data\.defesaCivil\}/);
  assert.match(route, /weather=\{recoveredWeather\}/);
  assert.match(route, /HydrologyOverviewHomeContract\.css/);
  assert.match(route, /pageClassName="internal-weather-shell--hydrology"/);
  assert.match(route, /showOfficialAlerts=\{false\}/);
  assert.match(route, /staleTime: 60 \* 1_000/);
});

test("Defesa Civil RS integration is server-side, public by default and keeps an explicit kill switch", () => {
  assert.match(
    defesaCivilServer,
    /https:\/\/redehidrometeorologica\.defesacivil\.rs\.gov\.br\/graphql/,
  );
  assert.match(defesaCivilServer, /casa-militar-defesa-civil-rs/);
  assert.match(defesaCivilServer, /codigos: \["43"\]/);
  assert.match(defesaCivilServer, /tipo: UNIDADE_FEDERATIVA/);
  assert.match(defesaCivilArea, /data\.status === "disabled"/);
  assert.match(defesaCivilFunction, /createServerFn\(\{ method: "GET" \}\)/);
  assert.match(defesaCivilFunction, /DEFESA_CIVIL_HYDRO_ENABLED/);
  assert.match(
    defesaCivilFunction,
    /process\.env\.DEFESA_CIVIL_HYDRO_ENABLED\?\.trim\(\)\.toLowerCase\(\) !== "false"/,
  );
  assert.match(
    defesaCivilFunction,
    /fetchDefesaCivilHydroData\(\{ enabled: isPublicDefesaCivilHydroEnabled\(\) \}\)/,
  );
  assert.match(defesaCivilFunction, /stale-while-revalidate=300/);
  assert.match(envExample, /^DEFESA_CIVIL_HYDRO_ENABLED=true$/m);
  assert.doesNotMatch(defesaCivilSource, /VITE_DEFESA_CIVIL/i);
  assert.doesNotMatch(defesaCivilSource, /api[_-]?key|authorization:\s*bearer/i);
});

test("Defesa Civil RS adapter preserves observation identity, timestamp and missing-data semantics", () => {
  assert.match(defesaCivilServer, /stationSchema/);
  assert.match(defesaCivilServer, /codigo: z\.string\(\)\.min\(1\)/);
  assert.match(defesaCivilServer, /observedAt/);
  assert.match(defesaCivilServer, /ageMinutes/);
  assert.match(defesaCivilServer, /freshness/);
  assert.match(defesaCivilServer, /river:[\s\S]*levelM/);
  assert.match(defesaCivilServer, /h24Mm/);
  assert.match(defesaCivilServer, /temperatureC/);
  assert.match(defesaCivilServer, /humidityPct/);
  assert.match(defesaCivilServer, /windAverageKmh/);
  assert.match(defesaCivilServer, /REGIONAL_RADIUS_KM = 320/);
  assert.match(defesaCivilServer, /distanceFromPelotasKm/);
  assert.match(defesaCivilServer, /Number\.isFinite\(parsed\) \? parsed : null/);
  assert.match(defesaCivilServer, /if \(!normalized\) return null/);
  assert.match(defesaCivilServer, /FUTURE_TIMESTAMP_TOLERANCE_MS = 5 \* 60_000/);
  assert.match(defesaCivilServer, /function trustedObservedAt/);
  assert.match(
    defesaCivilServer,
    /observed\.getTime\(\) > fetchedAt\.getTime\(\) \+ FUTURE_TIMESTAMP_TOLERANCE_MS/,
  );
  assert.match(
    defesaCivilServer,
    /const observedAt = trustedObservedAt\(station\.timestamp, fetchedAt\)/,
  );
  assert.doesNotMatch(defesaCivilServer, /\?\?\s*0\b/);
});

test("Defesa Civil RS area gives explicit institutional credit and keeps observations separate from alerts", () => {
  assert.match(defesaCivilArea, /Rede oficial · Defesa Civil RS/);
  assert.match(defesaCivilArea, /Leituras oficiais da Rede de Monitoramento Hidrometeorológico/);
  assert.match(defesaCivilArea, /ajuda a disseminar informações de órgãos públicos e fontes confiáveis/);
  assert.match(defesaCivilArea, /preservando estação, horário, unidade e origem/);
  assert.match(
    defesaCivilArea,
    /sem transformar essas medições em alerta ou\s+previsão de cheia/,
  );
  assert.match(
    defesaCivilArea,
    /não\s+representa estado operacional, nível de atenção ou classificação oficial de\s+risco/,
  );
  assert.match(
    defesaCivilArea,
    /não substitui os canais oficiais de alerta e orientação da Defesa Civil/,
  );
  assert.match(defesaCivilArea, /Fonte oficial e créditos/);
  assert.match(defesaCivilArea, /Casa Militar do Estado do\s+Rio Grande do Sul/);
  assert.match(defesaCivilArea, /Dados disponibilizados pela Defesa Civil RS através da MKS/);
  assert.match(defesaCivilArea, /Abrir mapa oficial/);
  assert.match(defesaCivilArea, /Documentação da API/);
  assert.match(defesaCivilArea, /formatDateTime\(station\.observedAt\)/);
  assert.match(defesaCivilArea, /ageLabel\(station\.ageMinutes\)/);
});

test("Defesa Civil RS map and section preserve safe rendering and responsive accessibility", () => {
  assert.match(defesaCivilMap, /void import\("maplibre-gl"\)/);
  assert.match(defesaCivilMap, /setText\(/);
  assert.doesNotMatch(defesaCivilMap, /setHTML\(/);
  assert.match(defesaCivilMap, /cooperativeGestures: true/);
  assert.match(defesaCivilMap, /map\.dragRotate\.disable\(\)/);
  assert.match(defesaCivilMap, /Defesa Civil RS — Rede de Monitoramento Hidrometeorológico/);
  assert.match(defesaCivilStyles, /content-visibility:\s*auto/);
  assert.match(defesaCivilStyles, /scroll-margin-top:\s*8rem/);
  assert.match(defesaCivilStyles, /@media \(max-width: 680px\)/);
  assert.match(defesaCivilStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(defesaCivilStyles, /@media \(forced-colors: active\)/);
  assert.match(defesaCivilStyles, /:focus-visible/);
});

test("local station distinguishes live, stale and unavailable readings in the hero", () => {
  assert.match(page, /level\.status === "live"/);
  assert.match(page, /level\.status === "stale"/);
  assert.match(page, /Última leitura conhecida/);
  assert.match(page, /Leitura indisponível/);
  assert.match(page, /role="status"/);
  assert.doesNotMatch(page, /level\.status === "stale"[^\n]{0,220}label:\s*"Nível atual"/i);
});

test("hero keeps the last collection beside the status and removes the duplicate telemetry strip", () => {
  assert.match(page, /\{status\.label\}[\s\S]{0,120}formatDateTime\(level\.updatedAt\)/);
  assert.doesNotMatch(page, /id="estado-da-telemetria"/);
  assert.doesNotMatch(page, /Situação da Estação Laranjal/);
  assert.doesNotMatch(page, /Nível local disponível/);
  assert.doesNotMatch(page, /Horário da medição/);
  assert.doesNotMatch(page, /Tempo desde a leitura/);
  assert.doesNotMatch(page, /Consulta do portal/);
  assert.match(homeContract, /hydrology-v2-hero__reading > header[\s\S]*display:\s*flex/);
});

test("Laranjal level preserves its own reference and avoids cross-station conversion", () => {
  assert.match(page, /referência própria do equipamento/);
  assert.match(page, /não deve ser comparado diretamente com números absolutos de outras estações/);
  assert.match(page, /Este valor não é uma classificação de risco/);
  assert.match(page, /não usa[\s\S]*cotas de Atenção, Alerta ou Inundação de outras estações/);
  assert.match(route, /os números não devem ser comparados por simples subtração/i);
  assert.match(route, /não são convertidas em classificação para o Laranjal/);
  assert.doesNotMatch(hydrologySource, /cota de inundação do Laranjal:\s*\d/i);
  assert.doesNotMatch(page, /LabHidroSens\/UFPel/);
  assert.doesNotMatch(page, /Referência local da UFPel/);
});

test("local warning keeps its copy and external station link aligned in one content column", () => {
  assert.match(page, /hydrology-v2-reference-warning[\s\S]*<ShieldAlert[\s\S]*<div>[\s\S]*<p>/);
  assert.match(page, /Abrir painel da estação/);
  assert.match(homeContract, /hydrology-v2-reference-warning > div[\s\S]*display:\s*grid/);
  assert.match(homeContract, /hydrology-v2-reference-warning a[\s\S]*width:\s*fit-content/);
});

test("local series exposes shared recent movement and changes without inventing missing data", () => {
  assert.match(page, /<HydrologyLevelChart/);
  assert.match(page, /points=\{level\.series\}/);
  assert.match(page, /deriveRecentHydrologySeriesMovement\(level\.series, "m"\)/);
  assert.doesNotMatch(page, /level\.trendCmPerHour/);
  assert.match(page, /Movimento recente/);
  assert.match(page, /último trecho contínuo das medições válidas/);
  assert.match(page, /level\.change1hCm/);
  assert.match(page, /level\.change6hCm/);
  assert.match(page, /level\.change24hCm/);
  assert.match(page, /level\.periodMinimum/);
  assert.match(page, /level\.periodAverage/);
  assert.match(page, /level\.periodMaximum/);
  assert.match(page, /Não há medições suficientes/);
  assert.match(page, /não é substituída por uma estimativa de nível/);
});

test("regional network and SACE remain context rather than local forecasts", () => {
  assert.match(page, /RegionalWaterNetwork/);
  assert.match(page, /SaceGuaibaContext/);
  assert.match(page, /Cada estação deve ser lida na sua própria referência/);
  assert.match(page, /não transforma automaticamente níveis e categorias/);
  assert.match(route, /A situação dos rios ajuda a entender o cenário/);
  assert.match(route, /Uma estação elevada no SACE significa que o Laranjal vai subir\?/);
  assert.match(route, /sem transformá-la em risco para Pelotas/);
});

test("weather context uses real observations separately from a complete 24-hour forecast", () => {
  assert.match(page, /weather\.weather\.hourly\.slice\(0, 24\)/);
  assert.match(page, /if \(hourly\.length < 24\)/);
  assert.match(page, /completeHourlyValues/);
  assert.match(page, /precipitationMm/);
  assert.match(page, /precipitationProbability/);
  assert.match(page, /windGust/);
  assert.match(page, /weather\.weather\.quality\.currentSource/);
  assert.match(page, /currentSource === "embrapa"/);
  assert.match(page, /currentSource === "defesa-civil-rs"/);
  assert.match(page, /weather\.weather\.observation/);
  assert.match(page, /defesaCivil\.rain\.h1Mm/);
  assert.match(page, /defesaCivilHealth\.usable/);
  assert.match(page, /current\.windSpeed/);
  assert.match(page, /Chuva observada · 1 h/);
  assert.match(page, /Condição observada e previsão · 24 horas/);
  assert.match(page, /Total somente quando as 24 horas estão completas/);
  assert.match(page, /não calculam sozinhos quanto o nível do Laranjal vai subir/);
});

test("absence of transmission is never interpreted as normal level", () => {
  assert.match(page, /Uma estação sem transmissão não deve ser interpretada como nível normal/);
  assert.match(route, /Quando uma estação não transmite, não há dado atual/);
  assert.match(route, /Ausência de transmissão significa que o rio está normal\?/);
  assert.doesNotMatch(hydrologySource, /sem transmissão\s+(?:significa|confirma|indica)\s+(?:que\s+)?(?:o\s+)?nível normal/i);
});

test("hydrology page publishes transparent dataset metadata only with a local reading", () => {
  assert.match(page, /const datasetSchema = level\.currentLevel !== null/);
  assert.match(page, /"@type": "Dataset"/);
  assert.match(page, /spatialCoverage/);
  assert.match(page, /level\.source\.url/);
  assert.match(page, /lagoon\.source\.url/);
  assert.match(page, /sace\.source\.url/);
  assert.match(page, /isAccessibleForFree: true/);
});

test("hydrology overview follows the clean internal editorial layout", () => {
  assert.match(styles, /internal-weather-shell--hydrology \.hydrology-v2-hero/);
  assert.match(styles, /max-width: var\(--internal-weather-frame-max/);
  assert.match(styles, /background:\s*var\(--hydro-soft\)/);
  assert.match(styles, /\.hydrology-v2-chapters \{\s*display:\s*none/);
  assert.match(styles, /content-visibility:\s*auto/);
  assert.match(styles, /scroll-margin-top:\s*8rem/);
  assert.match(styles, /@media \(max-width: 1180px\)/);
  assert.match(styles, /@media \(max-width: 920px\)/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /:focus-visible/);
  assert.doesNotMatch(styles, /radial-gradient|linear-gradient/);
  assert.doesNotMatch(styles, /font-size:\s*0\.[0-6][0-9]rem/);
});

test("hydrology Home contract keeps water identity and responsive observed-weather refinement", () => {
  assert.match(homeContract, /Situação das águas — acento hidrológico discreto/);
  assert.match(homeContract, /\.hydrology-v2-hero__content,[\s\S]*\.hydrology-v2-hero__reading[\s\S]*background:\s*transparent/);
  assert.match(homeContract, /\.hydrology-v2-hero__content::before,[\s\S]*\.hydrology-v2-hero__reading::before[\s\S]*display:\s*none/);
  assert.match(homeContract, /\.hydrology-v2-hero__actions a:first-child[\s\S]*background:\s*#071e2f/);
  assert.match(homeContract, /\.hydrology-v2-weather-observed[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(homeContract, /\.hydrology-v2-weather-grid[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(homeContract, /radial-gradient|linear-gradient/);
  assert.match(homeContract, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(homeContract, /!important/);
});
