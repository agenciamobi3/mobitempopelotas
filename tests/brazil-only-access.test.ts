import assert from "node:assert/strict";
import test from "node:test";

import {
  createBrazilOnlyAccessResponse,
  resolveRequestCountry,
  shouldBlockForeignBrowserRequest,
} from "../src/lib/brazil-only-access.server.ts";

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
  assert.equal(resolveRequestCountry(request), "BR");
  assert.equal(shouldBlockForeignBrowserRequest(request), false);
  assert.equal(createBrazilOnlyAccessResponse(request), null);
});

test("foreign browsers stop before the app and receive only the centered brand page", async () => {
  const request = requestWithCountry("https://tempopelotas.com.br/tempo-hoje-pelotas", "ES");
  const response = createBrazilOnlyAccessResponse(request);

  assert.ok(response);
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.match(response.headers.get("content-security-policy") ?? "", /connect-src 'none'/);
  assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/);

  const html = await response.text();
  assert.match(html, /\/brand\/tempo-pelotas-purple\.svg/);
  assert.match(html, /<main aria-label="Tempo Pelotas">/);
  assert.doesNotMatch(html, /<script\b/i);
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

test("the single logo asset remains reachable to render the restricted page", () => {
  const request = requestWithCountry(
    "https://tempopelotas.com.br/brand/tempo-pelotas-purple.svg",
    "FR",
  );
  request.headers.set("sec-fetch-dest", "image");
  assert.equal(shouldBlockForeignBrowserRequest(request), false);
});

test("unknown production browser country fails closed, while local development is unaffected", () => {
  const production = requestWithCountry("https://tempopelotas.com.br/", null);
  const local = requestWithCountry("http://localhost:3000/", "US");

  assert.equal(shouldBlockForeignBrowserRequest(production), true);
  assert.equal(shouldBlockForeignBrowserRequest(local), false);
});

test("server-to-server monitoring is not mistaken for a visitor", () => {
  const request = requestWithCountry("https://tempopelotas.com.br/radar-e-satelite-pelotas", "US", {
    browser: false,
  });

  assert.equal(shouldBlockForeignBrowserRequest(request), false);
  assert.equal(createBrazilOnlyAccessResponse(request), null);
});
