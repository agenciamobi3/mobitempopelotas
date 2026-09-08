import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import {
  WeatherHistoryHero,
  WeatherHistoryPage,
} from "@/components/history/WeatherHistoryPage";
import "@/components/history/WeatherHistoryHomeContract.css";
import { ContentPageShell } from "@/components/layout/ContentPageShell";
import { HISTORY_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { createUnavailableWeatherHistory } from "@/lib/weather/history-fallback";
import { getPelotasWeatherHistory } from "@/lib/weather/history.functions";

const PAGE_TITLE = "Histórico meteorológico de 30 dias em Pelotas";
const PAGE_DESCRIPTION =
  "Veja o histórico meteorológico recente de Pelotas: máximas, mínimas, chuva, rajadas e variações dos últimos 30 dias completos, sem tratar o período como climatologia.";
const PAGE_PATH = "/historico-climatico-pelotas";

const HISTORY_PAGE_CONTENT = {
  ...HISTORY_EDITORIAL_CONTENT,
  eyebrow: "Como interpretar o período",
  title: "O que os últimos 30 dias mostram sobre o tempo em Pelotas",
  answer:
    "A página reúne dias completos recentes para comparar temperatura, chuva e rajadas. Os resultados valem somente para o período indicado e para o local de referência usado pela fonte. Eles não representam o clima normal nem recordes históricos oficiais do município.",
  facts: [
    "A média das máximas e a média das mínimas usam apenas os dias que possuem esses valores.",
    "A chuva no período é a soma dos acumulados diários informados.",
    "Dias com chuva consideram pelo menos 1 mm; dias sem chuva informada usam acumulado abaixo de 0,1 mm.",
    "A variação diária de temperatura é a diferença entre a máxima e a mínima do mesmo dia.",
    "Informações ausentes continuam indisponíveis e não são substituídas por zero ou números demonstrativos.",
    "Trinta dias não permitem concluir sozinhos se o período foi normal, quente, frio, seco ou chuvoso em relação ao clima de Pelotas.",
  ],
  faqs: [
    {
      question: "Qual é a diferença entre este histórico e a página Clima de Pelotas?",
      answer:
        "Este histórico compara somente os últimos 30 dias completos disponíveis. A página Clima de Pelotas explica padrões de longo prazo, estações do ano e referências climatológicas. Um período de 30 dias não substitui uma normal climatológica.",
    },
    {
      question: "De onde vêm os dados deste histórico?",
      answer:
        "A origem utilizada na série aparece na própria página. A relação completa das fontes usadas pelo portal fica em Dados e fontes.",
    },
    {
      question: "O dia mais quente é um recorde histórico de Pelotas?",
      answer:
        "Não. Ele é apenas o maior valor encontrado entre os dias consultados e nas informações usadas por esta página.",
    },
    {
      question: "Como é calculada a variação diária de temperatura?",
      answer:
        "Ela é a diferença entre a temperatura máxima e a mínima do mesmo dia. A página também mostra a média dessas diferenças no período.",
    },
    {
      question: "Por que alguns dias não têm chuva ou rajada informada?",
      answer:
        "A origem dos dados pode não publicar determinada informação em todos os dias. Quando isso ocorre, a página mantém o campo como indisponível em vez de completar com um valor estimado.",
    },
    {
      question: "Trinta dias são suficientes para definir o clima de Pelotas?",
      answer:
        "Não. O estudo do clima exige muitos anos de observações, períodos padronizados e controle de qualidade. Esta página mostra apenas o comportamento recente.",
    },
  ],
  relatedLinks: [
    {
      label: "Clima e climatologia de Pelotas",
      href: "/clima-em-pelotas" as const,
      description: "Entenda padrões de longo prazo, estações do ano e a diferença entre tempo e clima.",
    },
    {
      label: "Previsão de 7 dias",
      href: "/previsao-7-dias-pelotas" as const,
      description: "Compare o período recente com a previsão para a próxima semana sem misturar observado e previsto.",
    },
    {
      label: "Dados e fontes",
      href: "/status-dos-dados" as const,
      description: "Veja a origem dos dados, o estado atual das fontes e a última verificação.",
    },
  ],
};

export const Route = createFileRoute("/historico-climatico-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Histórico meteorológico de 30 dias", path: PAGE_PATH },
        ],
        about: [
          "Histórico meteorológico recente de Pelotas",
          "Últimos 30 dias em Pelotas",
          "Temperaturas máximas e mínimas recentes",
          "Chuva acumulada nos últimos 30 dias",
          "Rajadas de vento recentes",
          "Amplitude térmica diária",
          "Disponibilidade dos dados meteorológicos",
          "Diferença entre histórico recente e climatologia",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, HISTORY_PAGE_CONTENT.faqs),
    ]),
  loader: async () => ({
    history: await getPelotasWeatherHistory().catch(() =>
      createUnavailableWeatherHistory(),
    ),
  }),
  staleTime: 6 * 60 * 60 * 1_000,
  component: HistoricoClimaticoPage,
});

function HistoricoClimaticoPage() {
  const { history } = Route.useLoaderData();

  return (
    <ContentPageShell pageClassName="content-shell--history">
      <WeatherHistoryHero history={history} />
      <WeatherHistoryPage history={history} />
      <EditorialContentSection
        id="como-interpretar-historico-recente"
        content={HISTORY_PAGE_CONTENT}
      />
    </ContentPageShell>
  );
}
