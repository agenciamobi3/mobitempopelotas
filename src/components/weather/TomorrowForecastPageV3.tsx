import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  CloudRain,
  Gauge,
  RefreshCw,
  Thermometer,
  TriangleAlert,
  Wind,
  type LucideIcon,
} from "lucide-react";

import { InternalPageChapters } from "@/components/weather/InternalWeatherWidgets";
import { localForecastDateKey } from "@/lib/weather/daily-temperature-reconciliation";
import type { CppmetForecastItem, InmetForecastPeriod } from "@/lib/weather/official-sources.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { DailyForecast } from "@/lib/weather/types";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./TomorrowForecastPageV3.css";

type PlanningCard = {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "normal" | "attention";
};

function officialContextLabel(hasInmet: boolean, hasCppmet: boolean) {
  if (hasInmet && hasCppmet) return "INMET e UFPel";
  if (hasInmet) return "INMET";
  return "UFPel";
}

function buildChapters(officialLabel: string | null) {
  return [
    { href: "#resumo-amanha", label: "Resumo", detail: "Temperatura, chuva e vento" },
    { href: "#comparacao-amanha", label: "Hoje x amanhã", detail: "O que muda" },
    { href: "#planejamento-amanha", label: "Amanhã", detail: "O que observar" },
    ...(officialLabel
      ? [{ href: "#contexto-oficial-amanha", label: officialLabel, detail: "Previsões disponíveis" }]
      : []),
    { href: "#perguntas-amanha", label: "Perguntas", detail: "Respostas" },
  ];
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "horário não informado";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);
}

function rainValue(day: DailyForecast) {
  return day.rainChance === null ? "chance não informada" : `${day.rainChance}% de chance`;
}

function gustPhrase(value: number | null) {
  if (value === null) return "rajadas não informadas";
  if (value <= 0) return "sem rajadas previstas";
  return `rajadas de até ${value} km/h`;
}

function gustTitle(value: number | null) {
  if (value === null) return "Não informadas";
  if (value <= 0) return "Sem rajadas";
  return `${value} km/h`;
}

function dayWeatherSummary(day: DailyForecast) {
  return `${rainValue(day)} · ${gustPhrase(day.windGust)}`;
}

function weekdayKey(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/-feira/g, "")
    .replace(/[^a-z]/g, "");

  const aliases: Record<string, string> = {
    dom: "domingo",
    domingo: "domingo",
    seg: "segunda",
    segunda: "segunda",
    ter: "terca",
    terca: "terca",
    qua: "quarta",
    quarta: "quarta",
    qui: "quinta",
    quinta: "quinta",
    sex: "sexta",
    sexta: "sexta",
    sab: "sabado",
    sabado: "sabado",
  };

  return aliases[normalized] ?? normalized;
}

function forecastWeekdayKey(day: DailyForecast) {
  const supplied = weekdayKey(day.weekday);
  if (supplied !== "hoje" && supplied !== "amanha") return supplied;

  const dateKey = day.dateIso ?? localForecastDateKey(supplied === "amanha" ? 1 : 0);
  const parsed = new Date(`${dateKey}T12:00:00-03:00`);
  if (Number.isNaN(parsed.getTime())) return supplied;

  return weekdayKey(
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      timeZone: "America/Sao_Paulo",
    }).format(parsed),
  );
}

function findCppmetContext(
  tomorrow: DailyForecast,
  items: CppmetForecastItem[],
): CppmetForecastItem | null {
  const target = forecastWeekdayKey(tomorrow);
  return items.find((item) => weekdayKey(item.day) === target) ?? null;
}

function formatTemperatureDelta(value: number | null) {
  if (value === null) return "Sem comparação";
  if (value === 0) return "Sem mudança";
  return value > 0 ? `+${value}°` : `${value}°`;
}

function formatPercentDelta(value: number | null) {
  if (value === null) return "Sem comparação";
  if (value === 0) return "Sem mudança";
  return `${value > 0 ? "+" : ""}${value} pontos`;
}

function formatWindDelta(value: number | null) {
  if (value === null) return "Sem comparação";
  if (value === 0) return "Sem mudança";
  return `${value > 0 ? "+" : ""}${value} km/h`;
}

function tomorrowTitle(day: DailyForecast) {
  if ((day.rainChance ?? 0) >= 60 || day.precipitationMm >= 10) return "A chuva deve marcar o dia amanhã";
  if ((day.windGust ?? 0) >= 50) return "Atenção para as rajadas amanhã";
  if (day.max <= 18) return "Amanhã deve seguir frio";
  if (day.max >= 30) return "Amanhã deve ser quente";
  if (day.max - day.min >= 10) return "A manhã deve começar mais fria que a tarde";
  return "Temperatura, chuva e vento para amanhã";
}

function tomorrowSummary(day: DailyForecast) {
  const rain =
    day.rainChance === null
      ? `${day.precipitationMm} mm previstos`
      : `${day.rainChance}% de chance de chuva e ${day.precipitationMm} mm previstos`;

  return `Mínima de ${day.min}° e máxima de ${day.max}°. ${rain}. ${gustPhrase(day.windGust)}.`;
}

function buildPlanningCards(day: DailyForecast): PlanningCard[] {
  const amplitude = Math.max(0, day.max - day.min);
  const temperatureDescription =
    day.max >= 30
      ? "Se ficar ao ar livre, prefira os horários menos quentes e leve água."
      : day.max <= 18
        ? "Leve agasalho nos deslocamentos."
        : amplitude >= 10
          ? "A manhã pode ser bem mais fria que a tarde. Roupa em camadas ajuda."
          : "A diferença entre mínima e máxima deve ser pequena.";

  const rainDescription =
    day.rainChance === null
      ? `${day.precipitationMm} mm previstos. A chance percentual não foi informada.`
      : day.rainChance >= 60 || day.precipitationMm >= 10
        ? `${day.rainChance}% de chance e ${day.precipitationMm} mm previstos. Leve guarda-chuva ou capa.`
        : day.rainChance >= 30
          ? `${day.rainChance}% de chance de chuva. Vale sair preparado.`
          : day.precipitationMm > 0
            ? `${day.rainChance}% de chance e ${day.precipitationMm} mm previstos.`
            : `${day.rainChance}% de chance, sem volume relevante previsto.`;

  const windDescription =
    day.windGust === null
      ? "Sem estimativa de rajadas para amanhã."
      : day.windGust <= 0
        ? "Sem rajadas previstas."
        : day.windGust >= 50
          ? `Rajadas de até ${day.windGust} km/h. Cuidado com objetos soltos e atividades ao ar livre.`
          : day.windGust >= 35
            ? `Rajadas de até ${day.windGust} km/h, mais sentidas em áreas abertas e no Laranjal.`
            : `Rajadas de até ${day.windGust} km/h.`;

  return [
    {
      label: "Temperatura",
      title: `${day.min}° a ${day.max}°`,
      description: temperatureDescription,
      icon: Thermometer,
      tone: day.max >= 30 || day.max <= 18 || amplitude >= 10 ? "attention" : "normal",
    },
    {
      label: "Chuva",
      title: day.rainChance === null ? `${day.precipitationMm} mm` : `${day.rainChance}%`,
      description: rainDescription,
      icon: CloudRain,
      tone: (day.rainChance ?? 0) >= 60 || day.precipitationMm >= 10 ? "attention" : "normal",
    },
    {
      label: "Rajadas",
      title: gustTitle(day.windGust),
      description: windDescription,
      icon: Wind,
      tone: (day.windGust ?? 0) >= 35 ? "attention" : "normal",
    },
    {
      label: "Atualização",
      title: "Confira amanhã cedo",
      description: "A previsão pode mudar durante a noite.",
      icon: RefreshCw,
      tone: "normal",
    },
  ];
}

function ForecastUnavailable() {
  return (
    <section className="tomorrow-v3-unavailable" aria-labelledby="tomorrow-v3-unavailable-title">
      <RefreshCw aria-hidden="true" />
      <div>
        <h2 id="tomorrow-v3-unavailable-title">Ainda não há previsão detalhada para amanhã</h2>
        <p>Enquanto isso, veja os próximos dias.</p>
      </div>
      <Link to="/previsao-7-dias-pelotas">
        Ver previsão de 7 dias <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}

export function TomorrowForecastPageV3({ data }: { data: WeatherIntelligenceData }) {
  const recoveredData = useOpenMeteoIntelligenceRecovery(data);
  const weather = recoveredData.weather;
  const today = weather.daily[0] ?? null;
  const tomorrow = weather.daily[1] ?? null;

  if (!tomorrow) return <ForecastUnavailable />;

  const amplitude = Math.max(0, tomorrow.max - tomorrow.min);
  const maximumDelta = today ? tomorrow.max - today.max : null;
  const minimumDelta = today ? tomorrow.min - today.min : null;
  const rainDelta =
    today && today.rainChance !== null && tomorrow.rainChance !== null
      ? tomorrow.rainChance - today.rainChance
      : null;
  const gustDelta =
    today && today.windGust !== null && tomorrow.windGust !== null
      ? tomorrow.windGust - today.windGust
      : null;
  const planningCards = buildPlanningCards(tomorrow);
  const tomorrowDate = tomorrow.dateIso ?? localForecastDateKey(1);
  const inmetPeriods = weather.inmetForecast
    .filter((period) => period.date?.slice(0, 10) === tomorrowDate)
    .slice(0, 3);
  const cppmetContext = findCppmetContext(tomorrow, weather.officialForecast);
  const hasInmetContext = inmetPeriods.length > 0;
  const hasCppmetContext = Boolean(cppmetContext);
  const hasOfficialContext = hasInmetContext || hasCppmetContext;
  const officialLabel = hasOfficialContext
    ? officialContextLabel(hasInmetContext, hasCppmetContext)
    : null;
  const chapters = buildChapters(officialLabel);
  const faqs = [
    {
      question: "Qual será a temperatura amanhã em Pelotas?",
      answer: `Mínima de ${tomorrow.min}°C e máxima de ${tomorrow.max}°C.`,
    },
    {
      question: "Vai chover amanhã em Pelotas?",
      answer:
        tomorrow.rainChance === null
          ? `${tomorrow.precipitationMm} mm previstos para o dia. A chance percentual não foi informada.`
          : `${tomorrow.rainChance}% de chance e ${tomorrow.precipitationMm} mm previstos para o dia.`,
    },
    {
      question: "Como estará o vento amanhã?",
      answer:
        tomorrow.windGust === null
          ? "As rajadas ainda não foram informadas."
          : tomorrow.windGust <= 0
            ? "Sem rajadas previstas."
            : `Rajadas de até ${tomorrow.windGust} km/h.`,
    },
  ];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="tomorrow-v3-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />

      <InternalPageChapters items={chapters} label="Previsão de amanhã" />

      <section
        className="tomorrow-v3-overview"
        id="resumo-amanha"
        aria-labelledby="tomorrow-v3-overview-title"
      >
        <div className="tomorrow-v3-overview__intro">
          <h2 id="tomorrow-v3-overview-title">{tomorrowTitle(tomorrow)}</h2>
          <p>{tomorrowSummary(tomorrow)}</p>
        </div>

        <div className="tomorrow-v3-overview__cards">
          <article>
            <CheckCircle2 aria-hidden="true" />
            <div>
              <span>Temperatura</span>
              <strong>{tomorrow.min}° a {tomorrow.max}°</strong>
              <small>Variação de {amplitude}° entre mínima e máxima.</small>
            </div>
          </article>
          <article className="is-caution">
            <TriangleAlert aria-hidden="true" />
            <div>
              <span>Chuva e vento</span>
              <strong>{rainValue(tomorrow)} · {gustTitle(tomorrow.windGust)}</strong>
              <small>{tomorrow.precipitationMm} mm previstos para o dia.</small>
            </div>
          </article>
        </div>
      </section>

      <section
        className="tomorrow-v3-comparison"
        id="comparacao-amanha"
        aria-labelledby="tomorrow-v3-comparison-title"
      >
        <header>
          <div>
            <h2 id="tomorrow-v3-comparison-title">Hoje x amanhã</h2>
          </div>
          <Link to="/tempo-hoje-pelotas">Ver hoje</Link>
        </header>

        <div className="tomorrow-v3-comparison__days">
          <article>
            <span>Hoje</span>
            {today ? (
              <>
                <strong>{today.min}° / {today.max}°</strong>
                <small>{dayWeatherSummary(today)}</small>
              </>
            ) : (
              <><strong>Em atualização</strong><small>Sem valores para comparação.</small></>
            )}
          </article>
          <ArrowRight aria-hidden="true" />
          <article className="is-tomorrow">
            <span>Amanhã</span>
            <strong>{tomorrow.min}° / {tomorrow.max}°</strong>
            <small>{dayWeatherSummary(tomorrow)}</small>
          </article>
        </div>

        <dl className="tomorrow-v3-comparison__deltas" aria-label="Diferenças previstas entre hoje e amanhã">
          <div><dt>Máxima</dt><dd>{formatTemperatureDelta(maximumDelta)}</dd></div>
          <div><dt>Mínima</dt><dd>{formatTemperatureDelta(minimumDelta)}</dd></div>
          <div><dt>Chance de chuva</dt><dd>{formatPercentDelta(rainDelta)}</dd></div>
          <div><dt>Rajadas</dt><dd>{formatWindDelta(gustDelta)}</dd></div>
        </dl>
      </section>

      <section
        className="tomorrow-v3-planning"
        id="planejamento-amanha"
        aria-labelledby="tomorrow-v3-planning-title"
      >
        <header>
          <div>
            <h2 id="tomorrow-v3-planning-title">O que observar amanhã</h2>
          </div>
          <Link to="/previsao-7-dias-pelotas">Próximos 7 dias</Link>
        </header>

        <div className="tomorrow-v3-planning__grid">
          {planningCards.map((card) => {
            const Icon = card.icon;
            return (
              <article className={card.tone === "attention" ? "is-attention" : undefined} key={card.label}>
                <Icon aria-hidden="true" />
                <span>{card.label}</span>
                <strong>{card.title}</strong>
                <p>{card.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {hasOfficialContext && officialLabel ? (
        <section
          className="tomorrow-v3-official"
          id="contexto-oficial-amanha"
          aria-labelledby="tomorrow-v3-official-title"
        >
          <header>
            <div>
              <h2 id="tomorrow-v3-official-title">
                {hasCppmetContext && !hasInmetContext
                  ? "Previsão do Centro de Pesquisas e Previsões Meteorológicas UFPEL para amanhã"
                  : `${officialLabel} para amanhã`}
              </h2>
            </div>
          </header>

          <div className="tomorrow-v3-official__grid">
            {inmetPeriods.map((period: InmetForecastPeriod) => (
              <article key={period.id}>
                <span>INMET · {period.period}</span>
                <strong>{period.summary || "Resumo em atualização"}</strong>
                <dl>
                  <div><dt>Temperatura</dt><dd>{period.minimum === null || period.maximum === null ? "Não informada" : `${period.minimum}° / ${period.maximum}°`}</dd></div>
                  <div><dt>Umidade</dt><dd>{period.humidityMinimum === null || period.humidityMaximum === null ? "Não informada" : `${period.humidityMinimum}%–${period.humidityMaximum}%`}</dd></div>
                  <div><dt>Vento</dt><dd>{[period.windDirection, period.windIntensity].filter(Boolean).join(" · ") || "Não informado"}</dd></div>
                </dl>
              </article>
            ))}

            {cppmetContext ? (
              <article className="is-regional">
                <span>CPPMet / UFPel</span>
                <strong>{cppmetContext.summary || "Previsão regional"}</strong>
                <p>{cppmetContext.text || "Sem detalhes adicionais."}</p>
                <small>{cppmetContext.minimum === null || cppmetContext.maximum === null ? "Temperaturas não publicadas" : `${cppmetContext.minimum}° / ${cppmetContext.maximum}°`}</small>
              </article>
            ) : null}
          </div>
        </section>
      ) : null}

      <section
        className="tomorrow-v3-faq"
        id="perguntas-amanha"
        aria-labelledby="tomorrow-v3-faq-title"
      >
        <header>
          <div>
            <h2 id="tomorrow-v3-faq-title">Perguntas sobre amanhã</h2>
          </div>
        </header>
        <div>
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <nav className="tomorrow-v3-related" aria-label="Mais previsões de Pelotas">
        <Link to="/tempo-hoje-pelotas"><span><strong>Tempo hoje em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/previsao-7-dias-pelotas"><span><strong>Previsão de 7 dias</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/previsao-15-dias-pelotas"><span><strong>Previsão de 15 dias</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/chuva-em-pelotas"><span><strong>Chuva em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/vento-em-pelotas"><span><strong>Vento em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
      </nav>

      <aside className="tomorrow-v3-source-note" aria-label="Atualização da previsão">
        <Gauge aria-hidden="true" />
        <p>Atualizado em {formatDateTime(weather.source.fetchedAt)}.</p>
      </aside>
    </div>
  );
}