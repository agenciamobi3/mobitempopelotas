import { createFileRoute, notFound } from "@tanstack/react-router";

import { LagoonHydrologyLocalityPage } from "@/components/hydrology/LagoonHydrologyLocalityPage";
import {
  findHydrologyLocality,
  hydrologyLocalityPath,
} from "@/lib/hydrology/hydrology-localities";
import {
  loadLagoonLocalityNetwork,
  selectLagoonObservation,
} from "@/lib/hydrology/lagoon-locality-page-loader";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

export const Route = createFileRoute("/nivel-da-lagoa-dos-patos/$localitySlug")({
  beforeLoad: ({ params }) => {
    if (!findHydrologyLocality(params.localitySlug)) throw notFound();
  },
  loader: async ({ params }) => {
    const locality = findHydrologyLocality(params.localitySlug);
    if (!locality) throw notFound();

    const network = await loadLagoonLocalityNetwork();
    return {
      locality,
      network,
      observation: selectLagoonObservation(network, locality.stationId),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { locality } = loaderData;
    const path = hydrologyLocalityPath(locality);
    return createPageHead(locality.title, locality.description, path, [
      createEditorialPageJsonLd({
        name: locality.title,
        description: locality.description,
        path,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Nível da Lagoa dos Patos", path: "/nivel-da-lagoa-dos-patos" },
          { name: locality.name, path },
        ],
        about: [
          `Nível da Lagoa dos Patos em ${locality.name}`,
          locality.stationName,
          locality.cityLabel,
          "Leitura hidrológica local",
          "Movimento recente do nível da água",
          "Rede de Monitoramento do Nível da Lagoa dos Patos",
        ],
      }),
    ]);
  },
  staleTime: 60 * 1_000,
  component: LagoonLocalityRoute,
});

function LagoonLocalityRoute() {
  const data = Route.useLoaderData();
  return (
    <LagoonHydrologyLocalityPage
      locality={data.locality}
      network={data.network}
      observation={data.observation}
    />
  );
}
