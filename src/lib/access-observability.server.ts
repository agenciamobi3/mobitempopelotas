import type { BrazilAccessDecision } from "./brazil-only-access.server";

const SNAPSHOT_EVERY_REQUESTS = 100;
const SNAPSHOT_EVERY_MS = 5 * 60 * 1_000;
const MAX_TRACKED_ROUTES = 64;

type AccessLog = Pick<Console, "info" | "warn">;

type AccessMetricsState = {
  startedAt: number;
  lastSnapshotAt: number;
  requestsSinceSnapshot: number;
  totalEntrypointRequests: number;
  browserRequests: number;
  allowedBrazil: number;
  blockedForeign: number;
  blockedUnknown: number;
  bypassNonBrowser: number;
  bypassNonProduction: number;
  blockedRoutes: Map<string, number>;
};

type AccessGlobal = typeof globalThis & {
  __tempoPelotasAccessMetrics?: AccessMetricsState;
};

function createState(): AccessMetricsState {
  const now = Date.now();
  return {
    startedAt: now,
    lastSnapshotAt: now,
    requestsSinceSnapshot: 0,
    totalEntrypointRequests: 0,
    browserRequests: 0,
    allowedBrazil: 0,
    blockedForeign: 0,
    blockedUnknown: 0,
    bypassNonBrowser: 0,
    bypassNonProduction: 0,
    blockedRoutes: new Map(),
  };
}

function state() {
  const runtime = globalThis as AccessGlobal;
  runtime.__tempoPelotasAccessMetrics ??= createState();
  return runtime.__tempoPelotasAccessMetrics;
}

function routeBucket(request: Request) {
  try {
    const pathname = new URL(request.url).pathname;

    if (pathname.startsWith("/api/")) {
      const parts = pathname.split("/").filter(Boolean);
      return `/${parts.slice(0, 2).join("/")}/*`;
    }
    if (pathname.startsWith("/_server/")) return "/_server/*";
    if (pathname.startsWith("/tempo-em/")) {
      const slug = pathname.slice("/tempo-em/".length);
      return /^[a-z0-9-]{1,64}$/.test(slug) ? pathname : "/tempo-em/*";
    }
    if (/^\/[a-z0-9/_.-]{0,95}$/i.test(pathname)) return pathname || "/";
    return "/other";
  } catch {
    return "/invalid-url";
  }
}

function incrementBlockedRoute(metrics: AccessMetricsState, route: string) {
  if (metrics.blockedRoutes.has(route)) {
    metrics.blockedRoutes.set(route, (metrics.blockedRoutes.get(route) ?? 0) + 1);
    return;
  }

  if (metrics.blockedRoutes.size >= MAX_TRACKED_ROUTES) {
    metrics.blockedRoutes.set("/other", (metrics.blockedRoutes.get("/other") ?? 0) + 1);
    return;
  }

  metrics.blockedRoutes.set(route, 1);
}

function snapshotPayload(metrics: AccessMetricsState) {
  const topBlockedRoutes = [...metrics.blockedRoutes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([route, count]) => ({ route, count }));

  return {
    event: "geo_access_snapshot",
    runtimeStartedAt: new Date(metrics.startedAt).toISOString(),
    totalEntrypointRequests: metrics.totalEntrypointRequests,
    browserRequests: metrics.browserRequests,
    allowedBrazil: metrics.allowedBrazil,
    blockedForeign: metrics.blockedForeign,
    blockedUnknown: metrics.blockedUnknown,
    bypassNonBrowser: metrics.bypassNonBrowser,
    bypassNonProduction: metrics.bypassNonProduction,
    topBlockedRoutes,
  };
}

export function recordBrazilAccessDecision(
  request: Request,
  decision: BrazilAccessDecision,
  logger: AccessLog = console,
) {
  const metrics = state();
  const route = routeBucket(request);
  const now = Date.now();

  metrics.totalEntrypointRequests += 1;
  metrics.requestsSinceSnapshot += 1;
  if (decision.browser) metrics.browserRequests += 1;

  switch (decision.reason) {
    case "allowed-brazil":
      metrics.allowedBrazil += 1;
      break;
    case "blocked-foreign":
      metrics.blockedForeign += 1;
      incrementBlockedRoute(metrics, route);
      logger.warn(
        "[access-control]",
        JSON.stringify({
          event: "geo_access_blocked",
          reason: decision.reason,
          country: decision.country,
          route,
        }),
      );
      break;
    case "blocked-unknown":
      metrics.blockedUnknown += 1;
      incrementBlockedRoute(metrics, route);
      logger.warn(
        "[access-control]",
        JSON.stringify({
          event: "geo_access_blocked",
          reason: decision.reason,
          country: "unknown",
          route,
        }),
      );
      break;
    case "bypass-non-browser":
      metrics.bypassNonBrowser += 1;
      break;
    case "bypass-non-production":
      metrics.bypassNonProduction += 1;
      break;
  }

  if (
    metrics.requestsSinceSnapshot >= SNAPSHOT_EVERY_REQUESTS ||
    now - metrics.lastSnapshotAt >= SNAPSHOT_EVERY_MS
  ) {
    logger.info("[access-metrics]", JSON.stringify(snapshotPayload(metrics)));
    metrics.requestsSinceSnapshot = 0;
    metrics.lastSnapshotAt = now;
  }
}

export function resetAccessMetricsForTests() {
  (globalThis as AccessGlobal).__tempoPelotasAccessMetrics = createState();
}
