import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260911063644_add_account_dashboard_layout.sql",
  "utf8",
);
const layout = readFileSync("src/lib/auth/dashboard-layout.ts", "utf8");
const layoutFunctions = readFileSync("src/lib/auth/dashboard-layout.functions.ts", "utf8");
const accountFunctions = readFileSync("src/lib/auth/account.functions.ts", "utf8");
const dashboard = readFileSync("src/components/auth/AccountDashboard.tsx", "utf8");
const personalization = readFileSync("src/components/auth/DashboardPersonalization.tsx", "utf8");
const personalizationCss = readFileSync("src/components/auth/DashboardPersonalization.css", "utf8");
const liveOverview = readFileSync("src/components/auth/AccountLiveOverview.tsx", "utf8");
const favorites = readFileSync("src/components/auth/AccountFavoritesPanel.tsx", "utf8");
const accountExport = readFileSync("src/routes/api/account/export.ts", "utf8");

test("layout do painel fica no registro privado de preferências com limites", () => {
  assert.match(migration, /add column if not exists dashboard_layout jsonb not null default '\{\}'::jsonb/i);
  assert.match(migration, /jsonb_typeof\(dashboard_layout\) = 'object'/i);
  assert.match(migration, /octet_length\(dashboard_layout::text\) <= 16384/i);
  assert.doesNotMatch(migration, /create table/i);
});

test("contrato versionado aceita apenas seções cards e tamanhos conhecidos", () => {
  assert.match(layout, /version:\s*1/);
  assert.match(layout, /DASHBOARD_SECTION_IDS = \["live", "favorites", "site"\]/);
  assert.match(layout, /"weather-now"/);
  assert.match(layout, /"weather-today"/);
  assert.match(layout, /"weather-hours"/);
  assert.match(layout, /"weather-alerts"/);
  assert.match(layout, /DASHBOARD_CARD_SIZES = \["compact", "medium", "wide"\]/);
  assert.match(layout, /new Set\(values\)\.size !== values\.length/);
  assert.match(layout, /allowedSizeKeys/);
  assert.match(layout, /normalizeDashboardLayout/);
  assert.match(layout, /completeOrder/);
});

test("snapshot da conta lê layout e servidor salva somente na linha autenticada", () => {
  assert.match(accountFunctions, /dashboard_layout/);
  assert.match(accountFunctions, /normalizeDashboardLayout\(preferences\?\.dashboard_layout/);
  assert.match(layoutFunctions, /client\.auth\.getUser\(\)/);
  assert.match(layoutFunctions, /\.from\("user_preferences"\)/);
  assert.match(layoutFunctions, /dashboard_layout:\s*layout/);
  assert.match(layoutFunctions, /\.eq\("user_id", user\.id\)/);
  assert.match(layoutFunctions, /Cache-Control", "private, no-store, max-age=0"/);
  assert.doesNotMatch(layoutFunctions, /service_role|createSupabaseAdminClient/);
});

test("painel oferece edição explícita com salvar cancelar e restaurar padrão", () => {
  assert.match(dashboard, /useServerFn\(saveAccountDashboardLayout\)/);
  assert.match(dashboard, /DashboardPersonalizationBar/);
  assert.match(dashboard, /Personalizável/);
  assert.match(dashboard, /persistLayout/);
  assert.match(dashboard, /cancelCustomization/);
  assert.match(dashboard, /resetCustomization/);
  assert.match(dashboard, /DEFAULT_DASHBOARD_LAYOUT/);
  assert.match(personalization, /Personalizar painel/);
  assert.match(personalization, /Salvar layout/);
  assert.match(personalization, /Cancelar/);
  assert.match(personalization, /Padrão/);
});

test("seções têm drag and drop e alternativa por botões", () => {
  assert.match(dashboard, /moveDashboardItem\(current\.sections/);
  assert.match(dashboard, /placeDashboardItem\(current\.sections/);
  assert.match(dashboard, /startSectionDrag/);
  assert.match(dashboard, /dropSection/);
  assert.match(personalization, /draggable/);
  assert.match(personalization, /Mover \$\{label\} para cima/);
  assert.match(personalization, /Mover \$\{label\} para baixo/);
  assert.match(personalization, /event\.preventDefault\(\)/);
});

test("cards do clima e favoritos compartilham ordem tamanho e controles acessíveis", () => {
  for (const source of [liveOverview, favorites]) {
    assert.match(source, /DashboardItemControls/);
    assert.match(source, /dashboardCardSize/);
    assert.match(source, /placeDashboardItem/);
    assert.match(source, /dashboard-card-size-/);
    assert.match(source, /onDragOver/);
    assert.match(source, /onDrop/);
  }
  assert.match(favorites, /favoriteCardLayoutKey/);
  assert.match(personalization, /<option value="compact">Compacto<\/option>/);
  assert.match(personalization, /<option value="medium">Médio<\/option>/);
  assert.match(personalization, /<option value="wide">Amplo<\/option>/);
});

test("tamanhos degradam para coluna única no mobile e editor mantém foco visível", () => {
  assert.match(personalizationCss, /dashboard-card-size-compact/);
  assert.match(personalizationCss, /dashboard-card-size-medium[\s\S]*grid-column:\s*span 2/);
  assert.match(personalizationCss, /dashboard-card-size-wide[\s\S]*grid-column:\s*1 \/ -1/);
  assert.match(personalizationCss, /@media \(max-width: 760px\)[\s\S]*grid-column:\s*1 \/ -1/);
  assert.match(personalizationCss, /:focus-visible/);
  assert.match(personalizationCss, /forced-colors: active/);
});

test("layout personalizado faz parte da exportação LGPD", () => {
  assert.match(accountExport, /dashboard_layout/);
  assert.match(accountExport, /DashboardPreferencesDatabase/);
  assert.match(accountExport, /export_version:\s*"1\.4"/);
});
