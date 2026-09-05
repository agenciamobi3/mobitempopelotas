import { createFileRoute } from "@tanstack/react-router";

import {
  Flood2015Hero,
  Flood2015HistoricalPage,
} from "@/components/history/Flood2015HistoricalPage";
import "@/components/history/Flood2015HistoricalPage.css";
import { ContentPageShell } from "@/components/layout/ContentPageShell";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Enchente de 2015 em Pelotas: linha do tempo, níveis e impactos";
const PAGE_DESCRIPTION =
  "Reconstrução documentada da enchente de outubro de 2015 em Pelotas, com boletins da Prefeitura, níveis da Lagoa dos Patos e do Canal São Gonçalo, impactos no Laranjal e Z3 e resposta da Defesa Civil.";
const PAGE_PATH = "/enchente-2015-pelotas";

export const Route = createFileRoute("/enchente-2015-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Enchente de 2015 em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Enchente de 2015 em Pelotas",
          "Cheias 2015",
          "Canal São Gonçalo",
          "Lagoa dos Patos",
          "Praia do Laranjal",
          "Colônia de Pescadores Z3",
          "Defesa Civil de Pelotas",
          "Estação da Embrapa em Pelotas",
          "Situação de Emergência de Pelotas em 2015",
          "História das inundações em Pelotas",
        ],
      }),
    ]),
  component: Enchente2015PelotasPage,
});

function Enchente2015PelotasPage() {
  return (
    <ContentPageShell pageClassName="internal-weather-shell--flood-history">
      <Flood2015Hero />
      <Flood2015HistoricalPage />
    </ContentPageShell>
  );
}
