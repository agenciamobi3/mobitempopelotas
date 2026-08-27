import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = readFileSync("src/routes/__root.tsx", "utf8");
const login = readFileSync("src/components/auth/GoogleLoginCard.tsx", "utf8");
const push = readFileSync("src/components/pwa/PushNotificationsManager.tsx", "utf8");
const ticketWidget = readFileSync("src/components/mobi-ticket/MobiTicketWidgetLoader.tsx", "utf8");
const privacy = readFileSync("src/routes/privacidade-e-dados.tsx", "utf8");

test("GA4 tag is present in the SSR head and SPA navigations emit one explicit pageview", () => {
  assert.match(root, /G-97YX7HPD90/);
  assert.match(root, /googletagmanager\.com\/gtag\/js/);
  assert.match(root, /send_page_view:\s*false/);
  assert.match(root, /useRouterState/);
  assert.match(root, /state\.location\.href/);
  assert.match(root, /"event",\s*"page_view"/);
  assert.match(root, /page_location:\s*window\.location\.href/);
  assert.match(root, /<GoogleAnalyticsPageviews\s*\/>/);
});

test("GA4 remains separated from account identity and advertising signals", () => {
  assert.match(root, /allow_google_signals:\s*false/);
  assert.match(root, /allow_ad_personalization_signals:\s*false/);
  assert.match(privacy, /Google Analytics 4/);
  assert.match(privacy, /G-97YX7HPD90/);
  assert.match(privacy, /não envia e-mail/);
  assert.match(privacy, /Google Signals/);
});

test("Web Push code is preserved but remains outside the global root while suspended", () => {
  assert.doesNotMatch(root, /PushNotificationsManager/);
  assert.match(push, /\/api\/push\/config/);
  assert.match(push, /\/api\/push\/subscription/);
  assert.match(push, /Notification\.requestPermission/);
});

test("ticket widget remains global but defers third-party JavaScript until the browser is idle", () => {
  assert.match(root, /<MobiTicketWidgetLoader\s*\/>/);
  assert.match(ticketWidget, /requestIdleCallback/);
  assert.match(ticketWidget, /IDLE_TIMEOUT_MS/);
  assert.match(ticketWidget, /window\.setTimeout\(loadWidget, FALLBACK_DELAY_MS\)/);
  assert.match(ticketWidget, /script\.async = true/);
  assert.match(ticketWidget, /agenciamobi\.com\.br\/widget\/mobi-ticket\.js/);
  assert.match(ticketWidget, /cancelIdleCallback/);
  assert.match(ticketWidget, /window\.clearTimeout/);
});

test("Google login explains authentication without exposing infrastructure jargon", () => {
  assert.match(login, /não[\s\S]*recebe nem armazena sua senha do Google/i);
  assert.doesNotMatch(login, /domínio técnico do banco/i);
});
