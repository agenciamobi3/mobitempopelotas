import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createBrazilOnlyAccessResponse,
  evaluateBrazilAccess,
  resolveRequestCountry,
  shouldBlockForeignBrowserRequest,
} from "../src/lib/brazil-only-access.server.ts";
import {
  recordBrazilAccessDecision,
  resetAccessMetricsForTests,
} from "../src/lib/access-observability.server.ts";

const serverBrazil = readFileSync("src/server-brazil.ts", "utf8");
const globalCsp = readFileSync("src/lib/security/content-security-policy.server.ts", "utf8");
const requestFirewall = readFileSync("src/lib/security/request-firewall.server.ts", "utf8");
const dataStatusRoute = readFileSync("src/routes/api/cron/data-status.ts", "utf8");
const securityWorkflow = readFileSync(".github/workflows/data-status-monitor.yml", "utf8");
const rateLimitMigration = readFileSync(
  "supabase/migrations/20260823090000_create_security_rate_limits.sql",
  "utf8",
);

function requestWithCountry(
  url: string,
  country: string | null,
  options: { browser?: boolean; method?: string } = {},
) {
  const headers = new Headers();
  if (options.browser !== false) {
    headers.set("sec-fetch-dest", "document");
    headers.set("sec-fetch-mode", "navigate");
    headers.set("sec-fetch-site", "none");
  }

  const request = new Request(url, { method: options.method ?? "GET", headers });
  if (country) {
    Object.defineProperty(request, "cf", {
      configurable: true,
      value: { country },
    });
  }
  return request;
}

test("Brazilian browser traffic reaches the regular app", () => {
  const request = requestWithCountry("https://tempopelotas.com.br/", "BR");
  const decision = evaluateBrazilAccess(request);

  assert.equal(resolveRequestCountry(request), "BR");
  assert.equal(decision.reason, "allowed-brazil");
  assert.equal(decision.blocked, false);
  assert.equal(shouldBlockForeignBrowserRequest(request), false);
  assert.equal(createBrazilOnlyAccessResponse(request, decision), null);
});

test("foreign browsers stop before the app and receive a single self-contained brand page", async () => {
  const request = requestWithCountry("https://tempopelotas.com.br/tempo-hoje-pelotas", "ES");
  const decision = evaluateBrazilAccess(request);
  const response = createBrazilOnlyAccessResponse(request, decision);

  assert.equal(decision.reason, "blocked-foreign");
  assert.ok(response);
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.match(response.headers.get("content-security-policy") ?? "", /connect-src 'none'/);
  assert.match(response.headers.get("content-security-policy") ?? "", /img-src 'none'/);
  assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/);

  const html = await response.text();
  assert.match(html, /<main aria-label="Tempo Pelotas">/);
  assert.match(html, /<svg[^>]+viewBox="0 0 512 512"/);
  assert.match(html, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.doesNotMatch(html, /<img\b/i);
  assert.doesNotMatch(html, /<script\b/i);
  assert.doesNotMatch(html, /<link\b/i);
  assert.doesNotMatch(html.replace("http://www.w3.org/2000/svg", ""), /https?:\/\//i);
  assert.doesNotMatch(html, /supabase/i);
  assert.doesNotMatch(html, /google-analytics|googletagmanager|gtag\(|dataLayer/i);
  assert.doesNotMatch(html, /fetch\s*\(/i);
});

test("foreign browser API/subresource requests are also stopped", () => {
  const request = requestWithCountry("https://tempopelotas.com.br/api/redemet/radar?frames=2", "RU");
  request.headers.set("sec-fetch-dest", "empty");
  request.headers.set("sec-fetch-mode", "cors");

  assert.equal(shouldBlockForeignBrowserRequest(request), true);
  assert.equal(createBrazilOnlyAccessResponse(request)?.status, 403);
});

test("foreign browser asset requests cannot reach the app either", () => {
  const request = requestWithCountry(
    "https://tempopelotas.com.br/brand/tempo-pelotas-purple.svg",
    "FR",
  );
  request.headers.set("sec-fetch-dest", "image");
  assert.equal(shouldBlockForeignBrowserRequest(request), true);
});

test("unknown production browser country fails closed, while local development is unaffected", () => {
  const production = requestWithCountry("https://tempopelotas.com.br/", null);
  const local = requestWithCountry("http://localhost:3000/", "US");

  assert.equal(evaluateBrazilAccess(production).reason, "blocked-unknown");
  assert.equal(evaluateBrazilAccess(local).reason, "bypass-non-production");
  assert.equal(shouldBlockForeignBrowserRequest(production), true);
  assert.equal(shouldBlockForeignBrowserRequest(local), false);
});

test("server-to-server monitoring is not mistaken for a visitor", () => {
  const request = requestWithCountry("https://tempopelotas.com.br/radar-e-satelite-pelotas", "US", {
    browser: false,
  });

  assert.equal(evaluateBrazilAccess(request).reason, "bypass-non-browser");
  assert.equal(shouldBlockForeignBrowserRequest(request), false);
  assert.equal(createBrazilOnlyAccessResponse(request), null);
});

test("blocked access logs are structured without IP, query string or user agent", () => {
  resetAccessMetricsForTests();
  const warnings: string[] = [];
  const infos: string[] = [];
  const logger = {
    warn: (...args: unknown[]) => warnings.push(args.join(" ")),
    info: (...args: unknown[]) => infos.push(args.join(" ")),
  };
  const request = requestWithCountry(
    "https://tempopelotas.com.br/api/redemet/radar?frames=999&token=secret",
    "IR",
  );

  recordBrazilAccessDecision(request, evaluateBrazilAccess(request), logger);

  assert.equal(warnings.length, 1);
  assert.match(warnings[0]!, /geo_access_blocked/);
  assert.match(warnings[0]!, /"country":"IR"/);
  assert.match(warnings[0]!, /"route":"\/api\/redemet\/\*"/);
  assert.doesNotMatch(warnings[0]!, /frames=999|token=secret|user-agent|ip/i);
  assert.equal(infos.length, 0);
});

test("entrypoint adds baseline hardening, CSP and no-store for sensitive APIs", () => {
  assert.match(serverBrazil, /recordBrazilAccessDecision/);
  assert.match(serverBrazil, /Strict-Transport-Security/);
  assert.match(serverBrazil, /X-Content-Type-Options/);
  assert.match(serverBrazil, /Referrer-Policy/);
  assert.match(serverBrazil, /Permissions-Policy/);
  assert.match(serverBrazil, /X-Frame-Options/);
  assert.match(serverBrazil, /applyGlobalContentSecurityPolicy/);
  assert.match(serverBrazil, /enforceSensitiveRequestFirewall/);
  assert.match(serverBrazil, /\/api\/account\//);
  assert.match(serverBrazil, /\/api\/push\//);
  assert.match(serverBrazil, /\/api\/cron\//);
  assert.match(serverBrazil, /private, no-store, max-age=0/);
});

test("global CSP is enforced with explicit production allowlists", () => {
  assert.match(globalCsp, /default-src 'self'/);
  assert.match(globalCsp, /object-src 'none'/);
  assert.match(globalCsp, /base-uri 'self'/);
  assert.match(globalCsp, /frame-ancestors 'self'/);
  assert.match(globalCsp, /script-src-attr 'none'/);
  assert.match(globalCsp, /upgrade-insecure-requests/);
  assert.match(globalCsp, /https:\/\/www\.googletagmanager\.com/);
  assert.match(globalCsp, /https:\/\/accounts\.google\.com/);
  assert.match(globalCsp, /https:\/\/ovcpgjyomwjteapbvfwk\.supabase\.co/);
  assert.match(globalCsp, /wss:\/\/ovcpgjyomwjteapbvfwk\.supabase\.co/);
  assert.match(globalCsp, /https:\/\/tiles\.openfreemap\.org/);
  assert.match(globalCsp, /https:\/\/www\.youtube\.com/);
  assert.doesNotMatch(globalCsp, /unsafe-eval/);
  assert.doesNotMatch(globalCsp, /(?:^|\s)\*(?:\s|$)/);
});

test("sensitive request firewall is distributed, privacy-preserving and fail-closed", () => {
  assert.match(requestFirewall, /\/api\/account\/delete/);
  assert.match(requestFirewall, /\/api\/account\/export/);
  assert.match(requestFirewall, /\/api\/push\/subscription/);
  assert.match(requestFirewall, /\/api\/push\/broadcast/);
  assert.match(requestFirewall, /prefix: "\/api\/cron\/"/);
  assert.match(requestFirewall, /maxBodyBytes/);
  assert.match(requestFirewall, /jsonError\(405/);
  assert.match(requestFirewall, /jsonError\(413/);
  assert.match(requestFirewall, /jsonError\(429/);
  assert.match(requestFirewall, /Retry-After/);
  assert.match(requestFirewall, /createSupabaseAdminClient/);
  assert.match(requestFirewall, /consume_security_rate_limit/);
  assert.match(requestFirewall, /HMAC/);
  assert.match(requestFirewall, /cf-connecting-ip/);
  assert.match(requestFirewall, /x-forwarded-for/);
  assert.match(requestFirewall, /Controle de segurança temporariamente indisponível/);
  assert.doesNotMatch(requestFirewall, /console\.(?:log|warn|error)[^\n]*(?:cf-connecting-ip|x-forwarded-for)/i);
});

test("rate-limit migration is private to service role and atomic", () => {
  assert.match(rateLimitMigration, /create table if not exists public\.security_rate_limit_buckets/);
  assert.match(rateLimitMigration, /enable row level security/);
  assert.match(rateLimitMigration, /revoke all on table public\.security_rate_limit_buckets from public, anon, authenticated/);
  assert.match(rateLimitMigration, /security definer/);
  assert.match(rateLimitMigration, /consume_security_rate_limit/);
  assert.match(rateLimitMigration, /on conflict \(scope, key_hash, window_started_at\)/);
  assert.match(rateLimitMigration, /grant execute[\s\S]*to service_role/);
});

test("production smoke validates real-country blocking and protected runtime checks", () => {
  assert.match(securityWorkflow, /30 10 \* \* \*/);
  assert.match(securityWorkflow, /www\.cloudflare\.com\/cdn-cgi\/trace/);
  assert.match(securityWorkflow, /Sec-Fetch-Dest: document/);
  assert.match(securityWorkflow, /Sec-Fetch-Mode: navigate/);
  assert.match(securityWorkflow, /Sec-Fetch-Site: none/);
  assert.match(securityWorkflow, /runner_country/);
  assert.match(securityWorkflow, /browser_status/);
  assert.match(securityWorkflow, /connect-src 'none'/);
  assert.match(securityWorkflow, /script-src-attr 'none'/);
  assert.match(securityWorkflow, /mode=security-smoke/);
  assert.match(securityWorkflow, /Authorization: Bearer \$oidc_token/);
  assert.match(securityWorkflow, /classification/);
  assert.match(securityWorkflow, /sanitizedLogs/);
  assert.match(securityWorkflow, /distributedRateLimit/);

  assert.match(dataStatusRoute, /mode === "security-smoke"/);
  assert.match(dataStatusRoute, /allowed-brazil/);
  assert.match(dataStatusRoute, /blocked-foreign/);
  assert.match(dataStatusRoute, /blocked-unknown/);
  assert.match(dataStatusRoute, /smoke-token=must-not-leak/);
  assert.match(dataStatusRoute, /recordBrazilAccessDecision/);
  assert.match(dataStatusRoute, /probeDistributedSecurityRateLimiter/);
  assert.match(dataStatusRoute, /verifyDataStatusGithubActionsRequest/);
});
