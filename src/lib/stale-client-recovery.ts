const RECOVERY_STORAGE_KEY = "tempo-pelotas:stale-client-recovery";
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
  reason: "asset" | "navigation";
};

let clientRuntimeReady = false;

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

function currentHref() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function canAttemptRecovery(reason: RecoveryRecord["reason"]) {
  const href = currentHref();

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
    // Sem sessionStorage não há como garantir que uma recarga automática não entre em loop.
    return false;
  }
}

function hardReload(reason: RecoveryRecord["reason"]) {
  if (!canAttemptRecovery(reason)) return false;
  window.location.reload();
  return true;
}

export function markClientRuntimeReady() {
  if (typeof window === "undefined") return;
  clientRuntimeReady = true;
}

export function recoverStaleClientAssets(error?: unknown) {
  if (typeof window === "undefined") return false;
  if (error !== undefined && !isStaleClientAssetError(error)) return false;
  return hardReload("asset");
}

/**
 * Falhas de navegação cliente podem surgir quando uma aba antiga atravessa um
 * novo deploy: o bundle ainda em memória tenta carregar um chunk ou server fn
 * que já pertence à versão anterior. Nessa situação uma navegação completa da
 * própria URL atualiza HTML + runtime e normalmente resolve o problema.
 *
 * A recuperação genérica só é habilitada depois que o app hidratou com
 * sucesso. Assim, um bug determinístico no carregamento inicial não entra em
 * ciclo de reload. sessionStorage limita a uma tentativa automática por URL.
 */
export function recoverClientNavigationFailure(error: unknown) {
  if (typeof window === "undefined") return false;

  if (isStaleClientAssetError(error)) {
    return hardReload("asset");
  }

  if (!clientRuntimeReady || !isTransientClientNavigationError(error)) return false;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;

  return hardReload("navigation");
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
