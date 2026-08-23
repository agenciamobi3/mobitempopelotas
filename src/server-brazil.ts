import { recordBrazilAccessDecision } from "./lib/access-observability.server";
import {
  createBrazilOnlyAccessResponse,
  evaluateBrazilAccess,
  isGeoRestrictedProductionHost,
} from "./lib/brazil-only-access.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const SENSITIVE_API_PREFIXES = ["/api/account/", "/api/push/", "/api/cron/"];

let appServerPromise: Promise<ServerEntry> | undefined;

async function getAppServer() {
  if (!appServerPromise) {
    appServerPromise = import("./server").then((module) => module.default as ServerEntry);
  }
  return appServerPromise;
}

function applyBaselineSecurityHeaders(request: Request, response: Response) {
  const url = new URL(request.url);
  const headers = new Headers(response.headers);
  const isEmbed = url.pathname.startsWith("/embed/");
  const isSensitiveApi = SENSITIVE_API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));

  if (!headers.has("X-Content-Type-Options")) headers.set("X-Content-Type-Options", "nosniff");
  if (!headers.has("Referrer-Policy")) {
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }
  if (!headers.has("Permissions-Policy")) {
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  }
  if (!isEmbed && !headers.has("X-Frame-Options")) headers.set("X-Frame-Options", "SAMEORIGIN");

  if (url.protocol === "https:" && isGeoRestrictedProductionHost(request)) {
    headers.set("Strict-Transport-Security", "max-age=31536000");
  }

  if (isSensitiveApi) {
    headers.set("Cache-Control", "private, no-store, max-age=0");
    headers.set("CDN-Cache-Control", "no-store");
    headers.set("Pragma", "no-cache");
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const decision = evaluateBrazilAccess(request);
    recordBrazilAccessDecision(request, decision);

    const restricted = createBrazilOnlyAccessResponse(request, decision);
    if (restricted) return applyBaselineSecurityHeaders(request, restricted);

    const appServer = await getAppServer();
    const response = await appServer.fetch(request, env, ctx);
    return applyBaselineSecurityHeaders(request, response);
  },
};
