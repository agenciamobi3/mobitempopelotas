import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/metodologia")({
  beforeLoad: () => {
    throw redirect({
      to: "/status-dos-dados",
      statusCode: 301,
      replace: true,
    });
  },
});
