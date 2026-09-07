import { createFileRoute } from "@tanstack/react-router";

import {
  Flood1941Hero,
  Flood1941HistoricalPage,
} from "@/components/history/Flood1941HistoricalPage";
import { ContentPageShell } from "@/components/layout/ContentPageShell";
import { HISTORICAL_COLLABORATION_CONTEXTS } from "@/lib/history/historical-collaboration";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Enchente de 1941 em Pelotas: fotos, nível e história";
const PAGE_DESCRIPTION =
  "Entenda o que aconteceu na enchente de 1941 em Pelotas, onde a água chegou, o que significa a marca de 2,88 m no Canal São Gonçalo e como as fotos ajudaram a reconstruir essa história.";
const PAGE_PATH = "/enchente-1941-pelotas";

export const Route = createFileRoute("/enchente-1941-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Enchente de 1941 em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Enchente de 1941 em Pelotas",
          "Canal São Gonçalo em 1941",
          "Praça do Porto de Pelotas",
          "Alfândega de Pelotas",
          "Nível histórico de 2,88 metros",
          "Acervo Nelson Nobre Magalhães",
          "Universidade Católica de Pelotas",
          "Universidade Federal de Pelotas",
          "História das inundações em Pelotas",
        ],
      }),
    ]),
  component: Enchente1941PelotasPage,
});

function Enchente1941PelotasPage() {
  return (
    <ContentPageShell
      pageClassName="internal-weather-shell--flood-history internal-weather-shell--flood-1941"
      historicalCollaboration={HISTORICAL_COLLABORATION_CONTEXTS[PAGE_PATH]}
      showHistoricalCollaborationPrompt={false}
    >
      <Flood1941Hero />
      <Flood1941HistoricalPage />
    </ContentPageShell>
  );
}
