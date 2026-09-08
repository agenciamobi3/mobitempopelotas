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
      status: "retired",
      message:
        "Este endpoint foi aposentado. A observação atual do Tempo Pelotas usa a Rede de Monitoramento Hidrometeorológico da Defesa Civil RS.",
      replacement: "/pelotas.json",
      data_sources: "/status-dos-dados",
    }),
    { status: 410, headers: RESPONSE_HEADERS },
  );
}

export const Route = createFileRoute("/api/weather/embrapa")({
  server: {
    handlers: {
      GET: () => retiredResponse(),
    },
  },
});
