import { createFileRoute } from "@tanstack/react-router";

import {
  Flood2024Hero,
  Flood2024HistoricalPage,
} from "@/components/history/Flood2024HistoricalPage";
import "@/components/history/Flood2024HomeContract.css";
import { FloodVisitorGuide } from "@/components/history/FloodVisitorGuide";
import { ContentPageShell } from "@/components/layout/ContentPageShell";
import { HISTORICAL_COLLABORATION_CONTEXTS } from "@/lib/history/historical-collaboration";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Enchente de 2024 em Pelotas e no Laranjal: linha do tempo histórica";
const PAGE_DESCRIPTION =
  "Entenda por que a enchente de 2024 chegou depois a Pelotas, como a água percorreu o Guaíba e a Lagoa dos Patos, quais áreas foram atingidas e o que significam os níveis registrados durante a emergência.";
const PAGE_PATH = "/enchente-2024-pelotas-laranjal";

export const Route = createFileRoute("/enchente-2024-pelotas-laranjal")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Enchente de 2024 em Pelotas e no Laranjal", path: PAGE_PATH },
        ],
        about: [
          "Enchente de 2024 em Pelotas",
          "Enchente de 2024 no Laranjal",
          "Lagoa dos Patos",
          "Canal São Gonçalo",
          "Guaíba",
          "Cheia histórica de maio de 2024",
          "Linha do tempo da enchente de Pelotas",
        ],
      }),
    ]),
  component: Enchente2024PelotasPage,
});

function Enchente2024PelotasPage() {
  return (
    <ContentPageShell
      pageClassName="internal-weather-shell--flood-history"
      historicalCollaboration={HISTORICAL_COLLABORATION_CONTEXTS[PAGE_PATH]}
    >
      <Flood2024Hero />
      <FloodVisitorGuide year="2024" />
      <Flood2024HistoricalPage />
    </ContentPageShell>
  );
}
