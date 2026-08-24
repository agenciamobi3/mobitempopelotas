import { createFileRoute } from "@tanstack/react-router";

import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Quem Somos | Tempo Pelotas";
const PAGE_DESCRIPTION =
  "Conheça o Tempo Pelotas, uma plataforma de disseminação de informações meteorológicas, ambientais e hidrológicas baseada em dados de fontes oficiais e tecnologia desenvolvida pela MOBI.";
const PAGE_PATH = "/quem-somos";

export const Route = createFileRoute("/quem-somos")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Quem Somos", path: PAGE_PATH },
        ],
        about: [
          "Tempo Pelotas",
          "Meteorologia em Pelotas",
          "Dados meteorológicos",
          "Monitoramento hidrológico",
          "MOBI Marketing Inteligente",
          "Informação climática regional",
        ],
      }),
    ]),
  loader: async () => ({ weather: await getWeatherIntelligence() }),
  staleTime: 60 * 60 * 1_000,
  component: QuemSomosPage,
});

function QuemSomosPage() {
  const { weather } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell data={weather} pageClassName="internal-weather-shell--about">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
        <section>
          <h1 className="text-3xl font-bold">Tempo Pelotas</h1>
          <p className="mt-4 text-lg">
            O Tempo Pelotas é uma plataforma criada para facilitar o acesso da
            população a informações meteorológicas, ambientais e hidrológicas
            organizadas em um único ambiente digital.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Informação a serviço da comunidade</h2>
          <p className="mt-3">
            O portal reúne previsão do tempo, condições atuais, alertas,
            monitoramento regional, dados históricos e conteúdos educativos,
            aproximando informações técnicas da população.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Tecnologia e integração de dados</h2>
          <p className="mt-3">
            O projeto é desenvolvido pela MOBI - Marketing Inteligente, utilizando
            tecnologia própria, integrações com APIs públicas e organização de
            dados meteorológicos para criar uma experiência simples e acessível.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Fontes e responsabilidade</h2>
          <p className="mt-3">
            As informações apresentadas têm caráter informativo e educativo.
            Alertas oficiais e orientações de emergência devem sempre ser
            acompanhados pelos órgãos públicos responsáveis.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Um projeto fortalecido pelos eventos climáticos</h2>
          <p className="mt-3">
            Os eventos extremos recentes, especialmente a enchente histórica de
            2024, reforçaram a importância de tornar informações meteorológicas e
            hidrológicas mais acessíveis para Pelotas e região.
          </p>
        </section>
      </main>
    </InternalWeatherPageShell>
  );
}
