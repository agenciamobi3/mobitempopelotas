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

type RecoveryRecord = {
  href: string;
  attemptedAt: number;
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

function currentHref() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function canAttemptRecovery() {
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
      JSON.stringify({ href, attemptedAt: Date.now() } satisfies RecoveryRecord),
    );
    return true;
  } catch {
    // Sem sessionStorage não há como garantir que uma recarga automática não entre em loop.
    return false;
  }
}

export function recoverStaleClientAssets(error?: unknown) {
  if (typeof window === "undefined") return false;
  if (error !== undefined && !isStaleClientAssetError(error)) return false;
  if (!canAttemptRecovery()) return false;

  window.location.reload();
  return true;
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
