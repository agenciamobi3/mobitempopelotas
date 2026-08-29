import { createFileRoute } from "@tanstack/react-router";

const RUNTIME_RELEASE = "2026-08-29-ana-rhn-readiness-v1";

export const Route = createFileRoute("/api/runtime-version")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          JSON.stringify({
            service: "tempo-pelotas",
            release: RUNTIME_RELEASE,
          }),
          {
            status: 200,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate",
              "Content-Type": "application/json; charset=utf-8",
              "X-Content-Type-Options": "nosniff",
              "X-Robots-Tag": "noindex, nofollow",
            },
          },
        ),
    },
  },
});
