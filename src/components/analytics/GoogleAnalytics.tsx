import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

export const GOOGLE_ANALYTICS_MEASUREMENT_ID = "G-97YX7HPD90";
const GOOGLE_TAG_SCRIPT_ID = "tempo-pelotas-google-analytics";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
};

function getAnalyticsWindow() {
  return window as AnalyticsWindow;
}

function ensureGoogleAnalytics() {
  const analyticsWindow = getAnalyticsWindow();
  analyticsWindow.dataLayer ??= [];
  analyticsWindow.gtag ??= (...args: unknown[]) => {
    analyticsWindow.dataLayer?.push(args);
  };

  if (!document.getElementById(GOOGLE_TAG_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = GOOGLE_TAG_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}`;
    script.referrerPolicy = "strict-origin-when-cross-origin";
    document.head.appendChild(script);
  }

  if (!document.documentElement.dataset.ga4Initialized) {
    analyticsWindow.gtag("js", new Date());
    analyticsWindow.gtag("config", GOOGLE_ANALYTICS_MEASUREMENT_ID, {
      send_page_view: false,
    });
    document.documentElement.dataset.ga4Initialized = "true";
  }
}

export function GoogleAnalytics() {
  const href = useRouterState({ select: (state) => state.location.href });

  useEffect(() => {
    ensureGoogleAnalytics();
    const analyticsWindow = getAnalyticsWindow();
    analyticsWindow.gtag?.("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: `${window.location.pathname}${window.location.search}`,
    });
  }, [href]);

  return null;
}
