import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import {
  DefesaCivilStationHydrologyPage,
  type DefesaCivilStationPageConfig,
} from "@/components/hydrology/DefesaCivilStationHydrologyPage";
import { ContentPageShell } from "@/components/layout/ContentPageShell";
import { getDefesaCivilHydroData } from "@/lib/hydrology/defesa-civil-rs.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Nível do Canal São Gonçalo hoje: Eclusa em Capão do Leão";
const PAGE_DESCRIPTION =
  "Veja o nível do Canal São Gonçalo hoje na estação da Eclusa em Capão do Leão, com horário da leitura, tendência, chuva e referência da Defesa Civil RS.";
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
    "A leitura abaixo vem da estação Capão do Leão - Eclusa - Canal São Gonçalo, da Rede de Monitoramento Hidrometeorológico da Defesa Civil RS. O valor pertence à referência própria desse ponto e não deve ser confundido com a régua do Cais do Porto em Pelotas ou com outra estação do sistema lagunar.",
  waterBodyLabel: "Canal São Gonçalo",
  locationLabel: "Eclusa do Canal São Gonçalo, Capão do Leão",
  weatherPath: "/tempo-em/capao-do-leao-rs",
  weatherLabel: "Capão do Leão",
  siblingPath: "/nivel-do-rio-jaguarao",
  siblingLabel: "Nível do Rio Jaguarão",
};

const PAGE_CONTENT = {
  eyebrow: "Leitura da Eclusa",
  title: "O São Gonçalo é um sistema, mas cada régua continua sendo local",
  answer:
    "O Canal São Gonçalo conecta a Lagoa Mirim à Lagoa dos Patos e possui pontos de observação com referências distintas. Esta página acompanha especificamente a estação DCRS-00063 na Eclusa, em Capão do Leão. Por isso, o valor não é convertido para a régua do Porto de Pelotas nem usado para reconstruir outra série.",
  facts: [
    "A página usa somente a estação DCRS-00063, identificada pela Defesa Civil RS como Capão do Leão - Eclusa - Canal São Gonçalo.",
    "A barragem e a eclusa do Canal São Gonçalo ficam em Capão do Leão; o sistema conecta a Lagoa Mirim e a Lagoa dos Patos.",
    "O nível é exibido em metros, unidade documentada pela API oficial, sempre associado à referência própria da estação.",
    "A tendência recebida da fonte descreve o comportamento informado no ponto e não é convertida automaticamente em risco ou cota de atenção.",
    "Uma leitura da Eclusa não deve ser comparada diretamente com a régua do Cais do Porto de Pelotas sem referência vertical compatível.",
  ],
  faqs: [
    {
      question: "Qual é o nível do Canal São Gonçalo hoje?",
      answer:
        "A última medição recebida da estação DCRS-00063 aparece no bloco de leitura desta página. O horário acompanha o valor para deixar claro quando a observação foi registrada.",
    },
    {
      question: "Essa leitura é feita em Pelotas?",
      answer:
        "Não. Esta página usa a estação da Eclusa em Capão do Leão. Leituras publicadas para o Cais do Porto em Pelotas pertencem a outro ponto e não são tratadas como a mesma régua.",
    },
    {
      question: "O nível da Eclusa pode ser comparado diretamente ao nível do Cais do Porto?",
      answer:
        "Não sem confirmação de referência vertical compatível. O Tempo Pelotas mantém cada ponto identificado separadamente e não subtrai nem converte réguas diferentes automaticamente.",
    },
    {
      question: "O valor mostrado já indica cota de atenção ou inundação?",
      answer:
        "Não. O portal apresenta o nível informado pela estação. Sem metadado específico do limiar e da referência dessa régua, o valor não é classificado como cota de atenção, alerta ou inundação.",
    },
    {
      question: "Onde vejo a previsão do tempo para a área da Eclusa?",
      answer:
        "A previsão municipal fica na página de tempo em Capão do Leão. Ela é independente da leitura hidrológica da Defesa Civil e não substitui a observação do canal.",
    },
  ],
  relatedLinks: [
    {
      label: "Situação hidrológica regional",
      href: "/situacao-hidrologica-pelotas" as const,
      description: "Compare as redes regionais mantendo cada estação na sua própria referência.",
    },
    {
      label: "Alertas oficiais",
      href: "/alertas" as const,
      description: "Consulte avisos meteorológicos e orientações oficiais vigentes.",
    },
    {
      label: "Metodologia e fontes",
      href: "/metodologia" as const,
      description: "Veja como o portal trata unidade, horário, proveniência e estados degradados.",
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
    <ContentPageShell pageClassName="content-shell--defesa-civil-station">
      <DefesaCivilStationHydrologyPage data={data} config={PAGE_CONFIG} />
      <EditorialContentSection id="como-interpretar-nivel-canal-sao-goncalo" content={PAGE_CONTENT} />
    </ContentPageShell>
  );
}
