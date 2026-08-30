import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { RainAccumulationContext } from "@/components/weather/RainAccumulationContext";
import { RainForecastPageV2 } from "@/components/weather/RainForecastPageV2";
import { RainHourlyVolumeContext } from "@/components/weather/RainHourlyVolumeContext";
import { RainRetailHero } from "@/components/weather/RainRetailHero";
import { RAIN_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { RAIN_CITATIONS } from "@/lib/seo-source-citations";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import { loadPublicWeatherWithMeteogram } from "@/lib/weather/public-weather-page-loader";

const PAGE_TITLE = "Chuva em Pelotas hoje: acumulado, chance e previsão";
const PAGE_DESCRIPTION =
  "Veja a chuva acumulada observada em Pelotas, chance e volume previsto por horário, acumulados regionais e avisos oficiais do INMET.";
const PAGE_PATH = "/chuva-em-pelotas";

const RAIN_PAGE_CONTENT = {
  ...RAIN_EDITORIAL_CONTENT,
  eyebrow: "Entenda a chuva observada e prevista",
  title: "Como ler chuva acumulada, chance e volume previsto em Pelotas",
  answer:
    "A página separa a chuva que já foi medida da chuva que ainda é prevista. O acumulado diário da Embrapa descreve a medição na estação local; os acumulados de 24 horas da Defesa Civil pertencem a estações regionais; chance e volume futuro vêm do modelo meteorológico.",
  facts: [
    "Chuva observada e chuva prevista são informações diferentes e aparecem com fonte e período próprios.",
    "O acumulado diário da Embrapa não é somado ao volume previsto para hoje, porque as janelas podem se sobrepor.",
    "Acumulados de 24 horas da Defesa Civil RS pertencem ao ponto de cada estação e não representam automaticamente toda Pelotas.",
    "Chance de chuva responde se a precipitação pode ocorrer; milímetros estimam quanto pode acumular no período.",
    "O detalhamento horário usa dados estruturados do Open-Meteo e mantém chance percentual e volume em milímetros separados.",
    "Em risco de temporal, alagamento ou inundação, consulte os avisos oficiais e acompanhe radar e situação hidrológica.",
  ],
  faqs: [
    {
      question: "Vai chover hoje em Pelotas?",
      answer:
        "A página mostra a chance e o volume previsto por horário para hoje. Como a previsão muda com novas rodadas do modelo, confira os períodos mais próximos do horário de interesse e compare também radar e avisos oficiais quando houver instabilidade.",
    },
    {
      question: "Quanto choveu hoje em Pelotas?",
      answer:
        "A seção de chuva acumulada mostra o valor diário publicado pela estação da Embrapa Clima Temperado quando a leitura está disponível e atual. O número representa o ponto da estação, não todos os bairros de Pelotas.",
    },
    {
      question: "Posso somar a chuva observada com a previsão para hoje?",
      answer:
        "Não. O acumulado observado e o total previsto podem cobrir horas em comum. Somá-los criaria um total enganoso. Por isso, o portal mantém medição e previsão em blocos separados.",
    },
    {
      question: "O que significa 70% de chance de chuva?",
      answer:
        "Significa que a fonte estima uma chance alta de chover no local e período indicados. O percentual não informa sozinho quanto tempo a chuva deve durar nem quantos milímetros podem acumular.",
    },
    {
      question: "Chance de chuva alta significa muito volume?",
      answer:
        "Não necessariamente. A chance indica a possibilidade de ocorrência; o volume em milímetros estima a quantidade. Compare os dois valores antes de avaliar o possível impacto.",
    },
    {
      question: "O acumulado de 24 horas da Defesa Civil é a chuva de Pelotas?",
      answer:
        "Não necessariamente. Cada acumulado pertence à estação identificada e à sua janela móvel de 24 horas. Ele serve como observação regional e deve ser lido junto do nome, horário e distância da estação.",
    },
    {
      question: "O volume mostrado por hora já foi medido?",
      answer:
        "Não. O volume por hora desta página é uma previsão do modelo para cada intervalo futuro. Chuva observada só é apresentada como medição quando há uma fonte de estação ou pluviômetro identificada com horário.",
    },
  ],
  relatedLinks: [
    {
      label: "Tempo hoje em Pelotas",
      href: "/tempo-hoje-pelotas" as const,
      description: "Veja temperatura, chance de chuva e rajadas nas próximas horas.",
    },
    {
      label: "Previsão de 15 dias",
      href: "/previsao-15-dias-pelotas" as const,
      description: "Compare os próximos dias e acompanhe a tendência de precipitação em uma janela mais longa.",
    },
    {
      label: "Radar e satélite",
      href: "/radar-e-satelite-pelotas" as const,
      description: "Acompanhe a posição e o deslocamento das áreas de chuva na região.",
    },
    {
      label: "Situação das águas em Pelotas",
      href: "/situacao-hidrologica-pelotas" as const,
      description: "Relacione chuva recente com níveis observados no Laranjal e na rede regional, sem confundir previsão com nível da água.",
    },
    {
      label: "Nível da Lagoa no Laranjal",
      href: "/nivel-da-lagoa-dos-patos-laranjal" as const,
      description: "Acompanhe a leitura local, horário e tendência da Estação Laranjal.",
    },
    {
      label: "Avisos oficiais do INMET",
      href: "/alertas" as const,
      description: "Consulte validade, abrangência e orientações dos avisos para Pelotas.",
    },
  ],
};

function getObservedRainDaily(data: WeatherIntelligenceData) {
  const embrapaStatus = data.weather.sources.embrapa.status;
  return data.weather.observation.status !== "unavailable" &&
    (embrapaStatus === "live" || embrapaStatus === "partial")
    ? data.weather.observation.accumulated.rainDaily
    : null;
}

export const Route = createFileRoute("/chuva-em-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        citations: RAIN_CITATIONS,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Chuva em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Chuva acumulada em Pelotas",
          "Quanto choveu hoje em Pelotas",
          "Chuva observada pela Embrapa em Pelotas",
          "Acumulado de chuva em 24 horas",
          "Previsão de chuva em Pelotas",
          "Probabilidade de chuva em Pelotas",
          "Volume de precipitação por hora em Pelotas",
          "Chuva por hora em Pelotas",
          "Acumulado previsto de chuva em Pelotas",
          "Relação entre chuva e situação hidrológica em Pelotas",
          "Alertas oficiais de chuva em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, RAIN_PAGE_CONTENT.faqs),
    ]),
  loader: () =>
    loadPublicWeatherWithMeteogram({
      meteogramUnavailableMessage:
        "O volume de chuva por hora está temporariamente indisponível. As demais informações de chuva permanecem acessíveis quando houver dados.",
    }),
  staleTime: 5 * 60 * 1_000,
  component: ChuvaPage,
});

function ChuvaPage() {
  const { weather, meteogram } = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--rain"
      hero={({
        data: recoveredWeather,
        weather: productionWeather,
        advisoryLevel,
        officialAlertCount,
      }) => (
        <RainRetailHero
          weather={productionWeather}
          advisoryLevel={advisoryLevel}
          officialAlertCount={officialAlertCount}
          observedRainDaily={getObservedRainDaily(recoveredWeather)}
        />
      )}
    >
      {(recoveredWeather) => (
        <>
          <RainAccumulationContext data={recoveredWeather} />
          <RainForecastPageV2 data={recoveredWeather} />
          <RainHourlyVolumeContext meteogram={meteogram} />
          <EditorialContentSection
            id="como-interpretar-a-previsao-de-chuva"
            content={RAIN_PAGE_CONTENT}
          />
        </>
      )}
    </InternalWeatherPageShell>
  );
}
