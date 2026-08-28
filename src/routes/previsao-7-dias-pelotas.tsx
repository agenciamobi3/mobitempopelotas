import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { ForecastHorizonBridge } from "@/components/weather/ForecastHorizonBridge";
import { SevenDayForecastPageV2 } from "@/components/weather/SevenDayForecastPageV2";
import { SevenDayRetailHero } from "@/components/weather/SevenDayRetailHero";
import { SEVEN_DAY_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { createUnavailableWeatherIntelligence } from "@/lib/weather/weather-intelligence-fallback";

const PAGE_TITLE = "Previsão do tempo em Pelotas: 7 dias e semana";
const PAGE_DESCRIPTION =
  "Veja a previsão do tempo para 7 dias e a semana em Pelotas, com mínimas, máximas, chance e volume de chuva, rajadas e comparação entre os dias.";
const PAGE_PATH = "/previsao-7-dias-pelotas";

const SEVEN_DAY_PAGE_CONTENT = {
  ...SEVEN_DAY_EDITORIAL_CONTENT,
  eyebrow: "Entenda a previsão semanal",
  title: "Como interpretar a previsão dos próximos 7 dias",
  answer:
    "Use a previsão de 7 dias para comparar tendências de temperatura, chuva e vento ao longo da semana. Os primeiros dias costumam orientar melhor decisões práticas; os dias mais distantes devem ser confirmados novamente conforme se aproximarem.",
  facts: [
    "Mínima e máxima mostram a faixa prevista para cada dia, não a temperatura durante todo o período.",
    "Chance de chuva indica probabilidade; volume em milímetros estima quanto pode acumular no dia.",
    "Rajada máxima e vento médio não são a mesma medida e podem ter impactos diferentes.",
    "Para escolher horários e tomar decisões sensíveis ao tempo, confirme a previsão nas páginas de hoje ou amanhã.",
    "Para datas depois da primeira semana, use a página de 15 dias como tendência estendida e confirme novamente quando a data se aproximar.",
  ],
  faqs: [
    {
      question: "Como fica o tempo em Pelotas nesta semana?",
      answer:
        "A página compara os próximos sete dias com mínima, máxima, chuva e rajadas. Como o conteúdo é atualizado, use os cartões diários para identificar a tendência da semana em vez de depender de uma resposta fixa escrita no texto.",
    },
    {
      question: "A previsão de 7 dias pode mudar?",
      answer:
        "Sim. A possibilidade de ajuste aumenta nos dias mais distantes. Conforme cada data se aproxima, novas observações permitem atualizar temperatura, chuva e vento previstos.",
    },
    {
      question: "Qual dia da semana tem a previsão mais confiável?",
      answer:
        "Em geral, os primeiros dias da janela têm menor incerteza. Para compromissos importantes, confirme novamente na previsão de amanhã e, no próprio dia, na previsão por hora.",
    },
    {
      question: "Como comparar chuva entre os dias?",
      answer:
        "Observe juntos a chance percentual, o volume estimado em milímetros e os avisos oficiais. Um percentual alto não significa necessariamente o maior volume da semana.",
    },
    {
      question: "Onde vejo a previsão depois dos próximos 7 dias?",
      answer:
        "A página de 15 dias amplia a janela até a segunda semana. Ela deve ser usada como planejamento estendido, com incerteza maior nos dias mais distantes.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Veja a condição atual e a evolução de temperatura, chuva e vento por horário.",
    },
    {
      label: "Tempo amanhã em Pelotas",
      href: "/tempo-amanha-pelotas" as const,
      description: "Consulte mínima, máxima, chuva, rajadas e orientações para o próximo dia.",
    },
    {
      label: "Previsão de 15 dias",
      href: "/previsao-15-dias-pelotas" as const,
      description: "Continue para a segunda semana sem criar uma página redundante de 10 dias.",
    },
    {
      label: "Chuva por horário em Pelotas",
      href: "/chuva-em-pelotas" as const,
      description: "Compare chance, volume e os períodos com maior sinal de chuva.",
    },
    {
      label: "Vento e rajadas em Pelotas",
      href: "/vento-em-pelotas" as const,
      description: "Veja direção, vento por hora e rajadas previstas.",
    },
  ],
};

export const Route = createFileRoute("/previsao-7-dias-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Previsão de 7 dias para Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Previsão do tempo em Pelotas para 7 dias",
          "Previsão do tempo para a semana em Pelotas",
          "Tendência meteorológica semanal em Pelotas",
          "Previsão de chuva para 7 dias",
          "Temperaturas para os próximos 7 dias",
          "Rajadas de vento para os próximos dias",
          "Planejamento meteorológico semanal em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, SEVEN_DAY_PAGE_CONTENT.faqs),
    ]),
  // A rota entrega HTML imediatamente. A série semanal real entra depois pela
  // recuperação client-side, sem manter o visitante esperando uma server function.
  loader: () => createUnavailableWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: PrevisaoSeteDiasPage,
});

function PrevisaoSeteDiasPage() {
  const weather = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--seven-day"
      hero={({ weather: productionWeather, advisoryLevel, officialAlertCount }) => (
        <SevenDayRetailHero
          weather={productionWeather}
          advisoryLevel={advisoryLevel}
          officialAlertCount={officialAlertCount}
        />
      )}
    >
      <SevenDayForecastPageV2 data={weather} />
      <ForecastHorizonBridge />
      <EditorialContentSection
        id="como-interpretar-a-previsao-semanal"
        content={SEVEN_DAY_PAGE_CONTENT}
      />
    </InternalWeatherPageShell>
  );
}
