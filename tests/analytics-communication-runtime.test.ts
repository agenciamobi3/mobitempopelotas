import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = readFileSync("src/routes/__root.tsx", "utf8");
const login = readFileSync("src/components/auth/GoogleLoginCard.tsx", "utf8");
const push = readFileSync("src/components/pwa/PushNotificationsManager.tsx", "utf8");
const ticketWidget = readFileSync("src/components/mobi-ticket/MobiTicketWidgetLoader.tsx", "utf8");
const envExample = readFileSync(".env.example", "utf8");
const privacy = readFileSync("src/routes/privacidade-e-dados.tsx", "utf8");

test("GA4 keeps the SSR queue but defers the external library while SPA pageviews remain explicit", () => {
  assert.match(root, /G-97YX7HPD90/);
  assert.match(root, /window\.dataLayer = window\.dataLayer \|\| \[\]/);
  assert.match(root, /function gtag\(\)\{dataLayer\.push\(arguments\);\}/);
  assert.match(root, /googletagmanager\.com\/gtag\/js/);
  assert.match(root, /send_page_view:\s*false/);
  assert.match(root, /requestIdleCallback/);
  assert.match(root, /GOOGLE_ANALYTICS_IDLE_TIMEOUT_MS/);
  assert.match(root, /window\.setTimeout\(loadAnalytics, GOOGLE_ANALYTICS_FALLBACK_DELAY_MS\)/);
  assert.match(root, /data-tempo-pelotas-ga4/);
  assert.match(root, /dataset\.tempoPelotasGa4 = "true"/);
  assert.match(root, /<GoogleAnalyticsLoader\s*\/>/);
  assert.doesNotMatch(root, /<script\s+async[\s\S]*?googletagmanager\.com\/gtag\/js/);
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

test("ticket widget remains global, idle-loaded and migrates to the canonical Core loader without breaking P0", () => {
  assert.match(root, /<MobiTicketWidgetLoader\s*\/>/);
  assert.match(ticketWidget, /requestIdleCallback/);
  assert.match(ticketWidget, /IDLE_TIMEOUT_MS/);
  assert.match(ticketWidget, /window\.setTimeout\(loadWidget, FALLBACK_DELAY_MS\)/);
  assert.match(ticketWidget, /script\.async = true/);
  assert.match(ticketWidget, /agenciamobi\.com\.br\/widgets\/mobi-support-widget-loader\.js/);
  assert.match(ticketWidget, /agenciamobi\.com\.br\/widget\/mobi-ticket\.js/);
  assert.match(ticketWidget, /VITE_MOBI_TICKET_WIDGET_TOKEN/);
  assert.match(ticketWidget, /canonicalReady \? CANONICAL_LOADER_URL : LEGACY_WIDGET_URL/);
  assert.match(ticketWidget, /script\.dataset\.source = WIDGET_SOURCE/);
  assert.match(ticketWidget, /script\.dataset\.configMode = "remote"/);
  assert.match(ticketWidget, /Erro no portal/);
  assert.match(ticketWidget, /Dados incorretos/);
  assert.match(ticketWidget, /Solicitação de melhoria/);
  assert.match(ticketWidget, /cancelIdleCallback/);
  assert.match(ticketWidget, /window\.clearTimeout/);
});

test("ticket install key is environment-only and no credential value is versioned by the integration source", () => {
  assert.match(envExample, /VITE_MOBI_TICKET_WIDGET_TOKEN=/);
  assert.match(envExample, /Nunca versionar o valor real no Git/);
  assert.doesNotMatch(envExample, /VITE_MOBI_TICKET_WIDGET_TOKEN=\S+/);
  assert.doesNotMatch(ticketWidget, /VITE_MOBI_TICKET_WIDGET_TOKEN\s*\|\|\s*["'][^"']+["']/);
  assert.doesNotMatch(ticketWidget, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(ticketWidget, /MOBI_SUPPORT_WIDGET_TOKEN/);
});

test("Google login explains authentication without exposing infrastructure jargon", () => {
  assert.match(login, /não[\s\S]*recebe nem armazena sua senha do Google/i);
  assert.doesNotMatch(login, /domínio técnico do banco/i);
});
