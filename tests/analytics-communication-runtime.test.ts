import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const analytics = readFileSync("src/components/analytics/GoogleAnalytics.tsx", "utf8");
const root = readFileSync("src/routes/__root.tsx", "utf8");
const login = readFileSync("src/components/auth/GoogleLoginCard.tsx", "utf8");
const push = readFileSync("src/components/pwa/PushNotificationsManager.tsx", "utf8");

test("GA4 tracks the public measurement ID across SPA navigations without duplicate automatic pageviews", () => {
  assert.match(analytics, /G-97YX7HPD90/);
  assert.match(analytics, /useRouterState/);
  assert.match(analytics, /state\.location\.href/);
  assert.match(analytics, /googletagmanager\.com\/gtag\/js/);
  assert.match(analytics, /send_page_view:\s*false/);
  assert.match(analytics, /"event",\s*"page_view"/);
  assert.match(analytics, /page_location:\s*window\.location\.href/);
  assert.match(root, /<GoogleAnalytics\s*\/>/);
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
