import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { resolveAccountAccess } from "../src/lib/auth/account-access.ts";
import { sampleAccountHistoryPoints } from "../src/lib/auth/account-history.ts";

const migration = readFileSync(
  "supabase/migrations/20260822043000_create_account_access.sql",
  "utf8",
);
const repairMigration = readFileSync(
  "supabase/migrations/20260822045500_repair_authenticated_account_foundation.sql",
  "utf8",
);
const historicalMigration = readFileSync(
  "supabase/migrations/20260822025000_create_historical_data_layer.sql",
  "utf8",
);
const accountFunctions = readFileSync("src/lib/auth/account.functions.ts", "utf8");
const historyFunctions = readFileSync("src/lib/auth/account-history.functions.ts", "utf8");
const historyPanel = readFileSync("src/components/auth/AccountHistoryPanel.tsx", "utf8");
const dashboard = readFileSync("src/components/auth/AccountDashboard.tsx", "utf8");
const navigation = readFileSync("src/components/auth/AccountDashboardNavigation.tsx", "utf8");
const accessOverview = readFileSync("src/components/auth/AccountAccessOverview.tsx", "utf8");

test("authenticated account defaults safely to Free with current registered tools", () => {
  const access = resolveAccountAccess(null);
  assert.equal(access.tier, "free");
  assert.equal(access.label, "Free");
  assert.equal(access.entitlements.panelAccess, true);
  assert.equal(access.entitlements.observatoryAccess, true);
  assert.equal(access.entitlements.historyAccessDays, null);
  assert.equal(access.entitlements.historyFull, true);
  assert.equal(access.entitlements.dataExport, false);
});

test("active PRO keeps advanced entitlements without changing public data policy", () => {
  const access = resolveAccountAccess({ tier: "pro", status: "active", source: "admin" });
  assert.equal(access.tier, "pro");
  assert.equal(access.label, "PRO");
  assert.equal(access.entitlements.observatoryAccess, true);
  assert.equal(access.entitlements.historyAccessDays, null);
  assert.equal(access.entitlements.historyFull, true);
  assert.equal(access.entitlements.stationCompare, true);
  assert.equal(access.entitlements.dataExport, true);
});

test("expired or suspended PRO falls back to the current Free capability set", () => {
  const suspended = resolveAccountAccess({ tier: "pro", status: "suspended" });
  assert.equal(suspended.tier, "free");
  assert.equal(suspended.status, "suspended");
  assert.equal(suspended.entitlements.observatoryAccess, true);
  assert.equal(suspended.entitlements.historyAccessDays, null);
  assert.equal(suspended.entitlements.historyFull, true);

  const expired = resolveAccountAccess(
    { tier: "pro", status: "active", validUntil: "2026-08-01T00:00:00.000Z" },
    new Date("2026-08-22T00:00:00.000Z"),
  );
  assert.equal(expired.tier, "free");
  assert.equal(expired.status, "expired");
  assert.equal(expired.entitlements.observatoryAccess, true);
});

test("account_access is private, user-readable and automatically created as Free", () => {
  assert.match(migration, /create table if not exists public\.account_access/);
  assert.match(migration, /tier text not null default 'free'/);
  assert.match(migration, /alter table public\.account_access enable row level security/);
  assert.match(migration, /grant select on table public\.account_access to authenticated/);
  assert.match(migration, /using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(migration, /after insert on auth\.users/);
  assert.match(migration, /values \(new\.id, 'free', 'active', 'system'\)/);
  assert.match(migration, /select id, 'free', 'active', 'system'\s+from auth\.users/s);
  assert.doesNotMatch(migration, /grant (?:insert|update|delete).*authenticated/i);
});

test("authenticated self-repair can only recreate the account foundation as Free", () => {
  assert.match(repairMigration, /security definer/i);
  assert.match(repairMigration, /set search_path = ''/);
  assert.match(repairMigration, /v_user_id uuid := auth\.uid\(\)/);
  assert.match(repairMigration, /insert into public\.profiles/);
  assert.match(repairMigration, /insert into public\.user_preferences/);
  assert.match(repairMigration, /insert into public\.account_access/);
  assert.match(repairMigration, /values \(v_user_id, 'free', 'active', 'system'\)/);
  assert.match(repairMigration, /on conflict \(user_id\) do nothing/);
  assert.match(repairMigration, /revoke all on function public\.ensure_current_user_account_foundation\(\) from public, anon/);
  assert.match(repairMigration, /grant execute on function public\.ensure_current_user_account_foundation\(\) to authenticated/);
  assert.doesNotMatch(repairMigration, /values\s*\([^)]*'pro'/i);
  assert.doesNotMatch(repairMigration, /update\s+public\.account_access[\s\S]*tier\s*=/i);
});

test("backend resolves and repairs the authenticated account foundation", () => {
  assert.match(accountFunctions, /\.from\("account_access"\)/);
  assert.match(accountFunctions, /\.select\("tier,status,source,valid_until"\)/);
  assert.match(accountFunctions, /rpc\("ensure_current_user_account_foundation"\)/);
  assert.match(accountFunctions, /!profileResult\.data \|\| !preferencesResult\.data \|\| !accessResult\.data/);
  assert.match(accountFunctions, /profile &&\s*preferences &&\s*accountAccess/s);
  assert.match(accountFunctions, /resolveAccountAccess/);
  assert.match(accountFunctions, /Cache-Control", "private, no-store, max-age=0"/);
});

test("historical archive remains service-role only and history authenticates before admin access", () => {
  assert.match(
    historicalMigration,
    /revoke all on table public\.historical_measurements from public, anon, authenticated/,
  );
  assert.match(
    historicalMigration,
    /grant select, insert, update, delete on table public\.historical_measurements to service_role/,
  );
  const authIndex = historyFunctions.indexOf("await client.auth.getUser()");
  const adminIndex = historyFunctions.indexOf("createSupabaseAdminClient()");
  assert.ok(authIndex >= 0, "history must authenticate the request");
  assert.ok(adminIndex > authIndex, "service role must only be created after authentication");
  assert.match(historyFunctions, /\.eq\("variable_key", "water_level"\)/);
  assert.match(historyFunctions, /\.eq\("data_class", "observation"\)/);
  assert.match(historyFunctions, /\.order\("observed_at", \{ ascending: false \}\)/);
  assert.match(historyFunctions, /Cache-Control", "private, no-store, max-age=0"/);
});

test("history sampling keeps extrema, recent cadence and only real source points", () => {
  const source = Array.from({ length: 200 }, (_, index) => ({
    timestamp: new Date(Date.UTC(2026, 8, 1, 0, index)).toISOString(),
    level: 1 + (index % 11) / 10,
  }));
  source[17] = { ...source[17]!, level: -9 };
  source[63] = { ...source[63]!, level: 12 };

  const sampled = sampleAccountHistoryPoints(source, 20);

  assert.equal(sampled[0], source[0]);
  assert.equal(sampled.at(-1), source.at(-1));
  assert.ok(sampled.includes(source[17]!));
  assert.ok(sampled.includes(source[63]!));
  for (const recentPoint of source.slice(-12)) {
    assert.ok(sampled.includes(recentPoint));
  }
  assert.ok(sampled.length <= 20);
  assert.ok(sampled.every((point) => source.includes(point)));
});

test("personal history is a real dashboard resource instead of roadmap copy", () => {
  assert.match(historyPanel, /id="historico-pessoal"/);
  assert.match(historyPanel, /HydrologyLevelChart/);
  assert.match(historyPanel, /sem interpolação/);
  assert.match(historyPanel, /ACCOUNT_HISTORY_PERIODS/);
  assert.match(dashboard, /<AccountHistoryPanel/);
  assert.doesNotMatch(dashboard, /title: "Histórico pessoal"/);
  assert.match(navigation, /href="#historico-pessoal"/);
  assert.match(accessOverview, /title: "Histórico pessoal"[\s\S]*state: "available"/);
});
