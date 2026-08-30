import { useEffect } from "react";

const WIDGET_SOURCE = "tempo_pelotas";
const CANONICAL_LOADER_URL = "https://agenciamobi.com.br/widgets/mobi-support-widget-loader.js";
const LEGACY_WIDGET_URL = "https://agenciamobi.com.br/widget/mobi-ticket.js";
const FALLBACK_DELAY_MS = 1_500;
const IDLE_TIMEOUT_MS = 2_500;
const FALLBACK_CATEGORIES = [
  "Erro no portal",
  "Sugestão",
  "Dados incorretos",
  "Dúvida",
  "Solicitação de melhoria",
];

type IdleCapableWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function getWidgetInstallToken() {
  return import.meta.env.VITE_MOBI_TICKET_WIDGET_TOKEN?.trim() || "";
}

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

      const installToken = getWidgetInstallToken();
      const canonicalReady = Boolean(installToken);

      script = document.createElement("script");
      script.dataset.mobiTicketWidget = "true";
      script.async = true;
      script.src = canonicalReady ? CANONICAL_LOADER_URL : LEGACY_WIDGET_URL;
      script.dataset.source = WIDGET_SOURCE;

      if (canonicalReady) {
        // A chave da instalação é pública por definição: ela termina no browser e
        // só ganha autoridade junto da allowlist de origem validada pelo Core.
        // O valor real nunca fica versionado no Git.
        script.dataset.token = installToken;
        script.dataset.configMode = "remote";
        script.dataset.organization = "Tempo Pelotas";
        script.dataset.appName = "Portal Tempo Pelotas";
        script.dataset.categories = FALLBACK_CATEGORIES.join("|");
        script.dataset.defaultCategory = "Erro no portal";
        script.dataset.defaultPriority = "medium";
        script.dataset.title = "Falar com o suporte";
        script.dataset.subtitle = "Encontrou um erro, dado incorreto ou tem uma sugestão? Envie para a equipe.";
        script.dataset.buttonText = "Suporte";
        script.dataset.buttonIcon = "🎫";
        script.dataset.position = "bottom-right";
        script.dataset.statusIndicator = "true";
      }

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
