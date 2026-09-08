import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/estacao-embrapa-pelotas")({
  beforeLoad: () => {
    throw redirect({
      to: "/metodologia",
      statusCode: 301,
      replace: true,
    });
  },
});
