import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { LaranjalEmbedGuide } from "@/components/embed/LaranjalEmbedGuide";
import { AnaRhnLaranjalStationProfile } from "@/components/hydrology/AnaRhnLaranjalStationProfile";
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
  "Veja o nível da Lagoa dos Patos hoje em Pelotas com fonte identificada, horário da última leitura, tendência e variação nas últimas 24 horas.";
const PAGE_PATH = "/nivel-da-lagoa-dos-patos-laranjal";

const LARANJAL_PAGE_CONTENT = {
  ...LARANJAL_LEVEL_EDITORIAL_CONTENT,
  eyebrow: "Como interpretar o nível no Laranjal",
  title: "Entenda o que a leitura local representa",
  answer:
    "O número mostra a leitura local usada nesta atualização, sempre acompanhado da fonte, do horário e da referência correspondente. O LabHidroSens/UFPel continua como fonte principal enquanto entrega medição atualizada; quando isso não acontece, o portal pode mostrar temporariamente o sensor Pelotas da rede CIEX/FURG. As duas séries permanecem separadas.",
  facts: [
    "O LabHidroSens/UFPel continua sendo a fonte principal da Estação Laranjal enquanto sua leitura estiver atualizada.",
    "Quando a leitura do LabHidroSens está atrasada ou indisponível, o Tempo Pelotas pode usar temporariamente o sensor Pelotas (sensor 7) da rede CIEX/FURG.",
    "A rede CIEX/FURG publica seus valores em centímetros e informa que as medidas são reduzidas ao referencial vertical brasileiro, o Marégrafo de Imbituba/SC. O portal converte apenas a unidade de centímetros para metros para apresentação.",
    "A série CIEX/FURG não é convertida para a referência própria da Estação Laranjal e não é fundida com a série do LabHidroSens.",
    "Se as duas fontes atuais falharem, o portal pode manter a última medição válida arquivada da própria Estação Laranjal, com horário e estado de atualização explícitos.",
    "Uma mudança curta pode resultar de vento, oscilação local ou ruído. A sequência de medições da mesma fonte é mais útil do que um único ponto.",
    "O nível do Guaíba ajuda a compor o contexto regional, mas não deve ser subtraído nem comparado diretamente com a leitura local de Pelotas.",
    "As marcas históricas de 1941 e 2024 pertencem aos referenciais documentados em cada evento e não são convertidas em cota da Estação Laranjal ou da rede CIEX/FURG.",
    "Em condição de risco, siga a Defesa Civil, as autoridades municipais e os comunicados oficiais.",
  ],
  faqs: [
    {
      question: "Qual é o nível da Lagoa dos Patos hoje em Pelotas?",
      answer:
        "A leitura mais recente aparece no topo desta página junto com a fonte, o horário, o estado de atualização e a tendência observada. Quando o LabHidroSens/UFPel está atualizado, a página usa a Estação Laranjal. Se essa fonte deixa de estar atualizada, o portal pode mostrar temporariamente o sensor Pelotas da rede CIEX/FURG, sem misturar as duas referências.",
    },
    {
      question: "O nível da Lagoa dos Patos está em tempo real?",
      answer:
        "A página mostra a leitura mais recente recebida da fonte selecionada, sempre com horário e estado de atualização. Enquanto a página estiver aberta, o portal tenta atualizar a leitura a cada minuto, mas a frequência real de novas medições depende de cada fonte.",
    },
    {
      question: "Por que a fonte da leitura pode mudar?",
      answer:
        "O LabHidroSens/UFPel permanece como fonte principal enquanto entrega uma leitura atualizada. Quando essa leitura fica atrasada ou indisponível, a rede CIEX/FURG pode assumir temporariamente como leitura local de Pelotas. Essa troca é mostrada na interface e nunca mistura as séries.",
    },
    {
      question: "A medição exibida no Laranjal vem da estação ANA 87955001?",
      answer:
        "A fonte usada na medição fica identificada no topo. A estação 87955001 aparece nesta página como cadastro da Rede Hidrometeorológica Nacional, mas sua medição não entra no número principal enquanto a referência vertical não estiver confirmada.",
    },
    {
      question: "O que representa o número exibido para o Laranjal?",
      answer:
        "Ele representa a medição da fonte identificada no cartão. No LabHidroSens, o número usa a referência própria da Estação Laranjal. Na leitura alternativa CIEX/FURG, o valor vem do sensor Pelotas e permanece ligado ao referencial vertical brasileiro informado pela rede, o Marégrafo de Imbituba/SC.",
    },
    {
      question: "Com que frequência o nível é atualizado?",
      answer:
        "Enquanto a página estiver aberta, o Tempo Pelotas tenta buscar uma leitura nova a cada minuto e também quando a aba volta a ficar visível. Isso não significa que a estação gere um valor novo a cada minuto: o horário da medição mostra quando a fonte realmente publicou o ponto.",
    },
    {
      question: "Um valor alto confirma inundação no Laranjal?",
      answer:
        "Não por si só. O impacto depende da referência usada, da evolução, do vento, da drenagem e das condições em cada trecho. Use os comunicados das autoridades para decisões de segurança.",
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
      description:
        "Veja temperatura, chuva, vento e a tendência de 7 dias para um ponto de referência na orla, sem confundir previsão com nível da Lagoa.",
    },
    {
      label: "Situação das águas em Pelotas",
      href: "/situacao-hidrologica-pelotas" as const,
      description: "Compare a medição local com outros pontos da Lagoa e do Guaíba.",
    },
    {
      label: "Nível do Guaíba",
      href: "/nivel-do-guaiba" as const,
      description:
        "Acompanhe Cais Mauá e Gasômetro preservando as referências próprias de cada estação.",
    },
    {
      label: "Enchente de 1941 em Pelotas",
      href: "/enchente-1941-pelotas" as const,
      description:
        "Veja a referência histórica documentada no São Gonçalo e por que ela não é cota da Estação Laranjal.",
    },
    {
      label: "Enchente de 2024 em Pelotas e no Laranjal",
      href: "/enchente-2024-pelotas-laranjal" as const,
      description:
        "Consulte a linha do tempo da cheia de 2024 e o contexto hidrológico regional daquele evento.",
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
          "Estação ANA 87955001",
          "Praia do Laranjal",
          "LabHidroSens / UFPel",
          "CIEX/FURG",
          "Rede de Monitoramento do Nível da Lagoa dos Patos",
          "Marégrafo de Imbituba",
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
      <AnaRhnLaranjalStationProfile data={data.anaRhnProfile} />
      <LaranjalEmbedGuide />
      <EditorialContentSection id="como-interpretar-nivel-laranjal" content={LARANJAL_PAGE_CONTENT} />
    </div>
  );
}
