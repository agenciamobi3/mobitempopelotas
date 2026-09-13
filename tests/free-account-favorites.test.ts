import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260910202606_create_user_favorites.sql",
  "utf8",
);
const catalog = readFileSync("src/lib/auth/favorite-resources.ts", "utf8");
const functions = readFileSync("src/lib/auth/favorites.functions.ts", "utf8");
const liveFunctions = readFileSync("src/lib/auth/account-dashboard-live.functions.ts", "utf8");
const dashboardLayout = readFileSync("src/lib/auth/dashboard-layout.ts", "utf8");
const panel = readFileSync("src/components/auth/AccountFavoritesPanel.tsx", "utf8");
const liveOverview = readFileSync("src/components/auth/AccountLiveOverview.tsx", "utf8");
const liveOverviewCss = readFileSync("src/components/auth/AccountLiveOverview.css", "utf8");
const favoriteLiveCss = readFileSync("src/components/auth/AccountFavoriteLive.css", "utf8");
const accessOverview = readFileSync("src/components/auth/AccountAccessOverview.tsx", "utf8");
const dashboardRoute = readFileSync("src/routes/painel.tsx", "utf8");
const dashboard = readFileSync("src/components/auth/AccountDashboard.tsx", "utf8");
const accountPage = readFileSync("src/components/auth/AccountPage.tsx", "utf8");
const accountExport = readFileSync("src/routes/api/account/export.ts", "utf8");
const dashboardCss = readFileSync("src/production/styles/account-dashboard.css", "utf8");
const accessOverviewCss = readFileSync(
  "src/production/styles/account-access-overview.css",
  "utf8",
);

test("favoritos Free são privados por usuário no banco", () => {
  assert.match(migration, /create table public\.user_favorites/i);
  assert.match(migration, /references auth\.users\(id\) on delete cascade/i);
  assert.match(migration, /unique \(user_id, resource_key\)/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /Users can read own favorites/);
  assert.match(migration, /Users can insert own favorites/);
  assert.match(migration, /Users can delete own favorites/);
  assert.match(migration, /\(select auth\.uid\(\)\) = user_id/);
  assert.match(migration, /revoke all on table public\.user_favorites from anon/i);
  assert.match(
    migration,
    /grant select, insert, delete on table public\.user_favorites to authenticated/i,
  );
  assert.doesNotMatch(migration, /grant .*user_favorites to anon/i);
});

test("catálogo aceita apenas recursos canônicos do Tempo Pelotas", () => {
  assert.match(catalog, /FAVORITE_RESOURCE_KEYS/);
  assert.match(catalog, /FavoriteResourceHref/);
  assert.match(catalog, /"laranjal-level"/);
  assert.match(catalog, /"regional-waters"/);
  assert.match(catalog, /"radar-satellite"/);
  assert.match(catalog, /"widget-builder"/);
  assert.match(catalog, /isFavoriteResourceKey/);
  assert.match(catalog, /getFavoriteResource/);
  assert.doesNotMatch(catalog, /href:\s*string/);
});

test("mutação de favoritos valida catálogo, sessão e entitlement no servidor", () => {
  assert.match(functions, /z\.enum\(FAVORITE_RESOURCE_KEYS\)/);
  assert.match(functions, /client\.auth\.getUser\(\)/);
  assert.match(functions, /access\.entitlements\.favorites/);
  assert.match(functions, /getFavoriteResource\(data\.resourceKey\)/);
  assert.match(functions, /\.from\("user_favorites"\)/);
  assert.match(functions, /onConflict:\s*"user_id,resource_key"/);
  assert.match(functions, /\.eq\("user_id", user\.id\)/);
  assert.match(functions, /\.eq\("resource_key", resource\.key\)/);
  assert.match(functions, /Cache-Control", "private, no-store, max-age=0"/);
  assert.doesNotMatch(functions, /href:\s*z\./);
  assert.doesNotMatch(functions, /title:\s*z\./);
});

test("painel autenticado carrega e renderiza favoritos Free reais", () => {
  assert.match(dashboardRoute, /getAccountFavorites/);
  assert.match(dashboardRoute, /Promise\.all\(/);
  assert.match(dashboardRoute, /favorites=\{favorites\}/);
  assert.match(dashboard, /AccountFavoritesPanel/);
  assert.match(dashboard, /<AccountFavoritesPanel/);
  assert.match(dashboard, /Favoritos/);
  assert.match(dashboard, /Meu Tempo Pelotas/);
  assert.doesNotMatch(
    dashboard,
    /title:\s*"Favoritos"[\s\S]{0,240}state:\s*"preparing"/,
  );
});

test("painel Free nasce com valor pessoal, ferramentas e personalização", () => {
  assert.match(dashboard, /AccountLiveOverview/);
  assert.match(dashboard, /<AccountLiveOverview/);
  assert.match(dashboard, /DashboardPersonalizationBar/);
  assert.match(dashboard, /layout\.sections\.map/);
  assert.match(dashboard, /Em construção/);
  assert.match(dashboardLayout, /\["live", "favorites", "site"\]/);
  assert.match(dashboard, /site:\s*"Ferramentas"/);
  assert.match(dashboard, /Gerador de widgets/);
  assert.match(dashboard, /AccountObservatoryProduct/);
});

test("painel vivo reutiliza dados reais e oferece aprofundamento", () => {
  assert.match(dashboard, /useServerFn\(getAccountDashboardLiveSnapshot\)/);
  assert.match(liveFunctions, /fetchAggregatedPelotasWeather/);
  assert.match(liveFunctions, /toProductionWeatherData/);
  assert.match(liveFunctions, /toProductionAlerts/);
  assert.match(liveFunctions, /alert\.relevance === "pelotas"/);
  assert.match(liveOverview, /to="\/tempo-hoje-pelotas"/);
  assert.match(liveOverview, /to="\/previsao-7-dias-pelotas"/);
  assert.match(liveOverview, /to="\/chuva-em-pelotas"/);
  assert.match(liveOverview, /to="\/alertas"/);
  assert.match(liveOverview, /nenhuma informação demonstrativa foi exibida/);
  assert.doesNotMatch(liveFunctions, /Math\.random/);
});

test("Favoritos Vivos enriquecem recursos salvos e atualizam após mutação", () => {
  assert.match(panel, /Favoritos Vivos · Free/);
  assert.match(panel, /FavoriteLiveContent/);
  assert.match(panel, /liveCards\[resource\.key\]/);
  assert.match(panel, /await onFavoritesChanged\?\.\(\)/);
  assert.match(panel, /Gerenciar favoritos/);
  assert.match(panel, /<details className="account-favorites__manager">/);
  assert.match(liveFunctions, /favoriteKeys\.includes\("forecast-7-days"\)/);
  assert.match(liveFunctions, /favoriteKeys\.includes\("laranjal-level"\)/);
  assert.match(liveFunctions, /favoriteKeys\.includes\("guaiba-level"\)/);
  assert.match(liveFunctions, /DCRS-00063/);
  assert.match(liveFunctions, /DCRS-00115/);
});

test("componente permite adicionar e remover favoritos de forma acessível", () => {
  assert.match(panel, /useServerFn\(setAccountFavorite\)/);
  assert.match(panel, /aria-pressed=\{selected\}/);
  assert.match(panel, /disabled=\{Boolean\(pendingKey\)\}/);
  assert.match(panel, /Favoritos Vivos · Free/);
  assert.match(panel, /selectedResources/);
  assert.match(panel, /Gerenciar favoritos/);
  assert.match(panel, /window\.location\.assign\("\/conta\?next=\/painel"\)/);
});

test("favoritos e layout entram nos direitos LGPD da conta", () => {
  assert.match(accountPage, /Favoritos e widgets já estão disponíveis no painel/);
  assert.match(accountPage, /perfil, preferências, favoritos, histórico de consentimentos/);
  assert.match(accountPage, /remove perfil, preferências, favoritos, consentimentos/);
  assert.match(accountExport, /loadFavorites/);
  assert.match(accountExport, /\.from\("user_favorites"\)/);
  assert.match(accountExport, /dashboard_layout/);
  assert.match(accountExport, /export_version:\s*"1\.4"/);
  assert.match(accountExport, /\n\s*favorites,\n/);
});

test("visão de acesso cadastrado mostra recursos atuais e futuros sem paywall prematuro", () => {
  assert.match(accountPage, /AccountAccessOverview/);
  assert.match(accountPage, /<AccountAccessOverview snapshot=\{snapshot\} \/>/);
  assert.match(accessOverview, /aria-labelledby="account-access-title"/);
  assert.match(accessOverview, /Conta \{access\.label\}/);
  assert.match(accessOverview, /access\.entitlements/);
  assert.match(accessOverview, /Favoritos pessoais/);
  assert.match(accessOverview, /Preferências da conta/);
  assert.match(accessOverview, /Gerador de widgets/);
  assert.match(accessOverview, /Observatório/);
  assert.match(accessOverview, /Histórico pessoal/);
  assert.match(accessOverview, /Comparações, exportações e análises/);
  assert.match(accessOverview, /state:\s*"preparing"/);
  assert.match(accessOverview, /uso contínuo/);
  assert.doesNotMatch(accessOverview, /Não incluído|assine agora|compre agora|desbloqueie para consultar/i);
});

test("workspace de favoritos mantém responsividade e acessibilidade visual", () => {
  assert.match(dashboardCss, /\.account-favorites/);
  assert.match(dashboardCss, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(dashboardCss, /@media \(max-width: 1180px\)/);
  assert.match(dashboardCss, /@media \(max-width: 760px\)/);
  assert.match(dashboardCss, /prefers-reduced-motion: reduce/);
  assert.match(dashboardCss, /forced-colors: active/);
  assert.match(dashboardCss, /:focus-visible/);
  assert.match(favoriteLiveCss, /account-favorites__shortcut--live/);
  assert.match(favoriteLiveCss, /forced-colors: active/);
});

test("painel vivo mantém responsividade e foco visível", () => {
  assert.match(liveOverviewCss, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(liveOverviewCss, /@media \(max-width: 1120px\)/);
  assert.match(liveOverviewCss, /@media \(max-width: 720px\)/);
  assert.match(liveOverviewCss, /a:focus-visible/);
});

test("visão de acesso mantém grade 4→2→1 e contratos de foco e alto contraste", () => {
  assert.match(accessOverviewCss, /\.account-access-overview/);
  assert.match(
    accessOverviewCss,
    /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/,
  );
  assert.match(accessOverviewCss, /@media \(max-width: 1180px\)[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(accessOverviewCss, /@media \(max-width: 560px\)[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(accessOverviewCss, /\.account-access-overview__footer a:focus-visible/);
  assert.match(accessOverviewCss, /@media \(forced-colors: active\)/);
});
