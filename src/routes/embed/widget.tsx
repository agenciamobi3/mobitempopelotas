import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import "@/components/embed/LaranjalEmbedIsolation.css";
import { LaranjalLevelEmbed } from "@/components/embed/LaranjalLevelEmbed";
import { ObsWeatherStatusWidget } from "@/components/embed/ObsWeatherStatusWidget";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { getObsWeatherStatus } from "@/lib/weather/obs-weather-status.functions";
import { getPublicWidgetDefinition } from "@/lib/widgets/widget.functions";

const ROBOTS_POLICY = "noindex, nofollow, noarchive, nosnippet, noimageindex";

function validateSearch(search: Record<string, unknown>) {
  return {
    token: typeof search.token === "string" ? search.token : "",
  };
}

export const Route = createFileRoute("/embed/widget")({
  validateSearch,
  loaderDeps: ({ search }) => ({ token: search.token }),
  head: () => ({
    meta: [
      { title: "Widget Tempo Pelotas" },
      { name: "robots", content: ROBOTS_POLICY },
      { name: "googlebot", content: ROBOTS_POLICY },
      { name: "theme-color", content: "#ffffff" },
    ],
  }),
  loader: async ({ deps }) => {
    if (!deps.token) return { definition: null, payload: null } as const;

    const definition = await getPublicWidgetDefinition({ data: { token: deps.token } }).catch(
      () => null,
    );
    if (!definition) return { definition: null, payload: null } as const;

    if (definition.widgetType === "nivel-laranjal") {
      const payload = await getLaranjalLevelData();
      return { definition, payload, kind: "nivel-laranjal" as const };
    }

    if (definition.widgetType === "status-tempo-agora") {
      const payload = await getObsWeatherStatus();
      return { definition, payload, kind: "status-tempo-agora" as const };
    }

    return { definition: null, payload: null } as const;
  },
  staleTime: 60 * 1_000,
  component: GeneratedWidgetRoute,
});

function useResponsiveEmbedHeight(token: string | null) {
  useEffect(() => {
    if (!token || typeof window === "undefined" || window.parent === window) return;

    let frame = 0;
    const notify = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const height = Math.max(
          document.documentElement.scrollHeight,
          document.body?.scrollHeight ?? 0,
        );
        window.parent.postMessage(
          {
            source: "tempo-pelotas-widget",
            token,
            type: "resize",
            height,
          },
          "*",
        );
      });
    };

    notify();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(notify) : null;
    if (observer) {
      observer.observe(document.documentElement);
      if (document.body) observer.observe(document.body);
    }
    window.addEventListener("load", notify);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("load", notify);
    };
  }, [token]);
}

function GeneratedWidgetRoute() {
  const snapshot = Route.useLoaderData();
  const token = snapshot.definition?.publicToken ?? null;
  useResponsiveEmbedHeight(token);

  if (!snapshot.definition || !snapshot.payload || !("kind" in snapshot)) {
    return (
      <main
        style={{
          boxSizing: "border-box",
          width: "100%",
          padding: "18px",
          border: "1px solid rgba(15, 23, 42, 0.12)",
          borderRadius: "16px",
          background: "#ffffff",
          color: "#0f172a",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <strong>Widget indisponível</strong>
        <p style={{ margin: "8px 0 0", fontSize: "14px", lineHeight: 1.5 }}>
          Este widget foi desativado, removido ou o endereço não é mais válido.
        </p>
      </main>
    );
  }

  return (
    <div data-widget-theme={snapshot.definition.theme} data-widget-token={snapshot.definition.publicToken}>
      <h1 className="visually-hidden">{snapshot.definition.title}</h1>
      {snapshot.kind === "nivel-laranjal" ? (
        <LaranjalLevelEmbed data={snapshot.payload} />
      ) : (
        <ObsWeatherStatusWidget data={snapshot.payload} />
      )}
    </div>
  );
}
