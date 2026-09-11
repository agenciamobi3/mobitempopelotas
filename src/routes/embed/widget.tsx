import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, type CSSProperties } from "react";

import "@/components/embed/LaranjalEmbedIsolation.css";
import "@/components/embed/ManagedWidgetAppearance.css";
import { ManagedLaranjalLevelEmbed } from "@/components/embed/ManagedLaranjalLevelEmbed";
import { ObsWeatherStatusWidget } from "@/components/embed/ObsWeatherStatusWidget";
import { RainWidget } from "@/components/embed/RainWidget";
import { SevenDayForecastWidget } from "@/components/embed/SevenDayForecastWidget";
import { WindWidget } from "@/components/embed/WindWidget";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { getAggregatedPelotasWeather } from "@/lib/weather/aggregated-weather.functions";
import { getObsWeatherStatus } from "@/lib/weather/obs-weather-status.functions";
import { recordWidgetImpression } from "@/lib/widgets/widget-analytics.functions";
import {
  createAppearanceFromPreset,
  getWidgetStylePreset,
  isWidgetDensity,
  isWidgetStylePreset,
  widgetAppearanceCssVariables,
  widgetThemeForAppearance,
} from "@/lib/widgets/widget-appearance";
import {
  createDefaultWidgetContent,
  isWidgetPresentation,
  normalizeWidgetContent,
  type WidgetPresentation,
} from "@/lib/widgets/widget-content";
import {
  getPublicWidgetDefinition,
  type PublicWidgetDefinition,
} from "@/lib/widgets/widget.functions";
import { isWidgetType } from "@/lib/widgets/widget-registry";

const ROBOTS_POLICY = "noindex, nofollow, noarchive, nosnippet, noimageindex";
const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/i;
const HOST_PATTERN = /^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/;
const INTERNAL_WIDGET_HOSTS = new Set([
  "tempopelotas.com.br",
  "www.tempopelotas.com.br",
  "localhost",
  "127.0.0.1",
]);

function validateSearch(search: Record<string, unknown>) {
  return {
    token: typeof search.token === "string" ? search.token : "",
    v:
      typeof search.v === "string" || typeof search.v === "number"
        ? String(search.v)
        : "",
    host: typeof search.host === "string" ? search.host : "",
    previewType: typeof search.previewType === "string" ? search.previewType : "",
    preset: typeof search.preset === "string" ? search.preset : "",
    accent: typeof search.accent === "string" ? search.accent : "",
    radius:
      typeof search.radius === "string" || typeof search.radius === "number"
        ? String(search.radius)
        : "",
    density: typeof search.density === "string" ? search.density : "",
    presentation: typeof search.presentation === "string" ? search.presentation : "",
    blocks: typeof search.blocks === "string" ? search.blocks : "",
  };
}

type SearchDeps = ReturnType<typeof validateSearch>;

function createPreviewDefinition(deps: SearchDeps): PublicWidgetDefinition | null {
  if (!isWidgetType(deps.previewType)) return null;

  const preset = isWidgetStylePreset(deps.preset) ? deps.preset : "tempo-dark";
  const baseAppearance = createAppearanceFromPreset(preset);
  const parsedRadius = Number(deps.radius);
  const appearance = {
    ...baseAppearance,
    accentColor: HEX_COLOR_PATTERN.test(deps.accent)
      ? deps.accent.toUpperCase()
      : baseAppearance.accentColor,
    radius: Number.isInteger(parsedRadius)
      ? Math.max(0, Math.min(36, parsedRadius))
      : baseAppearance.radius,
    density: isWidgetDensity(deps.density) ? deps.density : baseAppearance.density,
  };
  const defaultContent = createDefaultWidgetContent(deps.previewType);
  const requestedBlocks = deps.blocks
    ? deps.blocks
        .split(",")
        .map((block) => block.trim())
        .filter(Boolean)
    : defaultContent.visibleBlocks;
  const content = normalizeWidgetContent(deps.previewType, {
    content: {
      presentation: isWidgetPresentation(deps.presentation)
        ? deps.presentation
        : defaultContent.presentation,
      visibleBlocks: requestedBlocks,
    },
  });

  return {
    publicToken: "preview",
    widgetType: deps.previewType,
    title: "Prévia do widget",
    theme: widgetThemeForAppearance(appearance),
    appearance,
    content,
    config: {},
    version: 0,
    updatedAt: new Date().toISOString(),
  };
}

async function loadWidgetPayload(definition: PublicWidgetDefinition) {
  if (definition.widgetType === "nivel-laranjal") {
    const payload = await getLaranjalLevelData();
    return { definition, payload, kind: "nivel-laranjal" as const };
  }

  if (definition.widgetType === "status-tempo-agora") {
    const payload = await getObsWeatherStatus();
    return { definition, payload, kind: "status-tempo-agora" as const };
  }

  if (definition.widgetType === "previsao-7-dias") {
    const payload = await getAggregatedPelotasWeather();
    return { definition, payload, kind: "previsao-7-dias" as const };
  }

  if (definition.widgetType === "chuva-pelotas") {
    const payload = await getAggregatedPelotasWeather();
    return { definition, payload, kind: "chuva-pelotas" as const };
  }

  if (definition.widgetType === "vento-pelotas") {
    const payload = await getAggregatedPelotasWeather();
    return { definition, payload, kind: "vento-pelotas" as const };
  }

  return { definition: null, payload: null } as const;
}

export const Route = createFileRoute("/embed/widget")({
  validateSearch,
  loaderDeps: ({ search }) => ({ ...search }),
  head: () => ({
    meta: [
      { title: "Widget Tempo Pelotas" },
      { name: "robots", content: ROBOTS_POLICY },
      { name: "googlebot", content: ROBOTS_POLICY },
      { name: "theme-color", content: "#ffffff" },
    ],
  }),
  loader: async ({ deps }) => {
    const previewDefinition = createPreviewDefinition(deps);
    if (previewDefinition) return loadWidgetPayload(previewDefinition);
    if (!deps.token) return { definition: null, payload: null } as const;

    const definition = await getPublicWidgetDefinition({ data: { token: deps.token } }).catch(
      () => null,
    );
    if (!definition) return { definition: null, payload: null } as const;
    return loadWidgetPayload(definition);
  },
  staleTime: 60 * 1_000,
  component: GeneratedWidgetRoute,
});

function useResponsiveEmbedMetrics(
  token: string | null,
  presentation: WidgetPresentation | null,
) {
  useEffect(() => {
    if (!token || !presentation || typeof window === "undefined" || window.parent === window) {
      return;
    }

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
            presentation,
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
  }, [presentation, token]);
}

function useWidgetImpression(token: string | null, host: string) {
  const recordImpression = useServerFn(recordWidgetImpression);

  useEffect(() => {
    if (!token || token === "preview" || !host) return;

    const normalizedHost = host.trim().toLowerCase();
    if (!HOST_PATTERN.test(normalizedHost) || INTERNAL_WIDGET_HOSTS.has(normalizedHost)) return;

    void recordImpression({ data: { token, host: normalizedHost } }).catch(() => undefined);
  }, [host, recordImpression, token]);
}

function GeneratedWidgetRoute() {
  const snapshot = Route.useLoaderData();
  const search = Route.useSearch();
  const token = snapshot.definition?.publicToken ?? null;
  const presentation = snapshot.definition?.content.presentation ?? null;
  useResponsiveEmbedMetrics(token, presentation);
  useWidgetImpression(token, search.host);

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

  const widgetContent = snapshot.definition.content;
  const renderedWidget =
    snapshot.kind === "nivel-laranjal" ? (
      <ManagedLaranjalLevelEmbed data={snapshot.payload} content={widgetContent} />
    ) : snapshot.kind === "previsao-7-dias" ? (
      <SevenDayForecastWidget data={snapshot.payload} content={widgetContent} />
    ) : snapshot.kind === "chuva-pelotas" ? (
      <RainWidget data={snapshot.payload} content={widgetContent} />
    ) : snapshot.kind === "vento-pelotas" ? (
      <WindWidget data={snapshot.payload} content={widgetContent} />
    ) : (
      <ObsWeatherStatusWidget data={snapshot.payload} content={widgetContent} />
    );
  const appearance = snapshot.definition.appearance;
  const preset = getWidgetStylePreset(appearance.preset);
  const appearanceStyle = widgetAppearanceCssVariables(appearance) as CSSProperties;

  return (
    <div
      data-widget-theme={snapshot.definition.theme}
      data-widget-token={snapshot.definition.publicToken}
      data-widget-preset={appearance.preset}
      data-widget-scheme={preset.scheme}
      data-widget-density={appearance.density}
      data-widget-presentation={widgetContent.presentation}
      style={appearanceStyle}
    >
      <h1 className="visually-hidden">{snapshot.definition.title}</h1>
      {renderedWidget}
    </div>
  );
}