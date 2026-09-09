import { createFileRoute } from "@tanstack/react-router";

import { LagoonHydrologyNetworkIndex } from "@/components/hydrology/LagoonHydrologyLocalityPage";
import "@/components/hydrology/LagoonHydrologyNetworkIndex.css";
import { loadLagoonLocalityNetwork } from "@/lib/hydrology/lagoon-locality-page-loader";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Nível da Lagoa dos Patos hoje: estações e Costa Doce";
const PAGE_DESCRIPTION =
  "Acompanhe o nível da Lagoa dos Patos em cinco pontos de monitoramento e navegue pelas cidades da Costa Doce do RS com medição de nível ou previsão meteorológica disponível no Tempo Pelotas.";
const PAGE_PATH = "/nivel-da-lagoa-dos-patos";

export const Route = createFileRoute("/nivel-da-lagoa-dos-patos")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Situação das águas", path: "/situacao-hidrologica-pelotas" },
          { name: "Nível da Lagoa dos Patos", path: PAGE_PATH },
        ],
        about: [
          "Nível da Lagoa dos Patos hoje",
          "Costa Doce do Rio Grande do Sul",
          "Rio Grande",
          "São Lourenço do Sul",
          "Arambaré",
          "São José do Norte",
          "Pelotas",
          "Itapuã",
          "Monitoramento hidrológico regional",
          "FURG",
          "Portos RS",
        ],
      }),
    ]),
  loader: () => loadLagoonLocalityNetwork(),
  staleTime: 60 * 1_000,
  component: LagoonNetworkIndexRoute,
});

function LagoonNetworkIndexRoute() {
  return (
    <div className="lagoon-network-index-shell">
      <LagoonHydrologyNetworkIndex network={Route.useLoaderData()} />
    </div>
  );
}
