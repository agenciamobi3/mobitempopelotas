import { createFileRoute } from "@tanstack/react-router";

import {
  Flood2001Hero,
  Flood2001HistoricalPage,
} from "@/components/history/Flood2001HistoricalPage";
import { ContentPageShell } from "@/components/layout/ContentPageShell";
import { HISTORICAL_COLLABORATION_CONTEXTS } from "@/lib/history/historical-collaboration";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Enchente de 2001 em Pelotas e no Laranjal: ciclone, impactos e fontes";
const PAGE_DESCRIPTION =
  "Registro histórico em pesquisa da enchente de outubro de 2001 em Pelotas e no Laranjal, com ciclone extratropical, vento de 105 km/h, isolamento da Z3, avanço das águas e fontes da época.";
const PAGE_PATH = "/enchente-2001-pelotas";

export const Route = createFileRoute("/enchente-2001-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Enchente de 2001 em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Enchente de 2001 em Pelotas",
          "Ciclone extratropical de outubro de 2001",
          "Praia do Laranjal",
          "Colônia de Pescadores Z3",
          "Valverde",
          "Canal São Gonçalo",
          "Lagoa dos Patos",
          "História das inundações em Pelotas",
        ],
      }),
    ]),
  component: Enchente2001PelotasPage,
});

function Enchente2001PelotasPage() {
  return (
    <ContentPageShell
      pageClassName="internal-weather-shell--flood-history"
      historicalCollaboration={HISTORICAL_COLLABORATION_CONTEXTS[PAGE_PATH]}
    >
      <Flood2001Hero />
      <Flood2001HistoricalPage />
    </ContentPageShell>
  );
}
