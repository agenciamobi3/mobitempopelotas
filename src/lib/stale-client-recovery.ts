const RECOVERY_STORAGE_KEY = "tempo-pelotas:stale-client-recovery";
const RECOVERY_PARAM = "__tp_recover";
const RECOVERY_WINDOW_MS = 60_000;

const STALE_ASSET_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /importing a module script failed/i,
  /failed to load module script/i,
  /chunkloaderror/i,
  /loading chunk [^ ]+ failed/i,
  /unable to preload css/i,
];

const TRANSIENT_NAVIGATION_PATTERNS = [
  /failed to fetch/i,
  /fetch failed/i,
  /networkerror/i,
  /network error/i,
  /load failed/i,
  /failed to load resource/i,
  /server function/i,
  /serverfn/i,
  /unexpected token ['"]?</i,
  /\b(?:404|408|410|425|429|500|502|503|504)\b/,
];

type RecoveryRecord = {
  href: string;
  attemptedAt: number;
  reason: "asset" | "navigation" | "runtime";
};

function errorMessage(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (error instanceof Response) return `Response ${error.status} ${error.url}`;
  return String(error ?? "");
}

export function isStaleClientAssetError(error: unknown) {
  const message = errorMessage(error);
  return STALE_ASSET_PATTERNS.some((pattern) => pattern.test(message));
}

export function isTransientClientNavigationError(error: unknown) {
  if (error instanceof Response) {
    return [404, 408, 410, 425, 429, 500, 502, 503, 504].includes(error.status);
  }

  const message = errorMessage(error);
  return TRANSIENT_NAVIGATION_PATTERNS.some((pattern) => pattern.test(message));
}

function logicalHref() {
  const url = new URL(window.location.href);
  url.searchParams.delete(RECOVERY_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}

function recoveryUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set(RECOVERY_PARAM, String(Date.now()));
  return url.href;
}

function stripRecoveryParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(RECOVERY_PARAM)) return;
  url.searchParams.delete(RECOVERY_PARAM);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function canAttemptRecovery(reason: RecoveryRecord["reason"]) {
  const href = logicalHref();

  try {
    const raw = window.sessionStorage.getItem(RECOVERY_STORAGE_KEY);
    const previous = raw ? (JSON.parse(raw) as Partial<RecoveryRecord>) : null;
    const attemptedRecently =
      previous?.href === href &&
      typeof previous.attemptedAt === "number" &&
      Date.now() - previous.attemptedAt < RECOVERY_WINDOW_MS;

    if (attemptedRecently) return false;

    window.sessionStorage.setItem(
      RECOVERY_STORAGE_KEY,
      JSON.stringify({ href, attemptedAt: Date.now(), reason } satisfies RecoveryRecord),
    );
    return true;
  } catch {
    // Sem sessionStorage não há como garantir que uma navegação automática não entre em loop.
    return false;
  }
}

function navigateToFreshDocument(reason: RecoveryRecord["reason"]) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  if (!canAttemptRecovery(reason)) return false;
  window.location.replace(recoveryUrl());
  return true;
}

export function markClientRuntimeReady() {
  if (typeof window === "undefined") return;
  stripRecoveryParam();
}

export function recoverStaleClientAssets(error?: unknown) {
  if (typeof window === "undefined") return false;
  if (error !== undefined && !isStaleClientAssetError(error)) return false;
  return navigateToFreshDocument("asset");
}

/**
 * O boundary global só força uma navegação fresca quando há evidência de asset
 * obsoleto ou falha transitória de navegação. Exceções reais de runtime não são
 * mascaradas como problema de versão: permanecem no boundary para diagnóstico.
 */
export function recoverClientNavigationFailure(error: unknown) {
  if (typeof window === "undefined") return false;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;

  if (isStaleClientAssetError(error)) {
    return navigateToFreshDocument("asset");
  }

  if (isTransientClientNavigationError(error)) {
    return navigateToFreshDocument("navigation");
  }

  return false;
}

export function installVitePreloadRecovery() {
  if (typeof window === "undefined") return () => undefined;

  const handlePreloadError = (event: Event) => {
    if (!recoverStaleClientAssets()) return;
    event.preventDefault();
  };

  window.addEventListener("vite:preloadError", handlePreloadError);
  return () => window.removeEventListener("vite:preloadError", handlePreloadError);
}
