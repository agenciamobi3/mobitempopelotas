import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import mapLibreCss from "maplibre-gl/dist/maplibre-gl.css?url";
import { useEffect, type ReactNode } from "react";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { ViewportScrollRoot } from "@/components/layout/ViewportScrollRoot";
import { MobiTicketWidgetLoader } from "@/components/mobi-ticket/MobiTicketWidgetLoader";
import { PublicDocumentNavigationGuard } from "@/components/navigation/PublicDocumentNavigationGuard";
import { RouteLoadingOverlay } from "@/components/navigation/RouteLoadingOverlay";
import { PwaAppExperience } from "@/components/pwa/PwaAppExperience";
import { PwaManager } from "@/components/pwa/PwaManager";
import { WeatherMinuteRefresh } from "@/components/weather/WeatherMinuteRefresh";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import {
  installVitePreloadRecovery,
  markClientRuntimeReady,
  recoverClientNavigationFailure,
} from "@/lib/stale-client-recovery";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SOCIAL_IMAGE_URL,
  absoluteUrl,
  createWebsiteJsonLd,
} from "@/lib/site-config";
import productionCss from "@/production/production-styles.css?url";
import appCss from "../styles.css?url";

const GOOGLE_ANALYTICS_MEASUREMENT_ID = "G-97YX7HPD90";
const GOOGLE_ANALYTICS_IDLE_TIMEOUT_MS = 3_000;
const GOOGLE_ANALYTICS_FALLBACK_DELAY_MS = 1_500;
const GOOGLE_ADSENSE_CLIENT_ID = "ca-pub-4545997973925216";
const PUBLIC_RUNTIME_RELEASE = "2026-08-30-public-stability-met-norway-v1";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
};

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

function GoogleAnalyticsLoader() {
  useEffect(() => {
    const idleWindow = window as IdleWindow;
    let idleHandle: number | null = null;
    let fallbackTimer: number | null = null;

    const loadAnalytics = () => {
      idleHandle = null;
      fallbackTimer = null;
      if (document.querySelector("script[data-tempo-pelotas-ga4]")) return;

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}`;
      script.dataset.tempoPelotasGa4 = "true";
      document.head.appendChild(script);
    };

    if (idleWindow.requestIdleCallback) {
      idleHandle = idleWindow.requestIdleCallback(loadAnalytics, {
        timeout: GOOGLE_ANALYTICS_IDLE_TIMEOUT_MS,
      });
    } else {
      fallbackTimer = window.setTimeout(loadAnalytics, GOOGLE_ANALYTICS_FALLBACK_DELAY_MS);
    }

    return () => {
      if (idleHandle !== null) idleWindow.cancelIdleCallback?.(idleHandle);
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
    };
  }, []);

  return null;
}

function GoogleAnalyticsPageviews() {
  const href = useRouterState({ select: (state) => state.location.href });

  useEffect(() => {
    const analyticsWindow = window as AnalyticsWindow;
    if (typeof analyticsWindow.gtag !== "function") return;

    analyticsWindow.gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: `${window.location.pathname}${window.location.search}`,
    });
  }, [href]);

  return null;
}

function NotFoundComponent() {
  return (
    <SiteLayout forceShell>
      <section className="status-page" aria-labelledby="not-found-title">
        <p className="status-kicker">Erro 404</p>
        <h1 id="not-found-title">Página não encontrada</h1>
        <p>O endereço acessado não existe ou foi alterado.</p>
        <a className="primary-link" href="/">
          Voltar para o início
        </a>
      </section>
    </SiteLayout>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
    recoverClientNavigationFailure(error);
  }, [error]);

  return (
    <SiteLayout forceShell>
      <section className="status-page" aria-labelledby="recovery-title" role="alert">
        <p className="status-kicker">Falha de navegação</p>
        <h1 id="recovery-title">Não foi possível concluir esta página</h1>
        <p>
          O portal tentou recuperar automaticamente falhas transitórias de carregamento. Se esta
          mensagem permaneceu visível, use “Tentar novamente” ou abra uma das áreas abaixo por
          carregamento direto.
        </p>
        <div className="status-actions">
          <button className="primary-link" type="button" onClick={reset}>
            Tentar novamente
          </button>
          <a className="secondary-link" href="/">
            Tempo agora
          </a>
          <a className="secondary-link" href="/tempo-hoje-pelotas">
            Tempo hoje
          </a>
          <a className="secondary-link" href="/previsao-7-dias-pelotas">
            7 dias
          </a>
          <a className="secondary-link" href="/chuva-em-pelotas">
            Chuva
          </a>
          <a className="secondary-link" href="/radar-e-satelite-pelotas">
            Radar
          </a>
          <a className="secondary-link" href="/situacao-hidrologica-pelotas">
            Situação das águas
          </a>
          <a className="secondary-link" href="/tempo-na-regiao-sul-rs">
            Região Sul do RS
          </a>
        </div>
      </section>
    </SiteLayout>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "google-adsense-account", content: GOOGLE_ADSENSE_CLIENT_ID },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "application-name", content: SITE_NAME },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "color-scheme", content: "light" },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:image", content: SOCIAL_IMAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESCRIPTION },
      { name: "twitter:image", content: SOCIAL_IMAGE_URL },
      { name: "theme-color", content: "#071e2f" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: mapLibreCss },
      { rel: "stylesheet", href: productionCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      {
        rel: "icon",
        href: "/brand/tempo-pelotas-icon.png",
        type: "image/png",
        sizes: "512x512",
      },
      {
        rel: "shortcut icon",
        href: "/brand/tempo-pelotas-icon.png",
        type: "image/png",
      },
      {
        rel: "apple-touch-icon",
        href: "/brand/tempo-pelotas-icon.png",
        sizes: "512x512",
      },
      {
        rel: "alternate",
        type: "application/feed+json",
        href: absoluteUrl("/feed"),
        title: "Tempo Pelotas — feed JSON",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(createWebsiteJsonLd()),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const analyticsBootstrap = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ANALYTICS_MEASUREMENT_ID}', {
  send_page_view: false,
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});`;

  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${GOOGLE_ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        />
        <script dangerouslySetInnerHTML={{ __html: analyticsBootstrap }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    markClientRuntimeReady();
    return installVitePreloadRecovery();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <a
        className="visually-hidden"
        href="/api/runtime-version"
        aria-hidden="true"
        tabIndex={-1}
        data-tempo-pelotas-runtime-release={PUBLIC_RUNTIME_RELEASE}
      >
        Tempo Pelotas runtime {PUBLIC_RUNTIME_RELEASE}
      </a>
      <PublicDocumentNavigationGuard />
      <GoogleAnalyticsLoader />
      <GoogleAnalyticsPageviews />
      <WeatherMinuteRefresh />
      <ViewportScrollRoot>
        <SiteLayout>
          <Outlet />
        </SiteLayout>
      </ViewportScrollRoot>
      <RouteLoadingOverlay />
      <PwaAppExperience />
      <PwaManager />
      <MobiTicketWidgetLoader />
    </QueryClientProvider>
  );
}
