import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { TomorrowForecastPageV3 } from "@/components/weather/TomorrowForecastPageV3";
import { TomorrowRetailHero } from "@/components/weather/TomorrowRetailHero";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { createUnavailableWeatherIntelligence } from "@/lib/weather/weather-intelligence-fallback";

const PAGE_TITLE = "Tempo amanhã em Pelotas: temperatura, chuva e vento";
const PAGE_DESCRIPTION =
  "Veja o tempo amanhã em Pelotas com mínima, máxima, chance e volume de chuva, vento, rajadas, comparação com hoje e previsões do INMET e CPPMet/UFPel.";
const PAGE_PATH = "/tempo-amanha-pelotas";

const TOMORROW_PAGE_CONTENT = {
  eyebrow: "Planeje o próximo dia",
  title: "Como interpretar a previsão do tempo para amanhã em Pelotas",
  answer:
    "A página reúne a faixa de temperatura, chance e volume de chuva, vento e rajadas previstos para amanhã. Esses valores são previsões e podem ser ajustados conforme novas observações e rodadas dos modelos entram durante o dia de hoje.",
  facts: [
    "Mínima e máxima indicam a faixa prevista para amanhã e não a temperatura durante todas as horas do dia.",
    "Chance de chuva indica probabilidade; volume em milímetros estima quanto pode chover no período.",
    "Vento médio e rajadas são medidas diferentes e devem ser analisados separadamente.",
    "Avisos oficiais possuem validade e abrangência próprias e não são inferidos apenas a partir da previsão do modelo.",
    "Para decisões sensíveis ao horário, atualize a previsão novamente mais perto do compromisso e consulte a página de hoje quando amanhã se tornar o dia atual.",
  ],
  faqs: [
    {
      question: "Vai chover amanhã em Pelotas?",
      answer:
        "A página mostra a chance e o volume de chuva previstos para amanhã. Como a previsão pode mudar, consulte os valores mais recentes e, se houver instabilidade, acompanhe também radar e avisos oficiais.",
    },
    {
      question: "Qual será a temperatura amanhã em Pelotas?",
      answer:
        "A previsão apresenta mínima e máxima para o dia, além da evolução disponível nos blocos de previsão. Esses valores formam uma faixa prevista e podem ser atualizados conforme a data se aproxima.",
    },
    {
      question: "A previsão de amanhã pode mudar ainda hoje?",
      answer:
        "Sim. Modelos meteorológicos são recalculados com novas observações. Chuva, temperatura, vento e rajadas podem sofrer ajustes até o próximo dia.",
    },
    {
      question: "Onde vejo a previsão para depois de amanhã e os próximos dias?",
      answer:
        "Use a previsão de 7 dias para comparar os próximos dias e a página de 15 dias para uma tendência mais estendida, lembrando que a incerteza aumenta com o horizonte.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Veja a condição atual e a previsão por horário antes de planejar amanhã.",
    },
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas" as const,
      description: "Compare chance, volume e períodos com maior sinal de precipitação.",
    },
    {
      label: "Previsão de 7 dias",
      href: "/previsao-7-dias-pelotas" as const,
      description: "Compare amanhã com os demais dias da semana.",
    },
    {
      label: "Previsão de 15 dias",
      href: "/previsao-15-dias-pelotas" as const,
      description: "Amplie o planejamento para a segunda semana com incerteza explicitada.",
    },
    {
      label: "Avisos oficiais do INMET",
      href: "/alertas" as const,
      description: "Consulte validade, abrangência e orientações dos avisos vigentes.",
    },
  ],
};

export const Route = createFileRoute("/tempo-amanha-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Tempo amanhã em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Tempo amanhã em Pelotas",
          "Previsão do tempo para amanhã em Pelotas",
          "Chuva amanhã em Pelotas",
          "Temperatura amanhã em Pelotas",
          "Vento amanhã em Pelotas",
          "Rajadas amanhã em Pelotas",
          "Planejamento meteorológico em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, TOMORROW_PAGE_CONTENT.faqs),
    ]),
  // O primeiro HTML é independente das integrações; a previsão é recuperada no
  // navegador depois que a rota já está disponível para o visitante.
  loader: () => createUnavailableWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: TempoAmanhaPage,
});

function TempoAmanhaPage() {
  const weather = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--tomorrow"
      hero={({ weather: productionWeather, advisoryLevel, officialAlertCount }) => (
        <TomorrowRetailHero
          weather={productionWeather}
          advisoryLevel={advisoryLevel}
          officialAlertCount={officialAlertCount}
        />
      )}
    >
      <TomorrowForecastPageV3 data={weather} />
      <EditorialContentSection id="como-interpretar-amanha" content={TOMORROW_PAGE_CONTENT} />
    </InternalWeatherPageShell>
  );
}
