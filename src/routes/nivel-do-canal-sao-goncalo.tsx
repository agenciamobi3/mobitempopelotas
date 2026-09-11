import { createFileRoute } from "@tanstack/react-router";

import { RegisteredHydrologyEnrichment } from "@/components/auth/RegisteredHydrologyEnrichment";
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

const PAGE_TITLE = "Nível do Canal São Gonçalo hoje: Eclusa em Capão do Leão";
const PAGE_DESCRIPTION =
  "Veja o nível do Canal São Gonçalo hoje na estação da Eclusa em Capão do Leão, com horário da leitura, tendência informada pela fonte, chuva e referência da Defesa Civil RS.";
const PAGE_PATH = "/nivel-do-canal-sao-goncalo";
const PAGE_LOCATION = {
  "@type": "Place",
  name: "Eclusa do Canal São Gonçalo, Capão do Leão, Rio Grande do Sul",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Capão do Leão",
    addressRegion: "RS",
    addressCountry: "BR",
  },
};

const PAGE_CONFIG: DefesaCivilStationPageConfig = {
  stationCode: "DCRS-00063",
  eyebrow: "Canal São Gonçalo · Defesa Civil RS",
  heading: "Nível do Canal São Gonçalo hoje",
  introduction:
    "Acompanhe a última leitura recebida da estação da Eclusa, em Capão do Leão. O horário, a tendência informada pela própria fonte e a chuva aparecem junto do nível quando disponíveis. Esta régua é própria desse ponto e não é a mesma do Porto de Pelotas.",
  waterBodyLabel: "Canal São Gonçalo",
  locationLabel: "Eclusa do Canal São Gonçalo, Capão do Leão",
  weatherPath: "/tempo-em/capao-do-leao-rs",
  weatherLabel: "Capão do Leão",
  siblingPath: "/nivel-do-rio-jaguarao",
  siblingLabel: "Nível do Rio Jaguarão",
};

const PAGE_CONTENT = {
  eyebrow: "Entenda a leitura",
  title: "A régua da Eclusa representa este ponto do Canal São Gonçalo",
  answer:
    "O Canal São Gonçalo liga a Lagoa Mirim à Lagoa dos Patos e pode ter leituras diferentes ao longo do sistema. Esta página acompanha somente a estação DCRS-00063, na Eclusa em Capão do Leão. Por isso, o valor não é convertido para a régua do Porto de Pelotas nem tratado como um número único para todo o canal.",
  facts: [
    "A leitura vem da estação DCRS-00063, na Eclusa do Canal São Gonçalo, em Capão do Leão.",
    "O nível é mostrado em metros, na unidade informada pela fonte.",
    "Quando existe, a tendência é reproduzida como informação textual da própria fonte e não é recalculada pelo Tempo Pelotas nem tratada, sozinha, como alerta de risco.",
    "Se a leitura não chega, o portal não troca a ausência por zero ou por uma estação vizinha.",
    "A régua da Eclusa e a régua do Porto de Pelotas só podem ser comparadas quando suas referências forem compatíveis.",
  ],
  faqs: [
    {
      question: "Qual é o nível do Canal São Gonçalo hoje?",
      answer:
        "A última medição recebida aparece no bloco de leitura desta página, junto do horário informado pela estação.",
    },
    {
      question: "Essa leitura é feita em Pelotas?",
      answer:
        "Não. A estação desta página fica na Eclusa, em Capão do Leão. O Cais do Porto em Pelotas é outro ponto de medição.",
    },
    {
      question: "Posso comparar diretamente a Eclusa com o Cais do Porto?",
      answer:
        "Não sem confirmar que as duas réguas usam referências compatíveis. O portal mantém os pontos separados justamente para evitar uma comparação enganosa.",
    },
    {
      question: "O valor mostrado já indica atenção ou inundação?",
      answer:
        "Não automaticamente. Sem um limiar oficial específico para esta régua, o Tempo Pelotas apresenta a medição sem transformá-la em cota de atenção ou inundação.",
    },
    {
      question: "Onde vejo a previsão do tempo para a Eclusa?",
      answer:
        "A previsão fica na página de tempo em Capão do Leão. Ela complementa a leitura do canal, mas não altera o valor medido pela estação.",
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

export const Route = createFileRoute("/nivel-do-canal-sao-goncalo")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        location: PAGE_LOCATION,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Situação das águas", path: "/situacao-hidrologica-pelotas" },
          { name: "Nível do Canal São Gonçalo", path: PAGE_PATH },
        ],
        about: [
          "Nível do Canal São Gonçalo hoje",
          "Canal São Gonçalo",
          "Eclusa do Canal São Gonçalo",
          "Capão do Leão RS",
          "Defesa Civil RS",
          "Estação DCRS-00063",
          "Lagoa Mirim e Lagoa dos Patos",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, PAGE_CONTENT.faqs),
    ]),
  loader: () => getDefesaCivilHydroData(),
  staleTime: 2 * 60 * 1_000,
  component: NivelCanalSaoGoncaloPage,
});

function NivelCanalSaoGoncaloPage() {
  const data = Route.useLoaderData();

  return (
    <div className="hydrology-editorial-route hydrology-editorial-route--defesa-civil-station hydrology-editorial-route--sao-goncalo">
      <DefesaCivilStationHydrologyPage data={data} config={PAGE_CONFIG} />
      <RegisteredHydrologyEnrichment data={data} stationCode="DCRS-00063" pagePath={PAGE_PATH} />
      <EditorialContentSection id="como-interpretar-nivel-canal-sao-goncalo" content={PAGE_CONTENT} />
    </div>
  );
}
