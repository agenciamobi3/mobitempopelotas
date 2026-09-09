import { createFileRoute } from "@tanstack/react-router";

import { EmbrapaStationPage } from "@/components/weather/EmbrapaStationPage";
import { createPageHead } from "@/lib/page-meta";
import { getEmbrapaObservation } from "@/lib/weather/embrapa-observation.functions";

const PAGE_TITLE = "Estação meteorológica da Embrapa em Pelotas";
const PAGE_DESCRIPTION =
  "Consulte temperatura, umidade, vento, pressão, chuva e extremos medidos no Posto Meteorológico da Sede da Embrapa Clima Temperado em Pelotas.";
const PAGE_PATH = "/estacao-embrapa-pelotas";

export const Route = createFileRoute("/estacao-embrapa-pelotas")({
  head: () => createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [], { indexable: false }),
  loader: () => getEmbrapaObservation(),
  staleTime: 5 * 60 * 1_000,
  component: EstacaoEmbrapaPelotasPage,
});

function EstacaoEmbrapaPelotasPage() {
  const observation = Route.useLoaderData();
  return <EmbrapaStationPage data={observation} />;
}
