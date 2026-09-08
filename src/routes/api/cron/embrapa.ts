import { createFileRoute } from "@tanstack/react-router";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function retiredResponse() {
  return new Response(
    JSON.stringify({
      success: false,
      status: "retired",
      message:
        "O coletor da Embrapa foi aposentado. O Tempo Pelotas usa a Rede de Monitoramento Hidrometeorológico da Defesa Civil RS para observação atual.",
    }),
    { status: 410, headers: RESPONSE_HEADERS },
  );
}

export const Route = createFileRoute("/api/cron/embrapa")({
  server: {
    handlers: {
      GET: () => retiredResponse(),
      POST: () => retiredResponse(),
    },
  },
});
