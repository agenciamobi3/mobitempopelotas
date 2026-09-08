import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/estacao-embrapa-pelotas")({
  beforeLoad: () => {
    throw redirect({
      to: "/status-dos-dados",
      statusCode: 301,
      replace: true,
    });
  },
});
