import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { OfficialDataAccessNotice } from "@/components/content/OfficialDataAccessNotice";
import { LaranjalEmbedGuide } from "@/components/embed/LaranjalEmbedGuide";
import { HydrologyEditorialHero } from "@/components/hydrology/HydrologyEditorialHero";
import "@/components/hydrology/HydrologyEditorialRefinements.css";
import "@/components/hydrology/HydrologyEditorialRoute.css";
import { LaranjalLevelPage } from "@/components/hydrology/HydrologyPages";
import "@/components/hydrology/HydrologyDetailHomeContract.css";
import { useLaranjalLevelRefresh } from "@/components/hydrology/useLaranjalLevelRefresh";
import { LARANJAL_LEVEL_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { loadLaranjalHydrologyPageData } from "@/lib/hydrology/public-hydrology-page-loader";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Nível da Lagoa dos Patos hoje no Laranjal, Pelotas";
const PAGE_DESCRIPTION =
  "Veja o nível da Lagoa dos Patos hoje na Estação Laranjal, em Pelotas, com horário da última leitura, tendência e variação nas últimas 24 horas.";
const PAGE_PATH = "/nivel-da-lagoa-dos-patos-laranjal";

const LARANJAL_PAGE_CONTENT = {
  ...LARANJAL_LEVEL_EDITORIAL_CONTENT,
  eyebrow: "Como interpretar o nível no Laranjal",
  title: "Entenda o que a medição da Estação Laranjal representa",
  answer:
    "O número mostra o nível registrado no horário informado e na referência própria da Estação Laranjal. A evolução das últimas horas ajuda a acompanhar a mudança local, mas não confirma sozinha alagamento ou inundação.",
  facts: [
    "O Tempo Pelotas possui acesso autorizado à plataforma integrada da ANA para incorporar, de forma gradual, informações da Rede Hidrometeorológica Nacional ao acompanhamento regional.",
    "Dados da ANA/RHN só devem ser apresentados como leitura de uma estação depois de validar sua unidade, referência, horário e estado de atualização; valores de referências diferentes não são convertidos automaticamente para o Laranjal.",
    "Quando a estação fica sem nova medição, o portal mantém a última medição válida da própria Estação Laranjal, com horário e estado de atualização explícitos, até receber um ponto novo.",
    "Uma mudança curta pode resultar de vento, oscilação local ou ruído. A sequência de medições é mais útil do que um único ponto.",
    "O nível do Guaíba ajuda a compor o contexto regional, mas não deve ser subtraído nem comparado diretamente com a régua do Laranjal.",
    "As marcas históricas de 1941 e 2024 pertencem aos referenciais documentados em cada evento e não são convertidas em cota da Estação Laranjal.",
    "Em condição de risco, siga a Defesa Civil, as autoridades municipais e os comunicados oficiais.",
  ],
  faqs: [
    {
      question: "Qual é o nível da Lagoa dos Patos hoje em Pelotas?",
      answer:
        "A leitura mais recente da Estação Laranjal aparece no topo desta página, junto com o horário da medição, o estado de atualização e a tendência observada. A leitura representa a referência própria da estação no Laranjal e não toda a Lagoa dos Patos.",
    },
    {
      question: "O nível da Lagoa dos Patos está em tempo real?",
      answer:
        "A página mostra a leitura mais recente recebida da fonte, sempre com horário e estado de atualização. Se não houver nova medição no momento da visita, o portal mantém a última medição válida identificada como last-known e continua tentando atualizar sem apresentá-la como leitura atual.",
    },
    {
      question: "A medição exibida no Laranjal já vem da ANA/RHN?",
      answer:
        "Não necessariamente. A página identifica a fonte usada para cada leitura. O acesso à plataforma integrada da ANA/RHN está autorizado e a integração está em implantação, mas uma estação só entra como fonte pública depois de validarmos unidade, referência, horário e disponibilidade.",
    },
    {
      question: "O que representa o número exibido para o Laranjal?",
      answer:
        "Ele representa a medição da estação na referência usada pelo próprio equipamento. Não deve ser comparado diretamente com marcas físicas ou outras estações sem conhecer a referência de cada uma.",
    },
    {
      question: "Com que frequência o nível é atualizado?",
      answer:
        "A frequência depende da estação e da disponibilidade da transmissão. Enquanto a página estiver aberta, o Tempo Pelotas tenta atualizar a leitura do Laranjal a cada minuto e também quando a aba volta a ficar visível. Até chegar uma medição nova, permanece visível a última medição válida com seu horário original.",
    },
    {
      question: "Um valor alto confirma inundação no Laranjal?",
      answer:
        "Não por si só. O impacto depende da referência local, da evolução, do vento, da drenagem e das condições em cada trecho. Use os comunicados das autoridades para decisões de segurança.",
    },
    {
      question: "Posso comparar diretamente o nível do Laranjal com o Guaíba ou com a marca de 1941?",
      answer:
        "Não. Cada ponto usa localização e referência próprias. O portal conecta essas páginas para contexto regional e histórico, mas não converte uma régua na outra nem usa uma diferença simples entre os números.",
    },
  ],
  relatedLinks: [
    {
      label: "Previsão do tempo no Laranjal",
      href: "/tempo-laranjal-pelotas" as const,
      description: "Veja temperatura, chuva, vento e a tendência de 7 dias para um ponto de referência na orla, sem confundir previsão com nível da Lagoa.",
    },
    {
      label: "Situação das águas em Pelotas",
      href: "/situacao-hidrologica-pelotas" as const,
      description: "Compare a medição local com outros pontos da Lagoa e do Guaíba.",
    },
    {
      label: "Nível do Guaíba",
      href: "/nivel-do-guaiba" as const,
      description: "Acompanhe Cais Mauá e Gasômetro preservando as referências próprias de cada estação.",
    },
    {
      label: "Enchente de 1941 em Pelotas",
      href: "/enchente-1941-pelotas" as const,
      description: "Veja a referência histórica documentada no São Gonçalo e por que ela não é cota da Estação Laranjal.",
    },
    {
      label: "Enchente de 2024 em Pelotas e no Laranjal",
      href: "/enchente-2024-pelotas-laranjal" as const,
      description: "Consulte a linha do tempo da cheia de 2024 e o contexto hidrológico regional daquele evento.",
    },
    {
      label: "Avisos meteorológicos oficiais",
      href: "/alertas" as const,
      description: "Confira alertas vigentes de chuva, vento e tempestade.",
    },
    {
      label: "Câmeras do Laranjal",
      href: "/cameras-ao-vivo-pelotas" as const,
      description: "Use a imagem como complemento visual, sem substituir a medição da estação.",
    },
  ],
};

export const Route = createFileRoute("/nivel-da-lagoa-dos-patos-laranjal")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Situação das águas", path: "/situacao-hidrologica-pelotas" },
          { name: "Nível da Lagoa no Laranjal", path: PAGE_PATH },
        ],
        about: [
          "Nível da Lagoa dos Patos hoje",
          "Nível da Lagoa dos Patos em Pelotas",
          "Estação Laranjal",
          "Praia do Laranjal",
          "Rede Hidrometeorológica Nacional",
          "Agência Nacional de Águas e Saneamento Básico",
          "Medição automática do nível em Pelotas",
          "Tendência do nível da água no Laranjal",
          "Contexto regional do Guaíba e Lagoa dos Patos",
          "Histórico das cheias de 1941 e 2024 em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, LARANJAL_PAGE_CONTENT.faqs),
    ]),
  loader: () => loadLaranjalHydrologyPageData(),
  staleTime: 60 * 1_000,
  component: NivelLagoaPage,
});

function NivelLagoaPage() {
  const data = Route.useLoaderData();
  const level = useLaranjalLevelRefresh(data.level);

  return (
    <div className="hydrology-editorial-route">
      <HydrologyEditorialHero level={level} variant="detail" />
      <LaranjalLevelPage weather={data.weather} level={level} />
      <OfficialDataAccessNotice scope="hydrology" />
      <LaranjalEmbedGuide />
      <EditorialContentSection id="como-interpretar-nivel-laranjal" content={LARANJAL_PAGE_CONTENT} />
    </div>
  );
}
