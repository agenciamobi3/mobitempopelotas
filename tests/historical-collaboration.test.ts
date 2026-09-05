import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync("src/components/layout/ContentPageShell.tsx", "utf8");
const callouts = readFileSync("src/components/history/HistoricalCollaboration.tsx", "utf8");
const form = readFileSync("src/components/history/HistoricalContributionForm.tsx", "utf8");
const action = readFileSync("src/lib/history/contribution.functions.ts", "utf8");
const contexts = readFileSync("src/lib/history/historical-collaboration.ts", "utf8");
const route = readFileSync("src/routes/contribuir.tsx", "utf8");
const migration = readFileSync(
  "supabase/migrations/20260905203000_create_historical_contributions.sql",
  "utf8",
);
const privacy = readFileSync("src/routes/privacidade-e-dados.tsx", "utf8");
const deleteRoute = readFileSync("src/routes/api/account/delete.ts", "utf8");
const exportRoute = readFileSync("src/routes/api/account/export.ts", "utf8");

const historicalRoutes = [
  "src/routes/enchente-1941-pelotas.tsx",
  "src/routes/enchente-2001-pelotas.tsx",
  "src/routes/enchente-2015-pelotas.tsx",
  "src/routes/enchente-2024-pelotas-laranjal.tsx",
];

test("all dedicated flood pages opt into the reusable collaboration surface", () => {
  assert.match(shell, /HistoricalCollaborationPrompt/);
  assert.match(shell, /HistoricalCollaborationSection/);
  assert.match(callouts, /Colabore com este registro/);
  assert.match(callouts, /Para trabalhos e pesquisas/);
  assert.match(callouts, /não altera automaticamente o registro histórico/);

  for (const file of historicalRoutes) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /historicalCollaboration=\{HISTORICAL_COLLABORATION_CONTEXTS\[PAGE_PATH\]\}/);
  }

  for (const year of [1941, 2001, 2015, 2024]) {
    assert.match(contexts, new RegExp(String(year)));
  }
});

test("contribution route is member-only for writes and excluded from indexing", () => {
  assert.match(route, /createFileRoute\("\/contribuir"\)/);
  assert.match(route, /loader: \(\) => getAccountSnapshot\(\)/);
  assert.match(route, /noindex, nofollow/);
  assert.match(route, /GoogleLoginCard/);
  assert.match(route, /HistoricalContributionForm/);
  assert.match(route, /conta gratuita/i);
});

test("submissions are moderated and attachments stay private while pending", () => {
  assert.match(action, /status: "pending"/);
  assert.match(action, /expectedPrefix/);
  assert.match(action, /invalid_attachment/);
  assert.match(form, /historical-contributions/);
  assert.match(form, /Até 5 arquivos, 15 MB cada/);
  assert.match(form, /Fotos e PDFs ficam privados durante a revisão/);
  assert.match(form, /não altera automaticamente o registro histórico/);

  assert.match(migration, /alter table public\.historical_contributions enable row level security/);
  assert.match(migration, /historical_contributions_select_own/);
  assert.match(migration, /historical_contributions_insert_own/);
  assert.match(migration, /'historical-contributions',[\s\S]*false,[\s\S]*15728640/);
  assert.match(migration, /storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
});

test("rights and account lifecycle cover historical contributions", () => {
  assert.match(form, /rightsConfirmed/);
  assert.match(form, /publicationAuthorized/);
  assert.match(privacy, /contribuiç(?:ão|ões) históricas/i);
  assert.match(deleteRoute, /removeHistoricalContributionFiles/);
  assert.match(exportRoute, /historical_contributions/);
});
