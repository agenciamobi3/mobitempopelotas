import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
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
import { RouteLoadingOverlay } from "@/components/navigation/RouteLoadingOverlay";
import { PushNotificationsManager } from "@/components/pwa/PushNotificationsManager";
import { PwaAppExperience } from "@/components/pwa/PwaAppExperience";
import { PwaManager } from "@/components/pwa/PwaManager";
import { WeatherMinuteRefresh } from "@/components/weather/WeatherMinuteRefresh";
import { reportLovableError } from "@/lib/lovable-error-reporting";
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

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
};

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
        <Link className="primary-link" to="/">
          Voltar para o início
        </Link>
      </section>
    </SiteLayout>
  );
}

function ErrorComponent({ error }: { error: Error; reset: () => void }) {
  console.error(error);

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <SiteLayout forceShell>
      <section className="status-page" aria-labelledby="error-title">
        <p className="status-kicker">Erro inesperado</p>
        <h1 id="error-title">Não foi possível carregar esta página</h1>
        <p>Ocorreu um erro inesperado. Tente novamente ou retorne para a página inicial.</p>
        <div className="status-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
          <Link className="secondary-link" to="/">
            Voltar para o início
          </Link>
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
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}`}
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

  return (
    <QueryClientProvider client={queryClient}>
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
      <PushNotificationsManager />
      <MobiTicketWidgetLoader />
    </QueryClientProvider>
  );
}
