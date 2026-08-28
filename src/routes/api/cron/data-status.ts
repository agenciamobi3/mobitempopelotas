import { createFileRoute } from "@tanstack/react-router";

import {
  evaluateBrazilAccess,
  type BrazilAccessDecisionReason,
} from "@/lib/brazil-only-access.server";
import { verifyDataStatusGithubActionsRequest } from "@/lib/github-actions-oidc.server";
import {
  recordBrazilAccessDecision,
} from "@/lib/access-observability.server";
import { hasBearerSecret, pushJsonResponse } from "@/lib/push/push-http.server";
import { probeDistributedSecurityRateLimiter } from "@/lib/security/request-firewall.server";
import { authorizeDataStatusCollectorToken } from "@/lib/status/data-status-collector-auth.server";
import { collectDataStatus } from "@/lib/status/data-status.server";
import { recordDataStatusOverview } from "@/lib/status/data-status-storage.server";

async function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (hasBearerSecret(request, cronSecret)) return true;
  if (await authorizeDataStatusCollectorToken(request)) return true;

  const oidcVerification = await verifyDataStatusGithubActionsRequest(request);
  if (oidcVerification.valid) return true;

  console.warn("[data-status/cron] Autorização recusada", {
    reason: oidcVerification.reason,
  });
  return false;
}

function syntheticBrowserRequest(country: string | null, path: string) {
  const headers = new Headers({
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "user-agent": "TempoPelotas-Security-Smoke/1.0",
    "cf-connecting-ip": "203.0.113.77",
  });
  if (country) headers.set("x-country-code", country);
  return new Request(`https://tempopelotas.com.br${path}`, { headers });
}

function hasExpectedDecision(reason: BrazilAccessDecisionReason, expected: BrazilAccessDecisionReason) {
  return reason === expected;
}

async function runSecuritySmoke() {
  const brazilRequest = syntheticBrowserRequest("BR", "/tempo-hoje-pelotas");
  const foreignRequest = syntheticBrowserRequest(
    "US",
    "/api/redemet/radar?frames=999&smoke-token=must-not-leak",
  );
  const unknownRequest = syntheticBrowserRequest(null, "/tempo-na-regiao-sul-rs");

  const brazilDecision = evaluateBrazilAccess(brazilRequest);
  const foreignDecision = evaluateBrazilAccess(foreignRequest);
  const unknownDecision = evaluateBrazilAccess(unknownRequest);

  const warnings: string[] = [];
  recordBrazilAccessDecision(foreignRequest, foreignDecision, {
    warn: (...args: unknown[]) => warnings.push(args.join(" ")),
    info: () => undefined,
  });

  const sanitizedLog = warnings[0] ?? "";
  const classification =
    hasExpectedDecision(brazilDecision.reason, "allowed-brazil") &&
    hasExpectedDecision(foreignDecision.reason, "blocked-foreign") &&
    hasExpectedDecision(unknownDecision.reason, "blocked-unknown") &&
    brazilDecision.blocked === false &&
    foreignDecision.blocked === true &&
    unknownDecision.blocked === true;
  const sanitizedLogs =
    warnings.length === 1 &&
    sanitizedLog.includes("geo_access_blocked") &&
    sanitizedLog.includes('"country":"US"') &&
    sanitizedLog.includes('"route":"/api/redemet/*"') &&
    !/smoke-token|203\.0\.113\.77|user-agent|frames=999/i.test(sanitizedLog);

  let distributedRateLimit = false;
  try {
    distributedRateLimit = await probeDistributedSecurityRateLimiter();
  } catch (error) {
    console.error("[security-smoke] Falha no rate limiter distribuído", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const success = classification && sanitizedLogs && distributedRateLimit;
  return pushJsonResponse(
    {
      success,
      checks: {
        classification,
        sanitizedLogs,
        distributedRateLimit,
      },
    },
    success ? 200 : 503,
  );
}

async function collectAndPersistStatus(request: Request) {
  if (!(await isAuthorized(request))) {
    return pushJsonResponse({ success: false, error: "Não autorizado." }, 401);
  }

  const mode = new URL(request.url).searchParams.get("mode");
  if (mode === "security-smoke") return runSecuritySmoke();

  try {
    const overview = await collectDataStatus();
    const persistence = await recordDataStatusOverview(overview);
    const openStates = overview.services.filter(
      (service) =>
        service.state === "partial" ||
        service.state === "offline" ||
        service.state === "maintenance",
    );

    return pushJsonResponse({
      success: true,
      checkedAt: overview.checkedAt,
      overall: overview.overall,
      services: overview.services.length,
      affectedServices: openStates.map((service) => ({
        id: service.id,
        state: service.state,
      })),
      persistence,
    });
  } catch (error) {
    console.error("[data-status/cron] Falha ao registrar monitoramento", {
      message: error instanceof Error ? error.message : String(error),
    });
    return pushJsonResponse(
      { success: false, error: "Não foi possível registrar o status das fontes." },
      500,
    );
  }
}

export const Route = createFileRoute("/api/cron/data-status")({
  server: {
    handlers: {
      GET: ({ request }) => collectAndPersistStatus(request),
      POST: ({ request }) => collectAndPersistStatus(request),
    },
  },
});
