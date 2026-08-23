import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = readFileSync("src/routes/__root.tsx", "utf8");
const login = readFileSync("src/components/auth/GoogleLoginCard.tsx", "utf8");
const push = readFileSync("src/components/pwa/PushNotificationsManager.tsx", "utf8");
const privacy = readFileSync("src/routes/privacidade-e-dados.tsx", "utf8");
const audit = readFileSync("docs/RUNTIME_SECRETS_AUDIT_2026-08-23.md", "utf8");

test("Lovable Analytics connector remains the single planned GA4 source", () => {
  assert.equal(existsSync("src/components/analytics/GoogleAnalytics.tsx"), false);
  assert.doesNotMatch(root, /GoogleAnalytics|googletagmanager|G-97YX7HPD90/);
  assert.match(audit, /Analytics TEMPO Pelotas/);
  assert.match(audit, /G-97YX7HPD90/);
  assert.match(audit, /não manter uma segunda inicialização manual/i);
});

test("privacy copy does not claim Analytics is active before connector linking", () => {
  assert.match(privacy, /conexão preparada para Google Analytics 4/);
  assert.match(privacy, /G-97YX7HPD90/);
  assert.match(privacy, /só deve ser considerada ativa depois/i);
  assert.match(privacy, /tecnicamente separada do login/i);
});

test("push manager is mounted globally but remains runtime-gated by push configuration", () => {
  assert.match(root, /import \{ PushNotificationsManager \}/);
  assert.match(root, /<PushNotificationsManager\s*\/>/);
  assert.match(push, /\/api\/push\/config/);
  assert.match(push, /\/api\/push\/subscription/);
});

test("Google login explains authentication without exposing infrastructure jargon", () => {
  assert.match(login, /não[\s\S]*recebe nem armazena sua senha do Google/i);
  assert.doesNotMatch(login, /domínio técnico do banco/i);
});
