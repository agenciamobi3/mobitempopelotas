import { createFileRoute } from "@tanstack/react-router";

import { recordWidgetLoadFromOrigin } from "@/lib/widgets/widget-analytics.functions";

const MAX_TOKEN_BODY_LENGTH = 64;

function telemetryHeaders() {
  return new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
  });
}

async function recordLoad(request: Request) {
  const headers = telemetryHeaders();
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("text/plain")) {
    return new Response(null, { status: 415, headers });
  }

  const token = (await request.text()).trim();
  if (!token || token.length > MAX_TOKEN_BODY_LENGTH) {
    return new Response(null, { status: 400, headers });
  }

  const result = await recordWidgetLoadFromOrigin(token, request.headers.get("origin"));
  if (result.ok || result.code === "ignored") {
    return new Response(null, { status: 204, headers });
  }

  if (result.code === "invalid_token" || result.code === "invalid_origin") {
    return new Response(null, { status: 400, headers });
  }

  // Telemetria é auxiliar. Falha de storage não deve induzir retry agressivo no site hospedeiro.
  return new Response(null, { status: 202, headers });
}

export const Route = createFileRoute("/api/widgets/load")({
  server: {
    handlers: {
      POST: ({ request }) => recordLoad(request),
      OPTIONS: () => new Response(null, { status: 204, headers: telemetryHeaders() }),
    },
  },
});
