import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import {
  DefesaCivilStationHydrologyPage,
  type DefesaCivilStationPageConfig,
} from "@/components/hydrology/DefesaCivilStationHydrologyPage";
import "@/components/hydrology/DefesaCivilStationVisualRefresh.css";
import "@/components/hydrology/HydrologyEditorialRoute.css";
import { getDefesaCivilHydroData } from "@/lib/hydrology/defesa-civil-rs.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Nível do Rio Jaguarão hoje: leitura da Defesa Civil RS";
const PAGE_DESCRIPTION =
  "Acompanhe o nível do Rio Jaguarão hoje pela estação da Defesa Civil RS em Jaguarão, com horário da leitura, tendência, chuva e referência da própria estação.";
const PAGE_PATH = "/nivel-do-rio-jaguarao";
const PAGE_LOCATION = {
  "@type": "Place",
  name: "Jaguarão, Rio Grande do Sul",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Jaguarão",
    addressRegion: "RS",
    addressCountry: "BR",
  },
};

const PAGE_CONFIG: DefesaCivilStationPageConfig = {
  stationCode: "DCRS-00115",
  eyebrow: "Rio Jaguarão · Defesa Civil RS",
  heading: "Nível do Rio Jaguarão hoje",
  introduction:
    "Acompanhe a última leitura recebida da estação de Jaguarão. O horário, a tendência e a chuva aparecem junto do nível quando a fonte os informa. A régua representa este ponto do rio e deve ser acompanhada pela própria série.",
  waterBodyLabel: "Rio Jaguarão",
  locationLabel: "Jaguarão",
  weatherPath: "/tempo-em/jaguarao-rs",
  weatherLabel: "Jaguarão",
  siblingPath: "/nivel-do-canal-sao-goncalo",
  siblingLabel: "Nível do Canal São Gonçalo",
};

const PAGE_CONTENT = {
  eyebrow: "Entenda a leitura",
  title: "A evolução da própria régua é o que mais importa",
  answer:
    "Esta página acompanha somente a estação DCRS-00115, em Jaguarão. O horário e a tendência ajudam a entender como a leitura mudou naquele ponto. O Tempo Pelotas não aplica automaticamente cotas de outras estações nem transforma uma única medição em alerta de cheia.",
  facts: [
    "A leitura vem da estação DCRS-00115, identificada como Jaguarão pela Defesa Civil RS.",
    "O nível é mostrado em metros, na unidade informada pela fonte.",
    "A tendência descreve o comportamento informado para esta estação e não é, sozinha, um alerta.",
    "Se a leitura não chega, o portal não troca a ausência por zero ou por uma estação vizinha.",
    "Previsão de chuva e nível do rio são dados diferentes e permanecem separados.",
  ],
  faqs: [
    {
      question: "Qual é o nível do Rio Jaguarão hoje?",
      answer:
        "A última medição recebida aparece no bloco de leitura desta página, junto do horário informado pela estação.",
    },
    {
      question: "O que significa a tendência do Rio Jaguarão?",
      answer:
        "É a direção de mudança informada pela fonte para esta estação. Ela ajuda a entender a leitura recente, mas não é automaticamente um alerta de risco.",
    },
    {
      question: "O nível mostrado já é a cota de inundação de Jaguarão?",
      answer:
        "Não. A página mostra a medição da régua. Sem um limiar oficial específico para esse ponto, o portal não apresenta o valor como cota de inundação.",
    },
    {
      question: "A chuva da estação é a previsão do tempo?",
      answer:
        "Não. A chuva mostrada neste módulo é uma observação da estação quando disponível. A previsão fica na página de tempo de Jaguarão.",
    },
    {
      question: "O Tempo Pelotas substitui os avisos da Defesa Civil?",
      answer:
        "Não. Esta página organiza a leitura da estação. Em situação de risco, consulte também os comunicados da Defesa Civil e das autoridades locais.",
    },
  ],
  relatedLinks: [
    {
      label: "Situação das águas na região",
      href: "/situacao-hidrologica-pelotas" as const,
      description: "Veja outras leituras de água mantendo cada estação na própria referência.",
    },
    {
      label: "Alertas oficiais",
      href: "/alertas" as const,
      description: "Consulte avisos meteorológicos e orientações oficiais vigentes.",
    },
    {
      label: "Dados e fontes",
      href: "/status-dos-dados" as const,
      description: "Entenda como o portal trata horário, unidade, origem e indisponibilidade.",
    },
  ],
};

export const Route = createFileRoute("/nivel-do-rio-jaguarao")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        location: PAGE_LOCATION,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Tempo na Região Sul", path: "/tempo-na-regiao-sul-rs" },
          { name: "Nível do Rio Jaguarão", path: PAGE_PATH },
        ],
        about: [
          "Nível do Rio Jaguarão hoje",
          "Rio Jaguarão",
          "Jaguarão RS",
          "Defesa Civil RS",
          "Rede de Monitoramento Hidrometeorológico",
          "Estação DCRS-00115",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, PAGE_CONTENT.faqs),
    ]),
  loader: () => getDefesaCivilHydroData(),
  staleTime: 2 * 60 * 1_000,
  component: NivelRioJaguaraoPage,
});

function NivelRioJaguaraoPage() {
  const data = Route.useLoaderData();

  return (
    <div className="hydrology-editorial-route hydrology-editorial-route--defesa-civil-station hydrology-editorial-route--jaguarao">
      <DefesaCivilStationHydrologyPage data={data} config={PAGE_CONFIG} />
      <EditorialContentSection id="como-interpretar-nivel-rio-jaguarao" content={PAGE_CONTENT} />
    </div>
  );
}
