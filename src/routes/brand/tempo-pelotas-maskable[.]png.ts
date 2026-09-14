import { createFileRoute } from "@tanstack/react-router";

const CANONICAL_ICON = "/brand/tempo-pelotas-icon.svg";

export const Route = createFileRoute("/brand/tempo-pelotas-maskable.png")({
  server: {
    handlers: {
      GET: () =>
        new Response(null, {
          status: 308,
          headers: {
            Location: CANONICAL_ICON,
            "Cache-Control": "public, max-age=86400",
          },
        }),
    },
  },
});
