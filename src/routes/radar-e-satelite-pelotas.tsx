import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { RadarForecastContext } from "@/components/redemet/RadarForecastContext";
import { RedemetDerivedContext } from "@/components/redemet/RedemetDerivedContext";
import { RedemetOverview } from "@/components/redemet/RedemetOverview";
import { RADAR_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { loadRadarPageData } from "@/lib/redemet/radar-page-loader";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { useRedemetOverviewBrowserRecovery } from "@/production/lib/redemet-browser-recovery";
import { useWeatherIntelligenceBrowserRecovery } from "@/production/lib/weather-intelligence-browser-recovery";

const PAGE_TITLE = "Radar de chuva e satélite em Pelotas: imagens recentes";
const PAGE_DESCRIPTION =
  "Veja as imagens mais recentes de radar e satélite para a região de Pelotas, horários reais das coletas e registros de raios da REDEMET/DECEA.";
const PAGE_PATH = "/radar-e-satelite-pelotas";

const RADAR_PAGE_CONTENT = {
  ...RADAR_EDITORIAL_CONTENT,
  eyebrow: "Entenda as imagens",
  title: "Radar, satélite e raios mostram partes diferentes do tempo",
  answer:
    "O radar ajuda a localizar áreas de chuva. O satélite mostra as nuvens. Os registros de descargas elétricas mostram onde houve raios detectados. Em todos os blocos, confira o horário da coleta antes de interpretar a situação.",
  facts: [
    "Os horários exibidos vêm das próprias coletas recebidas das fontes.",
    "Radar mostra áreas associadas à chuva, mas não confirma sozinho chuva em uma rua ou bairro.",
    "Nuvens vistas pelo satélite não significam necessariamente chuva no solo.",
    "Raios detectados não substituem os avisos oficiais de risco.",
  ],
  faqs: [
    {
      question: "Onde vejo o radar de chuva de Pelotas?",
      answer:
        "A imagem mais recente aparece no bloco Radar. O horário mostrado abaixo da imagem indica quando aquela coleta foi registrada.",
    },
    {
      question: "As imagens desta página são reais?",
      answer:
        "Sim. A página mostra imagens e registros recebidos das fontes identificadas em cada bloco. Quando uma coleta não chega, o portal mostra esse estado em vez de inventar uma imagem ou um horário.",
    },
    {
      question: "Como usar a sequência de imagens?",
      answer:
        "Use os controles para voltar ou avançar entre as coletas recebidas. A sequência mostra o que aconteceu nos horários disponíveis e não é uma previsão do movimento futuro.",
    },
    {
      question: "O radar mostra se está chovendo no meu bairro?",
      answer:
        "Não com precisão de endereço. O radar oferece uma visão regional. Para saber o que acontece no seu ponto, compare com observação local, previsão e avisos oficiais.",
    },
    {
      question: "Nuvens no satélite significam chuva?",
      answer:
        "Não necessariamente. O satélite mostra nuvens. A presença de chuva deve ser avaliada junto com radar, previsão e observações locais.",
    },
    {
      question: "Um raio detectado é um alerta meteorológico?",
      answer:
        "Não. Ele indica atividade elétrica detectada em um horário e local. Para risco e orientação de segurança, consulte os avisos oficiais.",
    },
  ],
  relatedLinks: [
    {
      label: "Chuva em Pelotas",
      href: "/chuva-em-pelotas" as const,
      description: "Veja chance e volume de chuva previstos por horário.",
    },
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Veja temperatura, chuva, vento e mudanças nas próximas horas.",
    },
    {
      label: "Vento e rajadas em Pelotas",
      href: "/vento-em-pelotas" as const,
      description: "Confira direção, velocidade e rajadas previstas.",
    },
    {
      label: "Avisos oficiais",
      href: "/alertas" as const,
      description: "Consulte os avisos oficiais válidos para Pelotas.",
    },
  ],
};

export const Route = createFileRoute("/radar-e-satelite-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Radar e satélite em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Radar de chuva em Pelotas",
          "Imagem de radar mais recente para Pelotas",
          "Imagens de satélite sobre Pelotas",
          "Raios e trovoadas na região de Pelotas",
          "REDEMET e INMET",
          "Horário das imagens meteorológicas",
          "Sequência de imagens de radar",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, RADAR_PAGE_CONTENT.faqs),
    ]),
  loader: () => loadRadarPageData(),
  staleTime: 60 * 1_000,
  component: RedemetPage,
});

function RedemetPage() {
  const baseline = Route.useLoaderData();
  const { data: redemet, isRecovering } = useRedemetOverviewBrowserRecovery(baseline.redemet);
  const weather = useWeatherIntelligenceBrowserRecovery(baseline.weather);

  return (
    <div className="radar-satellite-page">
      <RedemetOverview data={redemet} isRefreshing={isRecovering} />
      <RedemetDerivedContext data={redemet} />
      <RadarForecastContext radar={redemet.radar} weather={weather} />
      <EditorialContentSection
        id="como-interpretar-radar-satelite"
        content={RADAR_PAGE_CONTENT}
      />
    </div>
  );
}
