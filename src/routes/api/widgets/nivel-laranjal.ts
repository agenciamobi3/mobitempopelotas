import { createFileRoute } from "@tanstack/react-router";

import { deriveRecentHydrologySeriesMovement } from "@/lib/hydrology/level-movement";
import { fetchSelectedLaranjalLevelData } from "@/lib/hydrology/laranjal-level-source.server";

const HEADERS = {
  "Access-Control-Allow-Headers": "Accept, Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=240",
  "CDN-Cache-Control": "max-age=60, stale-while-revalidate=240",
  "Content-Language": "pt-BR",
  "Content-Type": "application/json; charset=utf-8",
  "Cross-Origin-Resource-Policy": "cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function round(value: number | null, digits = 1) {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export const Route = createFileRoute("/api/widgets/nivel-laranjal")({
  server: {
    handlers: {
      GET: async () => {
        const data = await fetchSelectedLaranjalLevelData({ deadlineMs: 1_800 });
        const movement = deriveRecentHydrologySeriesMovement(data.series, "m");

        return new Response(
          JSON.stringify({
            widget: "nivel-laranjal",
            version: 1,
            status: data.status,
            currentLevel: data.currentLevel,
            updatedAt: data.updatedAt,
            movement: {
              kind: "derived-from-series",
              direction: movement.direction,
              label: movement.label,
              rateCmPerHour: round(movement.rateCmPerHour),
              changeCm: round(movement.changeCm),
              durationMinutes:
                movement.durationMs === null ? null : Math.round(movement.durationMs / 60_000),
              startAt:
                movement.startEpoch === null ? null : new Date(movement.startEpoch).toISOString(),
            },
            // Compatibilidade com integrações antigas. Não usar este campo como relógio visual novo.
            trendCmPerHour: data.trendCmPerHour,
            trendCmPerHourSemantics: "legacy-derived-field",
            change1hCm: data.change1hCm,
            change6hCm: data.change6hCm,
            change24hCm: data.change24hCm,
            series: data.series,
            source: data.source,
            detailsUrl: "https://tempopelotas.com.br/nivel-da-lagoa-dos-patos-laranjal",
          }),
          { headers: HEADERS },
        );
      },
      OPTIONS: () => new Response(null, { status: 204, headers: HEADERS }),
    },
  },
});
