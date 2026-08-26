import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { FifteenDayForecastHero } from "@/components/weather/FifteenDayForecastHero";
import { FifteenDayForecastPage } from "@/components/weather/FifteenDayForecastPage";
import { getPelotasExtendedForecast } from "@/lib/weather/extended-forecast.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Previsão do tempo em Pelotas para 15 dias";
const PAGE_DESCRIPTION =
  "Veja a previsão do tempo em Pelotas para os próximos 15 dias, com mínima, máxima, chance de chuva, volume previsto e vento.";
const PAGE_PATH = "/previsao-15-dias-pelotas";

const FIFTEEN_DAY_PAGE_CONTENT = {
  eyebrow: "Entenda a previsão estendida",
  title: "Como interpretar a previsão dos próximos 15 dias",
  answer:
    "A página amplia a janela diária para planejamento antecipado, mas não trata todos os 15 dias como igualmente certos. Os primeiros dias tendem a exigir menos ajustes; a segunda semana deve ser acompanhada como tendência e confirmada novamente conforme cada data se aproxima.",
  facts: [
    "Mínima, máxima, chance de chuva, volume e rajada são previsões do modelo para cada dia; não são observações já medidas.",
    "A consulta de 15 dias é separada do fluxo usado pela Home, Hoje, Amanhã e 7 dias, evitando aumentar o payload dessas páginas.",
    "Os primeiros 10 dias estão dentro desta mesma janela de 15 dias; o portal não cria uma página duplicada apenas para trocar o número do horizonte.",
    "Avisos oficiais do INMET continuam separados da previsão do modelo e só devem ser interpretados dentro da validade e abrangência publicadas pela fonte.",
  ],
  faqs: [
    {
      question: "A previsão de 15 dias pode mudar?",
      answer:
        "Sim. Mudanças são possíveis em toda a janela e se tornam mais prováveis nos dias mais distantes. Para decisões importantes, confirme a previsão novamente quando a data estiver mais próxima.",
    },
    {
      question: "Onde vejo a previsão de Pelotas para 10 dias?",
      answer:
        "Os primeiros 10 dias desta página formam a mesma previsão diária. O Tempo Pelotas concentra as buscas de 10 e 15 dias na mesma URL para evitar páginas repetidas.",
    },
    {
      question: "Chance alta de chuva significa grande volume?",
      answer:
        "Não necessariamente. A chance indica a possibilidade de precipitação; o volume em milímetros estima a quantidade. Os dois valores aparecem separados em cada dia.",
    },
    {
      question: "A página mostra alertas oficiais para todos os 15 dias?",
      answer:
        "Não. Alertas oficiais têm validade e abrangência próprias e não são extrapolados pelo Tempo Pelotas para datas em que nenhum aviso foi publicado.",
    },
  ],
  relatedLinks: [
    {
      label: "Previsão de 7 dias para Pelotas",
      href: "/previsao-7-dias-pelotas" as const,
      description: "Veja a janela semanal com contexto mais próximo para planejamento.",
    },
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Acompanhe condição atual e evolução por horário.",
    },
    {
      label: "Tempo amanhã em Pelotas",
      href: "/tempo-amanha-pelotas" as const,
      description: "Consulte o próximo dia com mínima, máxima, chuva e vento.",
    },
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas" as const,
      description: "Compare chance e volume previsto de chuva.",
    },
  ],
};

export const Route = createFileRoute("/previsao-15-dias-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Previsão de 15 dias para Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Previsão do tempo em Pelotas para 15 dias",
          "Previsão do tempo em Pelotas para 10 dias",
          "Temperaturas para os próximos 15 dias",
          "Chance de chuva nos próximos 15 dias",
          "Volume previsto de chuva em Pelotas",
          "Rajadas de vento para os próximos 15 dias",
          "Planejamento meteorológico estendido em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, FIFTEEN_DAY_PAGE_CONTENT.faqs),
    ]),
  loader: async () => {
    const [weather, extendedForecast] = await Promise.all([
      getWeatherIntelligence(),
      getPelotasExtendedForecast(),
    ]);
    return { weather, extendedForecast };
  },
  staleTime: 5 * 60 * 1_000,
  component: PrevisaoQuinzeDiasPage,
});

function PrevisaoQuinzeDiasPage() {
  const { weather, extendedForecast } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--fifteen-day"
      hero={({ advisoryLevel }) => (
        <FifteenDayForecastHero
          forecast={extendedForecast}
          advisoryLevel={advisoryLevel}
        />
      )}
    >
      <FifteenDayForecastPage forecast={extendedForecast} />
      <EditorialContentSection
        id="como-interpretar-a-previsao-de-15-dias"
        content={FIFTEEN_DAY_PAGE_CONTENT}
      />
    </InternalWeatherPageShell>
  );
}
