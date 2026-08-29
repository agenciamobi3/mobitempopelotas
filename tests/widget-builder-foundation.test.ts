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
const renderer = readFileSync("src/routes/embed/widget.tsx", "utf8");
const loaderScript = readFileSync("public/widgets/embed.js", "utf8");
const server = readFileSync("src/server.ts", "utf8");
const dashboard = readFileSync("src/components/auth/AccountDashboard.tsx", "utf8");

test("Free nasce com o gerador aberto e sem limite de quantidade nesta fase", () => {
  const access = resolveAccountAccess(null);
  assert.equal(access.tier, "free");
  assert.equal(access.entitlements.widgetsAccess, true);
  assert.equal(access.entitlements.widgetsCreate, true);
  assert.equal(access.entitlements.widgetsMax, null);
  assert.equal(access.entitlements.widgetsLaranjal, true);
  assert.equal(access.entitlements.widgetsCurrentWeather, true);
  assert.equal(access.entitlements.widgetsRemoveBranding, false);
});

test("registry começa pelos dois embeds reais já existentes", () => {
  assert.deepEqual(
    WIDGET_REGISTRY.map((widget) => widget.type),
    ["nivel-laranjal", "status-tempo-agora"],
  );
  assert.equal(WIDGET_REGISTRY.every((widget) => widget.initialHeight > 0), true);
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

test("gerador fica disponível no painel autenticado", () => {
  assert.match(dashboard, /Gerador de widgets/);
  assert.match(dashboard, /href: "\/widgets"/);
  assert.match(dashboard, /Criar meus widgets/);
});
