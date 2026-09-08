import { fetchSelectedLaranjalLevelData } from "./hydrology/laranjal-level-source.server";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "./site-config";
import { fetchWeatherIntelligence } from "./weather/weather-intelligence.server";

const LOCATION = {
  city: "Pelotas",
  state: "RS",
  country: "BR",
  latitude: -31.7654,
  longitude: -52.3376,
  timezone: "America/Sao_Paulo",
} as const;

function formatMetric(value: number | null, unit: string) {
  return value === null ? "indisponível" : `${value}${unit}`;
}

function latestTimestamp(values: Array<string | null>) {
  return values.filter((value): value is string => value !== null).sort().at(-1) ?? null;
}

function publicCurrentObservation(
  observation: Awaited<ReturnType<typeof fetchWeatherIntelligence>>["weather"]["observation"],
) {
  return {
    status: observation.status,
    station: observation.station,
    current: observation.current,
    rain: observation.rain,
    source: observation.source,
    error: observation.error,
  };
}

function publicLaranjalLevel(level: Awaited<ReturnType<typeof fetchSelectedLaranjalLevelData>>) {
  return {
    status: level.status,
    current_level_m: level.currentLevel,
    updated_at: level.updatedAt,
    age_minutes: level.ageMinutes,
    trend_cm_per_hour: level.trendCmPerHour,
    change_1h_cm: level.change1hCm,
    change_6h_cm: level.change6hCm,
    change_24h_cm: level.change24hCm,
    period_average_m: level.periodAverage,
    period_minimum_m: level.periodMinimum,
    period_maximum_m: level.periodMaximum,
    series: level.series,
    source: level.source,
  };
}

function laranjalInterpretation(
  level: Awaited<ReturnType<typeof fetchSelectedLaranjalLevelData>>,
) {
  if (level.source.role === "contingency") {
    return `Leitura local alternativa de ${level.source.station}, fornecida por ${level.source.name}. A série mantém ${level.source.reference ?? "a referência declarada pela fonte"} e não é convertida para a referência da Estação Laranjal.`;
  }

  return "Medição local da Estação Laranjal. A leitura representa esse ponto específico e deve ser interpretada junto com chuva, vento e orientações oficiais.";
}

export async function fetchPublicPortalSnapshot() {
  const [weatherIntelligence, laranjalLevel] = await Promise.all([
    fetchWeatherIntelligence(),
    fetchSelectedLaranjalLevelData({ deadlineMs: 2_500 }),
  ]);
  const { weather, brief, intelligence } = weatherIntelligence;

  return {
    schema_version: "2.1",
    generated_at: new Date().toISOString(),
    location: LOCATION,
    status: weather.status,
    summary: brief,
    weather: {
      current: weather.current,
      current_provenance: weather.currentProvenance,
      hourly: weather.hourly,
      daily: weather.daily,
      alerts: weather.alerts,
      official_forecast: weather.officialForecast,
      observed: {
        defesa_civil_rs: {
          ...publicCurrentObservation(weather.observation),
          usable_as_current: weather.quality.currentSource === "defesa-civil-rs",
        },
      },
      quality: weather.quality,
      sources: weather.sources,
      source: weather.source,
      message: weather.message,
      summary_generation: {
        origin: intelligence.origin,
        generated_at: intelligence.generatedAt,
      },
    },
    hydrology: {
      status: laranjalLevel.status === "unavailable" ? "unavailable" : "contextual-monitoring",
      local_level: {
        laranjal: publicLaranjalLevel(laranjalLevel),
        interpretation: laranjalInterpretation(laranjalLevel),
      },
      system_note:
        "O nível da Lagoa dos Patos em Pelotas depende de chuva, vento, contribuições das bacias, Canal São Gonçalo e escoamento pela Barra de Rio Grande.",
    },
    links: {
      home: absoluteUrl("/"),
      today: absoluteUrl("/tempo-hoje-pelotas"),
      forecast: absoluteUrl("/previsao-7-dias-pelotas"),
      alerts: absoluteUrl("/alertas"),
      monitoring_network: absoluteUrl("/situacao-hidrologica-pelotas"),
      hydrology: absoluteUrl("/situacao-hidrologica-pelotas"),
      laranjal_level: absoluteUrl("/nivel-da-lagoa-dos-patos-laranjal"),
      data_sources: absoluteUrl("/status-dos-dados"),
      feed: absoluteUrl("/feed"),
      public_data: absoluteUrl("/pelotas.json"),
    },
    disclaimer:
      "Informação comunitária. Os dados não substituem alertas, boletins ou orientações da Defesa Civil e das autoridades competentes.",
  };
}

export type PublicPortalSnapshot = Awaited<ReturnType<typeof fetchPublicPortalSnapshot>>;

export function createPublicJsonFeed(snapshot: PublicPortalSnapshot) {
  const current = snapshot.weather.current;
  const today = snapshot.weather.daily[0];
  const observation = snapshot.weather.observed.defesa_civil_rs;
  const laranjal = snapshot.hydrology.local_level.laranjal;
  const activeAlerts = snapshot.weather.alerts.filter((alert) => alert.period === "active");
  const alertModifiedAt = latestTimestamp(activeAlerts.map((alert) => alert.sentAt ?? alert.startsAt));

  const currentTitle =
    current?.temperature === null || current?.temperature === undefined
      ? snapshot.summary.headline
      : `Tempo em Pelotas: ${current.temperature} °C${current.condition ? ` e ${current.condition.toLowerCase()}` : ""}`;
  const forecastDetails = today
    ? ` Hoje, mínima de ${today.min} °C, máxima de ${today.max} °C e ${today.rainChance === null ? `${today.precipitationMm} mm de precipitação previstos` : `${today.rainChance}% de chance de chuva`}.`
    : "";
  const observationText =
    !observation.usable_as_current || !current
      ? "A rede estadual não forneceu uma estação meteorológica recente e verificável para uso como condição atual."
      : `A estação ${observation.station.name}${observation.station.code ? ` (${observation.station.code})` : ""} da Defesa Civil RS informou ${formatMetric(current.temperature, " °C")}, umidade de ${formatMetric(current.humidity, "%")}, vento médio de ${formatMetric(current.windSpeed, " km/h")} e rajada de ${formatMetric(current.windGust, " km/h")}.`;
  const alertText =
    activeAlerts.length === 0
      ? "Nenhum alerta oficial ativo para Pelotas ou contexto regional foi identificado na consulta atual."
      : `${activeAlerts.length} alerta${activeAlerts.length === 1 ? " oficial ativo" : "s oficiais ativos"}: ${activeAlerts.map((alert) => alert.event).join("; ")}.`;
  const laranjalText =
    laranjal.status === "unavailable"
      ? "A leitura local do nível da Lagoa dos Patos está temporariamente indisponível."
      : `A última leitura conhecida de ${laranjal.source.station}, por ${laranjal.source.name}, é de ${formatMetric(laranjal.current_level_m, " m")}${laranjal.age_minutes === null ? "" : `, com idade de ${laranjal.age_minutes} minutos`}.`;
  const laranjalTitle =
    laranjal.source.role === "contingency"
      ? "Nível da Lagoa dos Patos em Pelotas"
      : "Nível da Lagoa dos Patos na Estação Laranjal";

  return {
    version: "https://jsonfeed.org/version/1.1",
    title: SITE_NAME,
    home_page_url: absoluteUrl("/"),
    feed_url: absoluteUrl("/feed"),
    description: SITE_DESCRIPTION,
    language: "pt-BR",
    items: [
      {
        id: absoluteUrl("/tempo-hoje-pelotas"),
        url: absoluteUrl("/tempo-hoje-pelotas"),
        title: currentTitle,
        content_text: `${snapshot.summary.summary}${forecastDetails}`,
        tags: ["tempo", "Pelotas", "previsão", "chuva", "vento"],
      },
      {
        id: absoluteUrl("/alertas"),
        url: absoluteUrl("/alertas"),
        title:
          activeAlerts.length > 0
            ? "Alertas meteorológicos ativos"
            : "Monitoramento de alertas oficiais",
        content_text: alertText,
        ...(alertModifiedAt ? { date_modified: alertModifiedAt } : {}),
        tags: ["INMET", "alertas", "Pelotas", "Defesa Civil"],
      },
      {
        id: absoluteUrl("/situacao-hidrologica-pelotas"),
        url: absoluteUrl("/situacao-hidrologica-pelotas"),
        title: "Rede de Monitoramento Hidrometeorológico da Defesa Civil RS",
        content_text: observationText,
        ...(observation.source.observedAt ? { date_modified: observation.source.observedAt } : {}),
        tags: ["Defesa Civil RS", "observação", "Pelotas", "monitoramento hidrometeorológico"],
      },
      {
        id: absoluteUrl("/nivel-da-lagoa-dos-patos-laranjal"),
        url: absoluteUrl("/nivel-da-lagoa-dos-patos-laranjal"),
        title: laranjalTitle,
        content_text: `${laranjalText} Acompanhe a tendência local junto com o contexto meteorológico e as orientações oficiais.`,
        ...(laranjal.updated_at ? { date_modified: laranjal.updated_at } : {}),
        tags: ["hidrologia", "Lagoa dos Patos", "Laranjal", "Pelotas"],
      },
      {
        id: absoluteUrl("/status-dos-dados"),
        url: absoluteUrl("/status-dos-dados"),
        title: "Dados e fontes do Tempo Pelotas",
        content_text: "Origem, uso e estado atual das fontes publicadas pelo portal.",
        tags: ["dados", "fontes", "status", "Tempo Pelotas"],
      },
    ],
  };
}
