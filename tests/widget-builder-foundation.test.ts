import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { resolveAccountAccess } from "../src/lib/auth/account-access.ts";
import { WIDGET_REGISTRY } from "../src/lib/widgets/widget-registry.ts";

const migration = readFileSync(
  "supabase/migrations/20260829061000_create_user_widgets.sql",
  "utf8",
);
const widgetFunctions = readFileSync("src/lib/widgets/widget.functions.ts", "utf8");
const widgetBuilder = readFileSync("src/components/widgets/WidgetBuilder.tsx", "utf8");
const renderer = readFileSync("src/routes/embed/widget.tsx", "utf8");
const loaderScript = readFileSync("public/widgets/embed.js", "utf8");
const server = readFileSync("src/server.ts", "utf8");
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");
const dashboard = readFileSync("src/components/auth/AccountDashboard.tsx", "utf8");
const sevenDayWidget = readFileSync("src/components/embed/SevenDayForecastWidget.tsx", "utf8");
const rainWidget = readFileSync("src/components/embed/RainWidget.tsx", "utf8");
const windWidget = readFileSync("src/components/embed/WindWidget.tsx", "utf8");

test("Free nasce com o gerador aberto e sem limite de quantidade nesta fase", () => {
  const access = resolveAccountAccess(null);
  assert.equal(access.tier, "free");
  assert.equal(access.entitlements.widgetsAccess, true);
  assert.equal(access.entitlements.widgetsCreate, true);
  assert.equal(access.entitlements.widgetsMax, null);
  assert.equal(access.entitlements.widgetsLaranjal, true);
  assert.equal(access.entitlements.widgetsCurrentWeather, true);
  assert.equal(access.entitlements.widgetsSevenDayForecast, true);
  assert.equal(access.entitlements.widgetsRain, true);
  assert.equal(access.entitlements.widgetsWind, true);
  assert.equal(access.entitlements.widgetsRemoveBranding, false);
});

test("registry oferece os módulos gerenciados liberados nesta fase", () => {
  assert.deepEqual(
    WIDGET_REGISTRY.map((widget) => widget.type),
    [
      "nivel-laranjal",
      "status-tempo-agora",
      "previsao-7-dias",
      "chuva-pelotas",
      "vento-pelotas",
    ],
  );
  assert.equal(WIDGET_REGISTRY.every((widget) => widget.initialHeight > 0), true);
  assert.equal(
    WIDGET_REGISTRY.find((widget) => widget.type === "previsao-7-dias")?.requiredEntitlement,
    "widgetsSevenDayForecast",
  );
  assert.equal(
    WIDGET_REGISTRY.find((widget) => widget.type === "chuva-pelotas")?.requiredEntitlement,
    "widgetsRain",
  );
  assert.equal(
    WIDGET_REGISTRY.find((widget) => widget.type === "vento-pelotas")?.requiredEntitlement,
    "widgetsWind",
  );
  assert.match(widgetFunctions, /\.refine\(isWidgetType, "Módulo de widget inválido"\)/);
  assert.match(widgetFunctions, /transform\(\(value\) => value as WidgetType\)/);
});

test("user_widgets fica privado por RLS e o público resolve somente token ativo", () => {
  assert.match(migration, /create table public\.user_widgets/);
  assert.match(migration, /alter table public\.user_widgets enable row level security/);
  assert.match(migration, /using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(migration, /with check \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(migration, /revoke all on table public\.user_widgets from anon/);
  assert.match(migration, /create or replace function public\.get_public_widget\(p_token uuid\)/);
  assert.match(migration, /security definer/);
  assert.match(migration, /where w\.public_token = p_token[\s\S]*w\.status = 'active'/);
  assert.doesNotMatch(migration, /returns table \([\s\S]*user_id uuid/);
});

test("operações de conta respeitam sessão, entitlement e owner", () => {
  assert.match(widgetFunctions, /createSupabaseRequestClient\(getRequest\(\)\)/);
  assert.match(widgetFunctions, /client\.auth\.getUser\(\)/);
  assert.match(widgetFunctions, /canUseWidgetType\(access\.entitlements, data\.widgetType\)/);
  assert.match(widgetFunctions, /access\.entitlements\.widgetsMax !== null/);
  assert.match(widgetFunctions, /\.eq\("user_id", user\.id\)/);
  assert.match(widgetFunctions, /rpc\("get_public_widget"/);
});

test("sessão expirada durante criação retorna para a rota real do gerador", () => {
  assert.match(widgetBuilder, /window\.location\.assign\("\/conta\?next=\/widgets"\)/);
  assert.doesNotMatch(widgetBuilder, /next=\/conta\/widgets/);
});

test("embed gerado é responsivo e aceita frame externo somente no renderer dedicado", () => {
  assert.match(loaderScript, /https:\/\/tempopelotas\.com\.br/);
  assert.match(loaderScript, /iframe\.style\.width = "100%"/);
  assert.match(loaderScript, /data\.type !== "resize"/);
  assert.match(loaderScript, /event\.origin !== ORIGIN/);
  assert.match(renderer, /ResizeObserver/);
  assert.match(renderer, /tempo-pelotas-widget/);
  assert.match(server, /"\/embed\/widget"/);
  assert.match(server, /withFrameAncestors\(headers\.get\("Content-Security-Policy"\), "\*"\)/);
});

test("renderer gerenciado não usa cache e widgets fixos preservam cache público", () => {
  assert.match(server, /if \(pathname === "\/embed\/widget" \|\| !response\.ok\)/);
  assert.match(server, /headers\.set\("Cache-Control", "no-store"\)/);
  assert.match(server, /headers\.set\("CDN-Cache-Control", "no-store"\)/);
  assert.match(server, /headers\.set\("Cache-Control", EMBED_CACHE_CONTROL\)/);
  assert.match(server, /headers\.set\("CDN-Cache-Control", EMBED_CDN_CACHE_CONTROL\)/);
});

test("previsão de 7 dias reutiliza a consolidação meteorológica e mantém atualização própria", () => {
  assert.match(renderer, /definition\.widgetType === "previsao-7-dias"/);
  assert.match(renderer, /SevenDayForecastWidget/);
  assert.match(sevenDayWidget, /data\.daily\.slice\(0, 7\)/);
  assert.match(sevenDayWidget, /15 \* 60 \* 1_000/);
  assert.match(sevenDayWidget, /https:\/\/tempopelotas\.com\.br\/previsao-7-dias-pelotas/);
});

test("chuva separa observação de 24 h da Defesa Civil RS e previsão horária", () => {
  assert.match(renderer, /definition\.widgetType === "chuva-pelotas"/);
  assert.match(renderer, /RainWidget/);
  assert.match(rainWidget, /data\.sources\["defesa-civil-rs"\]/);
  assert.match(rainWidget, /data\.observation\.rain\.h24Mm/);
  assert.match(rainWidget, /data\.hourly\.slice\(0, 6\)/);
  assert.match(rainWidget, /precipitationProbability/);
  assert.match(rainWidget, /precipitationMm/);
  assert.match(rainWidget, /não é somada à previsão/);
  assert.match(rainWidget, /10 \* 60 \* 1_000/);
});

test("vento mostra leitura atual e tendência horária de rajadas", () => {
  assert.match(renderer, /definition\.widgetType === "vento-pelotas"/);
  assert.match(renderer, /WindWidget/);
  assert.match(windWidget, /data\.hourly\.slice\(0, 6\)/);
  assert.match(windWidget, /current\?\.windSpeed/);
  assert.match(windWidget, /current\?\.windGust/);
  assert.match(windWidget, /hour\.windSpeed/);
  assert.match(windWidget, /hour\.windGust/);
  assert.match(windWidget, /10 \* 60 \* 1_000/);
});

test("gerador e renderer genérico não recebem um segundo shell global", () => {
  assert.match(siteLayout, /"\/widgets"/);
  assert.match(siteLayout, /"\/embed\/widget"/);
  assert.match(siteLayout, /standaloneRoutes\.has\(resolvedPathname\)/);
});

test("gerador fica disponível no painel autenticado", () => {
  assert.match(dashboard, /Gerador de widgets/);
  assert.match(dashboard, /href: "\/widgets"/);
  assert.match(dashboard, /Criar meus widgets/);
});
