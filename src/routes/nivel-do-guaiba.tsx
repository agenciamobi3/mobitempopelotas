import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { GuaibaLevelPage } from "@/components/hydrology/GuaibaLevelPage";
import "@/components/hydrology/GuaibaLevelVisualRefresh.css";
import "@/components/hydrology/HydrologyEditorialRoute.css";
import { loadGuaibaPageData } from "@/lib/hydrology/public-hydrology-page-loader";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Nível do Guaíba hoje: Cais Mauá, Gasômetro e tendência";
const PAGE_DESCRIPTION =
  "Veja o nível do Guaíba hoje, horário da última leitura, tendência, variação em 24 horas e as referências próprias do Cais Mauá e da Usina do Gasômetro.";
const PAGE_PATH = "/nivel-do-guaiba";

const GUAIBA_PAGE_CONTENT = {
  eyebrow: "Como interpretar o nível do Guaíba",
  title: "Cais Mauá e Gasômetro são réguas diferentes e não devem ser misturadas",
  answer:
    "A página mostra a leitura disponível na referência selecionada e mantém Cais Mauá e Gasômetro identificados separadamente. Cada régua possui localização, fonte e cota de referência próprias. O mais útil é acompanhar a evolução de cada ponto ao longo do tempo, sem transferir automaticamente um limiar para outra estação.",
  facts: [
    "O Guaíba é acompanhado aqui como parte do sistema hidrológico que se conecta à Lagoa dos Patos e ajuda a contextualizar a situação regional de Pelotas.",
    "A leitura preferencial usa a série pública do Cais Mauá quando está utilizável; a Usina do Gasômetro permanece como referência independente e contingência conforme o contrato atual.",
    "A página preserva o horário da leitura e avisa quando o dado está atrasado ou indisponível.",
    "Tendência em centímetros por hora e variação em 24 horas são calculadas a partir da série da própria estação selecionada.",
    "A cota de referência mostrada pertence à respectiva régua. Ela não deve ser aplicada ao Laranjal, a outra estação da Lagoa dos Patos ou a outro ponto de Porto Alegre.",
    "Um nível isolado do Guaíba não confirma risco de enchente em Pelotas. Para decisões de segurança, devem prevalecer comunicados da Defesa Civil e das autoridades competentes.",
  ],
  faqs: [
    {
      question: "Qual é o nível do Guaíba hoje?",
      answer:
        "A leitura mais recente disponível aparece no topo desta página, junto com o horário, o estado de atualização, a tendência e a variação nas últimas 24 horas. A estação usada também é identificada explicitamente.",
    },
    {
      question: "Cais Mauá e Gasômetro têm a mesma cota de referência?",
      answer:
        "Não. São referências diferentes e cada uma mantém a própria régua e cota. Por isso, os valores não devem ser tratados como se fossem uma única série nem comparados sem considerar a referência de cada estação.",
    },
    {
      question: "O nível do Guaíba indica automaticamente risco para Pelotas?",
      answer:
        "Não. O Guaíba ajuda a entender o contexto regional, mas o comportamento em Pelotas depende também da Lagoa dos Patos, da Estação Laranjal, do vento, da chuva, da drenagem e da saída em Rio Grande. O portal não converte uma leitura isolada em alerta para a cidade.",
    },
    {
      question: "O que significa o nível estar subindo ou baixando?",
      answer:
        "A tendência compara pontos recentes da mesma série e estima a variação por hora. Ela descreve a direção recente da régua selecionada e pode mudar conforme novas leituras entram.",
    },
    {
      question: "Uma leitura atrasada ainda aparece?",
      answer:
        "Pode aparecer como última leitura conhecida, sempre acompanhada do horário e do estado atrasado. Ela não é apresentada como se fosse uma medição atual.",
    },
  ],
  relatedLinks: [
    {
      label: "Situação das águas em Pelotas",
      href: "/situacao-hidrologica-pelotas" as const,
      description: "Veja o Guaíba dentro do contexto da Lagoa dos Patos, Laranjal e redes regionais.",
    },
    {
      label: "Nível da Lagoa no Laranjal",
      href: "/nivel-da-lagoa-dos-patos-laranjal" as const,
      description: "Consulte a referência local apresentada pelo Tempo Pelotas para o Laranjal.",
    },
    {
      label: "Enchente de 1941 em Pelotas",
      href: "/enchente-1941-pelotas" as const,
      description: "Entenda a referência histórica documentada no Canal São Gonçalo sem transferi-la para as réguas atuais do Guaíba.",
    },
    {
      label: "Enchente de 2024",
      href: "/enchente-2024-pelotas-laranjal" as const,
      description: "Relembre a evolução histórica do evento de 2024 entre Guaíba, Lagoa e Pelotas.",
    },
    {
      label: "Alertas oficiais",
      href: "/alertas" as const,
      description: "Consulte avisos meteorológicos e orientações oficiais vigentes.",
    },
  ],
};

export const Route = createFileRoute("/nivel-do-guaiba")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Situação das águas", path: "/situacao-hidrologica-pelotas" },
          { name: "Nível do Guaíba", path: PAGE_PATH },
        ],
        about: [
          "Nível do Guaíba hoje",
          "Nível do Guaíba em Porto Alegre",
          "Cais Mauá",
          "Usina do Gasômetro",
          "Tendência do nível do Guaíba",
          "Variação do nível do Guaíba em 24 horas",
          "Sistema Guaíba e Lagoa dos Patos",
          "Cheias históricas de 1941 e 2024 em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, GUAIBA_PAGE_CONTENT.faqs),
    ]),
  loader: () => loadGuaibaPageData(),
  staleTime: 60 * 1_000,
  component: NivelGuaibaPage,
});

function NivelGuaibaPage() {
  const { guaiba } = Route.useLoaderData();

  return (
    <div className="hydrology-editorial-route hydrology-editorial-route--guaiba">
      <GuaibaLevelPage data={guaiba} />
      <EditorialContentSection id="como-interpretar-nivel-guaiba" content={GUAIBA_PAGE_CONTENT} />
    </div>
  );
}
