import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const authorization = readFileSync("src/lib/admin/operator-authorization.server.ts", "utf8");
const functions = readFileSync("src/lib/history/moderation.functions.ts", "utf8");
const panel = readFileSync("src/components/history/HistoricalModerationPanel.tsx", "utf8");
const dashboard = readFileSync("src/components/auth/AccountDashboard.tsx", "utf8");
const route = readFileSync("src/routes/painel.tsx", "utf8");
const styles = readFileSync("src/components/history/HistoricalModerationPanel.css", "utf8");
const envExample = readFileSync(".env.example", "utf8");

test("historical moderation is fail-closed behind a server-only operator allowlist", () => {
  assert.match(authorization, /process\.env\.MOBI_PORTAL_ADMIN_EMAILS/);
  assert.match(authorization, /config\.isPublicConfigured/);
  assert.match(authorization, /config\.isAdminConfigured/);
  assert.match(authorization, /allowlist\.size === 0/);
  assert.match(authorization, /client\.auth\.getUser\(\)/);
  assert.match(authorization, /user\.email_confirmed_at/);
  assert.match(authorization, /allowlist\.has\(email\)/);
  assert.doesNotMatch(authorization, /import\.meta\.env\.VITE_.*ADMIN/i);

  assert.match(envExample, /^MOBI_PORTAL_ADMIN_EMAILS=$/m);
  assert.doesNotMatch(envExample, /^VITE_.*PORTAL_ADMIN_EMAILS=/m);
});

test("moderation reads private queue only after authorization and signs attachments briefly", () => {
  assert.match(functions, /authorizePortalOperator\(\)/);
  assert.match(functions, /createSupabaseAdminClient\(\)/);
  assert.match(functions, /\.in\("status", \["pending", "reviewing"\]\)/);
  assert.match(functions, /\.limit\(51\)/);
  assert.match(functions, /createSignedUrls\(\[\.\.\.paths\], 10 \* 60\)/);
  assert.match(functions, /data\.slice\(0, 50\)/);
});

test("operator-facing source links are restricted to http and https", () => {
  assert.match(functions, /function safeSourceUrl/);
  assert.match(functions, /url\.protocol === "http:" \|\| url\.protocol === "https:"/);
  assert.match(functions, /sourceUrl: safeSourceUrl\(row\.source_url\)/);
});

test("moderation decisions never grant publication consent or publish content automatically", () => {
  assert.match(functions, /z\.enum\(\["reviewing", "accepted", "rejected"\]\)/);
  assert.match(functions, /moderation_note: moderationNote/);
  assert.match(functions, /reviewed_at: reviewedAt/);

  const updateBlock = functions.match(/\.update\(\{[\s\S]*?\.maybeSingle\(\)/)?.[0] ?? "";
  assert.ok(updateBlock, "teste deve localizar o update de moderação");
  assert.doesNotMatch(updateBlock, /publication_authorized|rights_confirmed|attachments|description|title/);

  assert.match(panel, /Aceitar um item aqui não altera\s+nenhuma página pública/);
  assert.match(panel, /Aceitar para pesquisa/);
  assert.match(panel, /publication_authorized/);
});

test("final moderation states cannot be reopened through the server action", () => {
  assert.match(
    functions,
    /\.eq\("id", data\.id\)[\s\S]*\.in\("status", \["pending", "reviewing"\]\)[\s\S]*\.maybeSingle\(\)/,
  );
  assert.match(functions, /code: "not_active"/);
});

test("only authorized moderation snapshots render the internal panel inside the noindex account area", () => {
  assert.match(panel, /if \(snapshot\.status !== "authorized"\) return null/);
  assert.match(dashboard, /<HistoricalModerationPanel snapshot=\{moderation\} \/>/);
  assert.match(route, /getHistoricalModerationSnapshot\(\)/);
  assert.match(route, /robots", content: "noindex, nofollow"/);
  assert.doesNotMatch(route, /createFileRoute\("\/moderacao/);
});

test("moderation UI keeps private attachment and keyboard-accessibility contracts", () => {
  assert.match(panel, /links assinados expiram em poucos minutos/);
  assert.match(panel, /rel="noopener noreferrer"/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(styles, /!important/);
});
