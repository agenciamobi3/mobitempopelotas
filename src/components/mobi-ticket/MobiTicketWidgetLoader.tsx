import { useEffect } from "react";

const WIDGET_SOURCE = "tempo_pelotas";
const FALLBACK_DELAY_MS = 1_500;
const IDLE_TIMEOUT_MS = 2_500;

type IdleCapableWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function MobiTicketWidgetLoader() {
  useEffect(() => {
    if (document.querySelector("script[data-mobi-ticket-widget]")) return;

    const idleWindow = window as IdleCapableWindow;
    let script: HTMLScriptElement | null = null;
    let idleHandle: number | null = null;
    let timerHandle: number | null = null;
    let cancelled = false;

    const loadWidget = () => {
      if (cancelled || document.querySelector("script[data-mobi-ticket-widget]")) return;

      script = document.createElement("script");
      script.dataset.mobiTicketWidget = "true";
      script.async = true;
      script.src = "https://agenciamobi.com.br/widget/mobi-ticket.js";
      script.dataset.source = WIDGET_SOURCE;
      document.body.appendChild(script);
    };

    if (typeof idleWindow.requestIdleCallback === "function") {
      idleHandle = idleWindow.requestIdleCallback(loadWidget, { timeout: IDLE_TIMEOUT_MS });
    } else {
      timerHandle = window.setTimeout(loadWidget, FALLBACK_DELAY_MS);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== null) idleWindow.cancelIdleCallback?.(idleHandle);
      if (timerHandle !== null) window.clearTimeout(timerHandle);
      script?.remove();
    };
  }, []);

  return null;
}
