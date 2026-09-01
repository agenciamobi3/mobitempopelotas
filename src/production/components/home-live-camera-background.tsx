import { memo, useEffect, useMemo, useState } from "react";

const MAX_RELOAD_ATTEMPTS = 2;
const PLAYER_RETRY_DELAY_MS = 9_000;
const PLAYER_IDLE_TIMEOUT_MS = 2_500;
const PLAYER_FALLBACK_DELAY_MS = 1_500;

type HomeLiveCameraBackgroundProps = {
  embedUrl: string;
  title: string;
};

type NavigatorConnection = EventTarget & {
  effectiveType?: string;
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NavigatorConnection;
  mozConnection?: NavigatorConnection;
  webkitConnection?: NavigatorConnection;
};

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function getConnection() {
  const navigatorWithConnection = navigator as NavigatorWithConnection;
  return (
    navigatorWithConnection.connection ??
    navigatorWithConnection.mozConnection ??
    navigatorWithConnection.webkitConnection ??
    null
  );
}

function connectionAllowsBackgroundVideo() {
  const connection = getConnection();
  if (!navigator.onLine || connection?.saveData) return false;
  return connection?.effectiveType !== "slow-2g" && connection?.effectiveType !== "2g";
}

function buildBackgroundPlayerUrl(embedUrl: string, attempt: number) {
  try {
    const url = new URL(embedUrl);
    if (url.protocol !== "https:") return null;

    url.searchParams.set("autoplay", "1");
    url.searchParams.set("mute", "1");
    url.searchParams.set("controls", "0");
    url.searchParams.set("playsinline", "1");
    url.searchParams.set("disablekb", "1");
    url.searchParams.set("fs", "0");
    url.searchParams.set("iv_load_policy", "3");
    url.searchParams.set("modestbranding", "1");
    url.searchParams.set("rel", "0");
    url.searchParams.set("tp_reload", String(attempt));

    return url.toString();
  } catch {
    return null;
  }
}

function HomeLiveCameraBackgroundComponent({
  embedUrl,
  title,
}: HomeLiveCameraBackgroundProps) {
  const [attempt, setAttempt] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [shouldLoadPlayer, setShouldLoadPlayer] = useState(false);
  const playerUrl = useMemo(() => buildBackgroundPlayerUrl(embedUrl, attempt), [attempt, embedUrl]);

  useEffect(() => {
    setAttempt(0);
    setIsReady(false);
    setShouldLoadPlayer(false);
  }, [embedUrl]);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = getConnection();
    const idleWindow = window as IdleWindow;
    let idleHandle: number | null = null;
    let fallbackTimer: number | null = null;

    const cancelPendingLoad = () => {
      if (idleHandle !== null) idleWindow.cancelIdleCallback?.(idleHandle);
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      idleHandle = null;
      fallbackTimer = null;
    };

    const schedulePlayer = () => {
      cancelPendingLoad();

      if (
        reducedMotionQuery.matches ||
        document.visibilityState !== "visible" ||
        !connectionAllowsBackgroundVideo()
      ) {
        setShouldLoadPlayer(false);
        return;
      }

      const revealPlayer = () => {
        idleHandle = null;
        fallbackTimer = null;
        if (
          document.visibilityState === "visible" &&
          !reducedMotionQuery.matches &&
          connectionAllowsBackgroundVideo()
        ) {
          setShouldLoadPlayer(true);
        }
      };

      if (idleWindow.requestIdleCallback) {
        idleHandle = idleWindow.requestIdleCallback(revealPlayer, {
          timeout: PLAYER_IDLE_TIMEOUT_MS,
        });
      } else {
        fallbackTimer = window.setTimeout(revealPlayer, PLAYER_FALLBACK_DELAY_MS);
      }
    };

    schedulePlayer();
    window.addEventListener("online", schedulePlayer);
    window.addEventListener("offline", schedulePlayer);
    document.addEventListener("visibilitychange", schedulePlayer);
    connection?.addEventListener("change", schedulePlayer);
    reducedMotionQuery.addEventListener("change", schedulePlayer);

    return () => {
      cancelPendingLoad();
      window.removeEventListener("online", schedulePlayer);
      window.removeEventListener("offline", schedulePlayer);
      document.removeEventListener("visibilitychange", schedulePlayer);
      connection?.removeEventListener("change", schedulePlayer);
      reducedMotionQuery.removeEventListener("change", schedulePlayer);
    };
  }, [embedUrl]);

  useEffect(() => {
    if (!shouldLoadPlayer || !playerUrl || isReady || attempt >= MAX_RELOAD_ATTEMPTS) return;

    const timer = window.setTimeout(() => {
      setIsReady(false);
      setAttempt((current) => Math.min(current + 1, MAX_RELOAD_ATTEMPTS));
    }, PLAYER_RETRY_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [attempt, isReady, playerUrl, shouldLoadPlayer]);

  if (!playerUrl || !shouldLoadPlayer) return null;

  function retryPlayer() {
    if (attempt >= MAX_RELOAD_ATTEMPTS) return;
    setIsReady(false);
    setAttempt((current) => Math.min(current + 1, MAX_RELOAD_ATTEMPTS));
  }

  return (
    <div
      className={`tp-home-hero__live-camera${isReady ? " is-ready" : ""}`}
      data-player-attempt={attempt}
      aria-hidden="true"
    >
      <iframe
        key={`${embedUrl}-${attempt}`}
        src={playerUrl}
        title={`${title} — transmissão visual ao vivo sem áudio`}
        tabIndex={-1}
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setIsReady(true)}
        onError={retryPlayer}
      />
    </div>
  );
}

// O player é uma camada independente dos dados meteorológicos do Hero.
// Temperatura, alertas, pressão, vento e previsão podem atualizar e renderizar
// novamente sem tocar no iframe. O player só entra em um novo ciclo quando a
// URL real da transmissão muda (ou quando o próprio mecanismo de retry atua).
export const HomeLiveCameraBackground = memo(
  HomeLiveCameraBackgroundComponent,
  (previous, next) => previous.embedUrl === next.embedUrl,
);

HomeLiveCameraBackground.displayName = "HomeLiveCameraBackground";
