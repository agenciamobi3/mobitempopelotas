import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260820025000_data_source_status_history.sql",
  "utf8",
);
const schedulerMigration = readFileSync(
  "supabase/migrations/20260828170000_data_status_supabase_scheduler.sql",
  "utf8",
);
const route = readFileSync("src/routes/status-dos-dados.tsx", "utf8");
const storage = readFileSync("src/lib/status/data-status-storage.server.ts", "utf8");
const freshness = readFileSync("src/lib/status/data-status-freshness.server.ts", "utf8");
const statusFunctions = readFileSync("src/lib/status/data-status.functions.ts", "utf8");
const collectorAuth = readFileSync(
  "src/lib/status/data-status-collector-auth.server.ts",
  "utf8",
);
const statusServer = readFileSync("src/lib/status/data-status.server.ts", "utf8");
const cronRoute = readFileSync("src/routes/api/cron/data-status.ts", "utf8");
const workflow = readFileSync(".github/workflows/data-status-monitor.yml", "utf8");
const oidc = readFileSync("src/lib/github-actions-oidc.server.ts", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");

test("o histórico persiste amostras, incidentes e manutenções com RLS privada", () => {
  assert.match(migration, /create table if not exists public\.data_source_status_checks/);
  assert.match(migration, /create table if not exists public\.data_source_incidents/);
  assert.match(migration, /create table if not exists public\.data_source_maintenance_windows/);
  assert.match(migration, /alter table public\.data_source_status_checks enable row level security/);
  assert.match(migration, /alter table public\.data_source_incidents enable row level security/);
  assert.match(migration, /grant execute on function public\.record_data_source_status/);
  assert.match(migration, /checked_at < p_checked_at - interval '180 days'/);
});

test("o registrador abre, atualiza e resolve incidentes sem expor as tabelas ao navegador", () => {
  assert.match(migration, /status = 'resolved'/);
  assert.match(migration, /where service_id = v_service_id\s+and status = 'open'/);
  assert.match(migration, /occurrence_count = occurrence_count \+ 1/);
  assert.match(storage, /createSupabaseAdminClient/);
  assert.match(storage, /record_data_source_status/);
  assert.match(storage, /get_data_source_availability/);
  assert.doesNotMatch(storage, /createSupabasePublicServerClient/);
});

test("a página de status mostra disponibilidade e histórico de incidentes", () => {
  assert.match(route, /getDataStatusPageData/);
  assert.match(route, /Histórico operacional/);
  assert.match(route, /Incidentes recentes/);
  assert.match(route, /Disponibilidade por integração/);
  assert.match(route, /Duração monitorada/);
  assert.match(route, /Manutenções programadas/);
  assert.match(route, /aproximadamente a cada 10 minutos/);
  assert.match(publicRoutes, /path: "\/status-dos-dados"/);
});

test("probes meteorológicos medem as integrações sem depender da composição Weather AI", () => {
  assert.match(statusServer, /fetchPelotasWeather/);
  assert.match(statusServer, /fetchOfficialWeatherSources/);
  assert.match(statusServer, /getEmbrapaHealthSnapshotServer/);
  assert.match(statusServer, /baselineResult\.value\.providers\["open-meteo"\]/);
  assert.match(statusServer, /baselineResult\.value\.providers\["met-norway"\]/);
  assert.match(statusServer, /stateFromEmbrapaHealth/);
  assert.match(statusServer, /health\.collector\.lastSuccessAt/);
  assert.doesNotMatch(statusServer, /getWeatherIntelligence/);
});

test("a Defesa Civil RS entra no monitoramento operacional como fonte pública real", () => {
  assert.match(statusServer, /fetchDefesaCivilHydroData/);
  assert.match(statusServer, /defesaCivilResult/);
  assert.match(statusServer, /id: "defesa-civil-rs-hydromet"/);
  assert.match(statusServer, /provider: "Defesa Civil RS \/ Casa Militar"/);
  assert.match(statusServer, /data\.regionalStationCount/);
  assert.match(statusServer, /data\.recentStationCount/);
  assert.match(statusServer, /data\.inventory\.HYDROLOGY/);
  assert.match(statusServer, /data\.inventory\.METEOROLOGY/);
  assert.match(statusServer, /data\.inventory\.BOTH/);
  assert.match(statusServer, /sourceUrl: data\.source\.mapUrl/);
  assert.doesNotMatch(statusServer, /state:\s*"implementation"[\s\S]{0,120}defesa-civil-rs-hydromet/);
});

test("o monitor possui agendamento primário no Supabase sem duplicar o token em secrets externos", () => {
  assert.match(schedulerMigration, /create extension if not exists pg_cron/);
  assert.match(schedulerMigration, /create extension if not exists pg_net/);
  assert.match(schedulerMigration, /data_source_status_monitor_settings/);
  assert.match(schedulerMigration, /collector_token text not null default encode\(extensions\.gen_random_bytes/);
  assert.match(schedulerMigration, /net\.http_post/);
  assert.match(schedulerMigration, /'X-Collector-Token', settings\.collector_token/);
  assert.match(schedulerMigration, /tempo-pelotas-data-status-monitor/);
  assert.match(schedulerMigration, /'\*\/10 \* \* \* \*'/);
  assert.match(schedulerMigration, /last_seen_at < now\(\) - interval '30 minutes'/);
  assert.match(collectorAuth, /timingSafeEqual/);
  assert.match(collectorAuth, /data_source_status_monitor_settings/);
  assert.match(cronRoute, /authorizeDataStatusCollectorToken/);
});

test("histórico atrasado não é apresentado como disponibilidade atual", () => {
  assert.match(freshness, /DATA_STATUS_MAX_HISTORY_AGE_MS = 30 \* 60 \* 1_000/);
  assert.match(freshness, /order\("checked_at", \{ ascending: false \}\)/);
  assert.match(freshness, /staleHistoryMessage/);
  assert.match(statusFunctions, /getDataStatusHistoryFreshness/);
  assert.match(statusFunctions, /history\.available && freshness\.stale/);
  assert.match(statusFunctions, /available: false as const/);
  assert.match(statusFunctions, /staleHistoryMessage\(freshness\.latestAt\)/);
});

test("GitHub OIDC permanece como caminho operacional secundário sem cron de coleta duplicado", () => {
  assert.match(cronRoute, /verifyDataStatusGithubActionsRequest/);
  assert.match(cronRoute, /recordDataStatusOverview/);
  assert.match(workflow, /OIDC_AUDIENCE: tempo-pelotas-data-status/);
  assert.match(workflow, /https:\/\/tempopelotas\.com\.br\/api\/cron\/data-status/);
  assert.match(workflow, /cron:\s*"30 10 \* \* \*"/);
  assert.doesNotMatch(workflow, /cron:\s*"\*\/10 \* \* \* \*"/);
  assert.match(workflow, /if: github\.event_name != 'schedule'/);
  assert.match(oidc, /DATA_STATUS_GITHUB_OIDC_AUDIENCE = "tempo-pelotas-data-status"/);
  assert.match(oidc, /data-status-monitor\.yml/);
});
