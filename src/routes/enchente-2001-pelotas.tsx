import { createFileRoute } from "@tanstack/react-router";

import { AnaRhnHistoricalConsistency } from "@/components/history/AnaRhnHistoricalConsistency";
import {
  Flood2001Hero,
  Flood2001HistoricalPage,
} from "@/components/history/Flood2001HistoricalPage";
import { ContentPageShell } from "@/components/layout/ContentPageShell";
import { getAnaRhnHistoricalConsistency } from "@/lib/hydrology/ana-rhn-consistency.functions";
import { HISTORICAL_COLLABORATION_CONTEXTS } from "@/lib/history/historical-collaboration";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Enchente de 2001 em Pelotas e no Laranjal: ciclone, impactos e fontes";
const PAGE_DESCRIPTION =
  "Entenda a enchente de outubro de 2001 em Pelotas e no Laranjal: vento de 105 km/h, avanço da Lagoa, isolamento da Z3, impactos e por que os arquivos históricos mostram dois valores de nível para o mesmo dia.";
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
          "Estação Laranjal 87955000",
          "Consistência da série histórica ANA",
        ],
      }),
    ]),
  loader: () => getAnaRhnHistoricalConsistency(),
  staleTime: 6 * 60 * 60 * 1_000,
  component: Enchente2001PelotasPage,
});

function Enchente2001PelotasPage() {
  const consistency = Route.useLoaderData();

  return (
    <ContentPageShell
      pageClassName="internal-weather-shell--flood-history internal-weather-shell--flood-2001"
      historicalCollaboration={HISTORICAL_COLLABORATION_CONTEXTS[PAGE_PATH]}
      showHistoricalCollaborationPrompt={false}
    >
      <Flood2001Hero />
      <Flood2001HistoricalPage />
      <AnaRhnHistoricalConsistency data={consistency} />
    </ContentPageShell>
  );
}
