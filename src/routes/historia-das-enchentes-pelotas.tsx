import { createFileRoute } from "@tanstack/react-router";

import { FloodHistoryIndexPage } from "@/components/history/FloodHistoryIndexPage";
import { ContentPageShell } from "@/components/layout/ContentPageShell";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "História das enchentes em Pelotas: 1941, 2001, 2015 e 2024";
const PAGE_DESCRIPTION =
  "Arquivo histórico das principais enchentes de Pelotas, Laranjal e Z3, com cronologias, medições, fontes documentais, limites de comparação e páginas dedicadas para 1941, 2001, 2015 e 2024.";
const PAGE_PATH = "/historia-das-enchentes-pelotas";

export const Route = createFileRoute("/historia-das-enchentes-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "História das enchentes em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Enchentes em Pelotas",
          "Praia do Laranjal",
          "Valverde",
          "Colônia de Pescadores Z3",
          "Lagoa dos Patos",
          "Canal São Gonçalo",
          "Enchente de 1941",
          "Enchente de 2001",
          "Enchente de 2015",
          "Enchente de 2024",
          "História climática de Pelotas",
        ],
      }),
    ]),
  component: FloodHistoryIndexRoute,
});

function FloodHistoryIndexRoute() {
  return (
    <ContentPageShell pageClassName="internal-weather-shell--flood-history">
      <FloodHistoryIndexPage />
    </ContentPageShell>
  );
}
