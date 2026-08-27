import { createFileRoute } from "@tanstack/react-router";

import { RegionalCitiesDirectory } from "@/components/regional/RegionalCitiesDirectory";
import "@/components/regional/RegionalCitiesAccentContract.css";
import { createPageHead } from "@/lib/page-meta";
import { PUBLIC_REGIONAL_CITIES } from "@/lib/regional-cities";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getRegionalCitiesOverview } from "@/lib/weather/regional-cities-overview.functions";
import type { RegionalCitiesOverview } from "@/lib/weather/regional-cities-overview.types";

const PAGE_TITLE = "Tempo na Região Sul do RS: previsão por cidade";
const PAGE_DESCRIPTION =
  "Central meteorológica da Zona Sul do RS com mapa regional, condição estimada agora, faixa de temperatura, chuva, vento e acesso às páginas locais de 24 cidades.";
const PAGE_PATH = "/tempo-na-regiao-sul-rs";
const SOUTHERN_RS_LOCATION = {
  "@type": "Place",
  name: "Zona Sul do Rio Grande do Sul, Brasil",
  containedInPlace: {
    "@type": "AdministrativeArea",
    name: "Rio Grande do Sul, Brasil",
  },
};

function createRegionalFallback(): RegionalCitiesOverview {
  return {
    status: "unavailable",
    fetchedAt: new Date().toISOString(),
    items: PUBLIC_REGIONAL_CITIES.map((city) => ({
      city,
      status: "unavailable",
      temperature: null,
      condition: "Condição em atualização",
      minimum: null,
      maximum: null,
      rainChance: null,
      windSpeed: null,
      validAt: null,
    })),
    source: { name: "Open-Meteo" },
    message:
      "A visão regional resumida está temporariamente indisponível. As páginas municipais continuam acessíveis.",
  };
}

export const Route = createFileRoute("/tempo-na-regiao-sul-rs")({
  loader: async () => {
    try {
      return await getRegionalCitiesOverview();
    } catch {
      return createRegionalFallback();
    }
  },
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
            { name: "Tempo na Região Sul do RS", path: PAGE_PATH },
          ],
          about: [
            "Previsão do tempo na Zona Sul do Rio Grande do Sul",
            "Previsão do tempo por cidade no sul do RS",
            "Mapa meteorológico regional",
            "Temperatura, chuva e vento por município",
            "Pelotas e municípios da Região Sul do Rio Grande do Sul",
            "Meteorologia regional",
          ],
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
