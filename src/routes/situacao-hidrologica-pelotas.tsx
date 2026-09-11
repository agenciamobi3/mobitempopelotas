import { createFileRoute } from "@tanstack/react-router";

import { RegisteredHydrologyOverviewEnrichment } from "@/components/auth/RegisteredHydrologyOverviewEnrichment";
import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { AnaRhnRegionalStations } from "@/components/hydrology/AnaRhnRegionalStations";
import { DefesaCivilHydroNetwork } from "@/components/hydrology/DefesaCivilHydroNetwork";
import { HydrologyCurrentSituationAnswer } from "@/components/hydrology/HydrologyCurrentSituationAnswer";
import {
  HydrologyOverviewHero,
  HydrologyOverviewV2,
} from "@/components/hydrology/HydrologyOverviewV2";
import "@/components/hydrology/HydrologyOverviewHomeContract.css";
import { HydrologySectionBoundary } from "@/components/hydrology/HydrologySectionBoundary";
import {
  SaceGuaibaContext,
  SaceGuaibaRenderScope,
} from "@/components/hydrology/SaceGuaibaContext";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { loadHydrologyOverviewPageData } from "@/lib/hydrology/public-hydrology-page-loader";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Enchente em Pelotas hoje? Situação das águas e níveis";
const PAGE_DESCRIPTION =
  "Veja a situação das águas em Pelotas hoje, com nível do Laranjal, Lagoa dos Patos, Guaíba, Rede da Defesa Civil RS e contexto complementar do SACE, preservando horários e referências de cada leitura.";
const PAGE_PATH = "/situacao-hidrologica-pelotas";

const HYDROLOGY_PAGE_CONTENT = {
  eyebrow: "Antes de comparar os níveis",
  title: "Quatro cuidados para interpretar as medições",
  answer:
    "Cada número pertence a uma estação, a um horário e à referência usada naquela medição. Para acompanhar a situação, prefira observar a evolução do mesmo ponto ao longo do tempo e use classificações de atenção, alerta ou inundação somente no contexto em que a própria fonte as publicou.",
  facts: [
    "Números de réguas diferentes não devem ser subtraídos ou tratados como equivalentes sem uma referência comum documentada.",
    "O horário faz parte da leitura: um valor atrasado é a última informação conhecida, não o nível atual.",
    "As estações da ANA/SNIRH no mapa mostram a rede oficial da região; elas não substituem automaticamente a medição local usada no Laranjal.",
    "Para decisões de segurança, prevalecem os avisos e as orientações da Defesa Civil e das autoridades responsáveis.",
  ],
  faqs: [
    {
      question: "Há enchente em Pelotas hoje?",
      answer:
        "Uma única régua não confirma a situação de toda a cidade. Esta página reúne as leituras disponíveis e mantém o horário e a origem de cada uma. Para decisões de segurança, consulte a Defesa Civil e as autoridades locais.",
    },
    {
      question: "Posso comparar diretamente o nível do Laranjal com o Guaíba?",
      answer:
        "Não. São pontos diferentes e podem usar referências diferentes. O mais útil é acompanhar a tendência de cada estação em sua própria série.",
    },
    {
      question: "O que significa quando uma leitura está atrasada?",
      answer:
        "Significa que aquele é o último valor conhecido. O portal mantém o horário visível e não apresenta dado antigo como se fosse uma medição atual.",
    },
    {
      question: "As estações da ANA mostradas no mapa são novas leituras do Laranjal?",
      answer:
        "Não. Elas fazem parte do inventário oficial da Rede Hidrometeorológica Nacional e ajudam a localizar o monitoramento existente na região. Uma estação só entra como medição local quando existe um contrato de fonte e referência adequado para esse uso.",
    },
    {
      question: "Qual é o papel do SACE Guaíba nesta página?",
      answer:
        "Ele acrescenta contexto dos rios e do Guaíba a montante. Suas classificações permanecem ligadas às próprias estações e não são convertidas automaticamente em previsão ou alerta para Pelotas.",
    },
  ],
  relatedLinks: [
    {
      label: "Nível da Lagoa no Laranjal",
      href: "/nivel-da-lagoa-dos-patos-laranjal" as const,
      description: "Veja a página detalhada da Estação Laranjal e sua evolução recente.",
    },
    {
      label: "Nível do Guaíba",
      href: "/nivel-do-guaiba" as const,
      description: "Acompanhe Cais Mauá e Gasômetro com horário, tendência e referências próprias.",
    },
    {
      label: "Enchente de 1941 em Pelotas",
      href: "/enchente-1941-pelotas" as const,
      description: "Consulte a referência histórica documentada no Canal São Gonçalo sem transferir essa cota para as réguas atuais.",
    },
    {
      label: "Enchente de 2024 em Pelotas",
      href: "/enchente-2024-pelotas-laranjal" as const,
      description: "Veja a linha do tempo da cheia e como a água avançou do Guaíba até Pelotas e o Laranjal.",
    },
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Consulte chuva, vento e rajadas previstos para as próximas horas.",
    },
    {
      label: "Alertas oficiais",
      href: "/alertas" as const,
      description: "Acompanhe avisos meteorológicos vigentes e orientações oficiais.",
    },
    {
      label: "Como os dados funcionam",
      href: "/status-dos-dados" as const,
      description: "Veja a origem, a atualização e os limites de cada fonte de nível.",
    },
  ],
};

export const Route = createFileRoute("/situacao-hidrologica-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Situação das águas em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Enchente em Pelotas hoje",
          "Risco de enchente em Pelotas",
          "Nível da Lagoa dos Patos",
          "Estação Laranjal",
          "Rede Hidrometeorológica Nacional",
          "Agência Nacional de Águas e Saneamento Básico",
          "Sistema Nacional de Informações sobre Recursos Hídricos",
          "Estações hidrometeorológicas próximas de Pelotas",
          "Rios principais na região de Pelotas",
          "Massas d'água na região da Lagoa dos Patos",
          "Medições de nível na região",
          "Situação das águas em Pelotas",
          "Medições automáticas da Lagoa dos Patos",
          "Rede de Monitoramento Hidrometeorológico da Defesa Civil RS",
          "Guaíba e Delta do Jacuí",
          "SACE Guaíba do Serviço Geológico do Brasil",
          "Contexto complementar a montante",
          "Rios Jacuí, Taquari-Antas, Caí, Sinos e Gravataí",
          "Horário e tendência das leituras de nível",
          "Referências locais de estações",
          "Influência do vento e da chuva no nível da lagoa",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, HYDROLOGY_PAGE_CONTENT.faqs),
    ]),
  loader: () => loadHydrologyOverviewPageData(),
  staleTime: 60 * 1_000,
  component: SituacaoHidrologicaPage,
});

function SituacaoHidrologicaPage() {
  const data = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={data.weather}
      recoverWeatherAfterHydration={false}
      pageClassName="internal-weather-shell--hydrology"
      showOfficialAlerts={false}
      hero={() => (
        <HydrologyOverviewHero
          level={data.level}
          lagoon={data.lagoon}
          sace={data.sace}
        />
      )}
    >
      {(recoveredWeather) => (
        <>
          <HydrologyCurrentSituationAnswer
            level={data.level}
            lagoon={data.lagoon}
            sace={data.sace}
          />
          <HydrologySectionBoundary label="Painel regional de hidrologia">
            <SaceGuaibaRenderScope render={false}>
              <HydrologyOverviewV2
                weather={recoveredWeather}
                level={data.level}
                guaiba={data.guaiba}
                lagoon={data.lagoon}
                sace={data.sace}
              />
            </SaceGuaibaRenderScope>
          </HydrologySectionBoundary>
          <HydrologySectionBoundary label="Estações oficiais ANA/SNIRH na região">
            <AnaRhnRegionalStations
              data={data.anaRhnRegional}
              hydrography={data.anaRhnHydrography}
            />
          </HydrologySectionBoundary>
          <HydrologySectionBoundary label="Rede da Defesa Civil RS">
            <DefesaCivilHydroNetwork data={data.defesaCivil} />
          </HydrologySectionBoundary>
          <HydrologySectionBoundary label="Contexto complementar · SACE Guaíba">
            <SaceGuaibaContext data={data.sace} />
          </HydrologySectionBoundary>
          <RegisteredHydrologyOverviewEnrichment
            level={data.level}
            guaiba={data.guaiba}
            lagoon={data.lagoon}
            sace={data.sace}
            defesaCivil={data.defesaCivil}
            anaRhnRegional={data.anaRhnRegional}
          />
          <EditorialContentSection
            id="como-interpretar-situacao-das-aguas"
            content={HYDROLOGY_PAGE_CONTENT}
          />
        </>
      )}
    </InternalWeatherPageShell>
  );
}
