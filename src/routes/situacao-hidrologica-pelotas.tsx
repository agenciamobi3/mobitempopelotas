import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { OfficialDataAccessNotice } from "@/components/content/OfficialDataAccessNotice";
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
import { HYDROLOGY_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { loadHydrologyOverviewPageData } from "@/lib/hydrology/public-hydrology-page-loader";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Enchente em Pelotas hoje? Situação das águas e níveis";
const PAGE_DESCRIPTION =
  "Veja a situação das águas em Pelotas hoje, com nível do Laranjal, Lagoa dos Patos, Guaíba, Rede da Defesa Civil RS e contexto complementar do SACE, preservando horários e referências de cada leitura.";
const PAGE_PATH = "/situacao-hidrologica-pelotas";

const HYDROLOGY_PAGE_CONTENT = {
  ...HYDROLOGY_EDITORIAL_CONTENT,
  eyebrow: "Como acompanhar os níveis da água",
  title: "Entenda o que cada estação mostra e por que os valores não são iguais",
  answer:
    "A Estação Laranjal é a leitura local apresentada para Pelotas. Os demais pontos da Lagoa dos Patos e da Rede da Defesa Civil RS ajudam a entender a situação regional. O mapa da ANA/SNIRH acrescenta estações cadastradas, rios principais e massas d’água oficiais no entorno, sem transformar esses pontos automaticamente em novas leituras do Laranjal. O SACE Guaíba entra como contexto complementar a montante. Cada estação usa seu próprio local, horário e referência de medição.",
  facts: [
    "O mapa regional usa coordenadas do inventário de estações da Rede Hidrometeorológica Nacional e, quando disponíveis, as camadas públicas de rios principais e massas d’água da ANA/SNIRH.",
    "A presença de uma estação no inventário não significa que sua leitura seja usada como nível atual do Laranjal.",
    "A Estação Laranjal é a referência local do portal e não recebe automaticamente as cotas de outras estações.",
    "Uma leitura atrasada aparece como último valor conhecido e não como nível atual.",
    "Itapuã, Arambaré, São Lourenço do Sul e Rio Grande ajudam a acompanhar diferentes partes da Lagoa dos Patos.",
    "A Rede de Monitoramento Hidrometeorológico da Defesa Civil RS é apresentada antes do SACE no panorama regional desta página.",
    "Como contexto complementar a montante, o SACE mostra a situação de rios como Jacuí, Taquari-Antas, Caí, Sinos e Gravataí, além do Delta e do Guaíba.",
    "As categorias Atenção, Alerta e Inundação pertencem à estação que as publicou e não são convertidas em classificação para o Laranjal.",
    "Vento, chuva, armazenamento de água, Canal São Gonçalo, drenagem local e saída oceânica podem influenciar a evolução em Pelotas.",
    "Quando uma estação não transmite, não há dado atual para interpretar; isso não significa que o nível esteja normal.",
  ],
  faqs: [
    {
      question: "Há enchente em Pelotas hoje?",
      answer:
        "O Tempo Pelotas não confirma enchente ou risco para a cidade a partir de uma única régua. A página reúne as leituras mais recentes disponíveis do Laranjal, Lagoa dos Patos, Guaíba e redes regionais, preservando horário e classificação de cada fonte. Para decisões de segurança, consulte a Defesa Civil e as autoridades locais.",
    },
    {
      question: "Existe risco de enchente em Pelotas?",
      answer:
        "Nível de uma estação, chuva ou vento isolados não bastam para afirmar risco para toda a cidade. O portal mostra os sinais disponíveis sem convertê-los automaticamente em alerta. Quando houver orientação oficial, ela deve prevalecer para decisões de segurança.",
    },
    ...HYDROLOGY_EDITORIAL_CONTENT.faqs,
    {
      question: "O que são as estações da ANA mostradas nesta página?",
      answer:
        "São pontos encontrados no cadastro público da Rede Hidrometeorológica Nacional em torno de Pelotas. A seção reproduz informações do inventário oficial, como localização, responsável, operadora e instrumentos cadastrados. O mapa também pode mostrar rios principais e massas d’água publicados pela ANA/SNIRH. Esses pontos não substituem automaticamente a leitura local do Laranjal.",
    },
    {
      question: "Qual é o papel do SACE Guaíba nesta página?",
      answer:
        "O SACE é usado como contexto complementar a montante. Ele ajuda a observar a situação oficial de rios que alimentam o Guaíba, mas não substitui a leitura local do Laranjal nem as medições da Defesa Civil RS e não é convertido em previsão automática para Pelotas.",
    },
    {
      question: "Uma estação elevada no SACE significa que o Laranjal vai subir?",
      answer:
        "Não necessariamente. A situação dos rios ajuda a entender o cenário, mas o nível no Laranjal também depende do tempo de deslocamento da água, do Guaíba, da Lagoa dos Patos, do vento, da chuva local e da saída em Rio Grande.",
    },
    {
      question: "O que significa acima de normal no SACE?",
      answer:
        "Significa que aquela estação foi publicada em uma categoria diferente de Normal, como Atenção, Alerta ou Inundação. A página reproduz a classificação da própria estação sem transformá-la em risco para Pelotas.",
    },
    {
      question: "O nível do Laranjal pode ser comparado diretamente com o nível do Guaíba?",
      answer:
        "Não. As estações ficam em locais diferentes e usam referências e instrumentos próprios. O mais útil é acompanhar a tendência e a evolução de cada ponto ao longo do tempo.",
    },
    {
      question: "Uma leitura antiga ainda aparece na página?",
      answer:
        "Pode aparecer como última leitura conhecida, sempre acompanhada do horário e da idade calculada. Ela não é apresentada como nível atual.",
    },
    {
      question: "Ausência de transmissão significa que o rio está normal?",
      answer:
        "Não. Significa apenas que não há uma leitura atual disponível naquela estação. O estado do rio não deve ser concluído sem dados válidos.",
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
          <OfficialDataAccessNotice scope="hydrology" />
          <EditorialContentSection
            id="como-interpretar-situacao-das-aguas"
            content={HYDROLOGY_PAGE_CONTENT}
          />
        </>
      )}
    </InternalWeatherPageShell>
  );
}
