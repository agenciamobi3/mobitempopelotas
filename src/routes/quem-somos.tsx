import { createFileRoute } from "@tanstack/react-router";

import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Quem Somos | Tempo Pelotas";
const PAGE_DESCRIPTION =
  "Conheça o Tempo Pelotas, uma plataforma de disseminação de informações meteorológicas, ambientais e hidrológicas baseada em fontes oficiais e tecnologia desenvolvida pela MOBI.";
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
          "Monitoramento hidrológico",
          "Informação climática regional",
          "MOBI Marketing Inteligente",
          "Fontes meteorológicas oficiais",
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
            O Tempo Pelotas é uma plataforma digital criada para aproximar a
            comunidade de informações meteorológicas, ambientais e hidrológicas
            organizadas em um único ambiente.
          </p>
          <p className="mt-3">
            O projeto tem como objetivo facilitar o acompanhamento do tempo,
            eventos climáticos e informações relevantes para Pelotas e região.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Informação baseada em dados</h2>
          <p className="mt-3">
            O portal reúne previsão meteorológica, condições atuais, alertas,
            monitoramento regional, informações hidrológicas, dados históricos
            e conteúdos educativos.
          </p>
          <p className="mt-3">
            A proposta é transformar dados técnicos em informações mais claras e
            acessíveis para moradores, visitantes e empresas da região.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Tecnologia desenvolvida pela MOBI</h2>
          <p className="mt-3">
            O Tempo Pelotas é um projeto desenvolvido pela MOBI - Marketing
            Inteligente, utilizando tecnologia própria, integração com APIs,
            processamento de dados e interfaces digitais para organizar
            informações de diferentes fontes.
          </p>
          <p className="mt-3">
            A tecnologia permite criar painéis, páginas regionais, visualizações
            e experiências digitais voltadas à disseminação de informações.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Fontes oficiais e responsabilidade</h2>
          <p className="mt-3">
            O portal busca integrar informações disponibilizadas por instituições
            e sistemas públicos de monitoramento meteorológico e ambiental.
          </p>
          <p className="mt-3">
            As informações possuem caráter informativo e educativo. Alertas
            oficiais, situações de emergência e orientações de segurança devem
            sempre ser acompanhados pelos órgãos responsáveis.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Um projeto marcado pela realidade climática da região</h2>
          <p className="mt-3">
            Os eventos extremos recentes, especialmente a enchente histórica de
            2024 em Pelotas e no Laranjal, reforçaram a importância de facilitar
            o acesso a informações meteorológicas e hidrológicas organizadas.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">O que você encontra no Tempo Pelotas</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Painel meteorológico e condições atuais.</li>
            <li>Previsões e acompanhamento regional.</li>
            <li>Informações hidrológicas e ambientais.</li>
            <li>Páginas municipais e conteúdos educativos.</li>
            <li>Integração de dados para facilitar a compreensão do clima local.</li>
          </ul>
        </section>
      </main>
    </InternalWeatherPageShell>
  );
}
