import { createFileRoute } from "@tanstack/react-router";

import { RegionalCitiesDirectory } from "@/components/regional/RegionalCitiesDirectory";
import "@/components/regional/RegionalCitiesAccentContract.css";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getRegionalCitiesOverview } from "@/lib/weather/regional-cities-overview.functions";

const PAGE_TITLE = "Tempo na Região Sul do RS: previsão por cidade";
const PAGE_DESCRIPTION =
  "Central meteorológica da Zona Sul do RS com condição estimada agora, faixa de temperatura, chuva, vento e acesso às páginas locais de 24 cidades.";
const PAGE_PATH = "/tempo-na-regiao-sul-rs";
const SOUTHERN_RS_LOCATION = {
  "@type": "Place",
  name: "Zona Sul do Rio Grande do Sul, Brasil",
  containedInPlace: {
    "@type": "AdministrativeArea",
    name: "Rio Grande do Sul, Brasil",
  },
};

export const Route = createFileRoute("/tempo-na-regiao-sul-rs")({
  loader: async () => getRegionalCitiesOverview(),
  head: () =>
    createPageHead(
      PAGE_TITLE,
      PAGE_DESCRIPTION,
      PAGE_PATH,
      [
        createEditorialPageJsonLd({
          name: PAGE_TITLE,
          description: PAGE_DESCRIPTION,
          path: PAGE_PATH,
          breadcrumbs: [
            { name: "Início", path: "/" },
            { name: "Tempo na região", path: PAGE_PATH },
          ],
          about: ["Previsão do tempo na Zona Sul do Rio Grande do Sul", "Meteorologia regional"],
          location: SOUTHERN_RS_LOCATION,
        }),
      ],
      { geo: null },
    ),
  staleTime: 5 * 60 * 1_000,
  component: RegionalCitiesRoute,
});

function RegionalCitiesRoute() {
  return <RegionalCitiesDirectory data={Route.useLoaderData()} />;
}
