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

const PAGE_TITLE = "Nível do Rio Jaguarão hoje: leitura da Defesa Civil RS";
const PAGE_DESCRIPTION =
  "Acompanhe o nível do Rio Jaguarão hoje pela estação da Defesa Civil RS em Jaguarão, com horário da leitura, tendência, chuva e referência da própria estação.";
const PAGE_PATH = "/nivel-do-rio-jaguarao";

const PAGE_CONFIG: DefesaCivilStationPageConfig = {
  stationCode: "DCRS-00115",
  eyebrow: "Rio Jaguarão · Defesa Civil RS",
  heading: "Nível do Rio Jaguarão hoje",
  introduction:
    "A leitura abaixo vem da estação Jaguarão da Rede de Monitoramento Hidrometeorológico da Defesa Civil RS. O valor é mostrado na referência própria do ponto, com horário, tendência e chuva quando esses campos estão disponíveis.",
  waterBodyLabel: "Rio Jaguarão",
  locationLabel: "Jaguarão",
  weatherPath: "/tempo-em/jaguarao-rs",
  weatherLabel: "Jaguarão",
  siblingPath: "/nivel-do-canal-sao-goncalo",
  siblingLabel: "Nível do Canal São Gonçalo",
};

const PAGE_CONTENT = {
  eyebrow: "Leitura hidrológica local",
  title: "A régua de Jaguarão precisa ser interpretada como uma série própria",
  answer:
    "O dado mais útil é a evolução da própria estação ao longo do tempo. O Tempo Pelotas preserva o horário e a tendência recebidos da rede, mas não aplica uma cota de inundação sem metadado específico e não transfere limiares publicados para outras réguas ou pontos do rio.",
  facts: [
    "A página usa somente a estação DCRS-00115, identificada como Jaguarão no inventário regional da Defesa Civil RS.",
    "O nível do rio é exibido em metros, unidade documentada oficialmente pela API da rede hidrometeorológica.",
    "Tendência é apresentada como texto da fonte e não é convertida pelo portal em classificação de risco.",
    "Uma leitura ausente não é substituída por zero, por uma estação vizinha ou por uma condição presumida de normalidade.",
    "Previsão meteorológica e nível do rio permanecem separados: chuva e vento previstos podem ajudar no contexto, mas não alteram o valor observado pela estação.",
  ],
  faqs: [
    {
      question: "Qual é o nível do Rio Jaguarão hoje?",
      answer:
        "A última medição recebida da estação DCRS-00115 aparece no bloco de leitura desta página, junto com o horário informado pela fonte. Se a estação não estiver disponível, o portal mostra a indisponibilidade em vez de inventar um valor.",
    },
    {
      question: "O que significa a tendência do Rio Jaguarão?",
      answer:
        "A tendência exibida é o texto informado pela própria estação. Ela ajuda a descrever a direção recente da leitura, mas não é transformada automaticamente pelo Tempo Pelotas em alerta, normalidade ou previsão de cheia.",
    },
    {
      question: "O nível mostrado já é a cota de inundação de Jaguarão?",
      answer:
        "Não. O número é o nível informado na referência da estação. Sem o metadado específico de zero da régua, datum e limiar aplicável a esse ponto, o portal não apresenta o valor como cota de inundação.",
    },
    {
      question: "A chuva da estação é a previsão do tempo?",
      answer:
        "Não. Os acumulados de chuva do módulo são observações da estação quando disponíveis. A previsão meteorológica de Jaguarão fica na página de tempo do município e usa contrato separado.",
    },
    {
      question: "O Tempo Pelotas substitui os avisos da Defesa Civil?",
      answer:
        "Não. Esta página organiza a leitura da estação para consulta. Em situação de risco, devem prevalecer os comunicados da Defesa Civil e das autoridades locais.",
    },
  ],
  relatedLinks: [
    {
      label: "Situação hidrológica regional",
      href: "/situacao-hidrologica-pelotas" as const,
      description: "Veja como o portal separa as diferentes redes e referências de água da região.",
    },
    {
      label: "Alertas oficiais",
      href: "/alertas" as const,
      description: "Consulte avisos meteorológicos e orientações oficiais vigentes.",
    },
    {
      label: "Metodologia e fontes",
      href: "/metodologia" as const,
      description: "Entenda como o Tempo Pelotas preserva origem, horário e limites de cada dado.",
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
    <ContentPageShell pageClassName="content-shell--defesa-civil-station">
      <DefesaCivilStationHydrologyPage data={data} config={PAGE_CONFIG} />
      <EditorialContentSection id="como-interpretar-nivel-rio-jaguarao" content={PAGE_CONTENT} />
    </ContentPageShell>
  );
}
