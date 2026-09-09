import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CloudRain,
  Gauge,
  Info,
  RefreshCw,
  Thermometer,
  Wind,
} from "lucide-react";
import type { CSSProperties } from "react";

import { InternalPageChapters } from "@/components/weather/InternalWeatherWidgets";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { DailyForecast } from "@/lib/weather/types";
import { WeatherIcon } from "@/production/components/weather-icon";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./SevenDayForecastPageV2.css";

const chapters = [
  { href: "#semana-dia-a-dia", label: "Dia a dia", detail: "Temperatura, chuva e rajadas" },
  { href: "#tendencia-semanal", label: "Temperaturas", detail: "Mínimas e máximas" },
  { href: "#riscos-da-semana", label: "Chuva e vento", detail: "Maiores valores" },
  { href: "#contexto-regional-semanal", label: "INMET e UFPel", detail: "Previsões publicadas" },
];

type DayTone = "stable" | "attention" | "high";

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

function rainScore(day: DailyForecast) {
  return (day.rainChance ?? 0) + day.precipitationMm * 4;
}

function hasPositiveRain(day: DailyForecast) {
  return (day.rainChance ?? 0) > 0 || day.precipitationMm > 0;
}

function hasPositiveGust(day: DailyForecast) {
  return (day.windGust ?? 0) > 0;
}

function dayTone(day: DailyForecast): DayTone {
  if ((day.rainChance ?? 0) >= 70 || day.precipitationMm >= 15 || (day.windGust ?? 0) >= 60) {
    return "high";
  }
  if ((day.rainChance ?? 0) >= 35 || day.precipitationMm >= 4 || (day.windGust ?? 0) >= 35) {
    return "attention";
  }
  return "stable";
}

function toneLabel(tone: DayTone) {
  if (tone === "high") return "Mais chuva/vento";
  if (tone === "attention") return "Acompanhar";
  return null;
}

function formatRainChance(day: DailyForecast) {
  return day.rainChance === null ? "Não informada" : `${day.rainChance}%`;
}

function formatGust(day: DailyForecast) {
  if (day.windGust === null) return "Não informada";
  if (day.windGust <= 0) return "Sem rajadas";
  return `${day.windGust} km/h`;
}

function ForecastUnavailable() {
  return (
    <section className="seven-day-v2-unavailable" aria-labelledby="seven-day-v2-unavailable-title">
      <RefreshCw aria-hidden="true" />
      <div>
        <h2 id="seven-day-v2-unavailable-title">A previsão de 7 dias está em atualização</h2>
        <p>Ainda não há dados suficientes para mostrar os próximos dias.</p>
      </div>
      <Link to="/tempo-hoje-pelotas">
        Ver o tempo de hoje <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}

export function SevenDayForecastPageV2({ data }: { data: WeatherIntelligenceData }) {
  const recoveredData = useOpenMeteoIntelligenceRecovery(data);
  const weather = recoveredData.weather;
  const days = weather.daily.slice(0, 7);

  if (days.length === 0) return <ForecastUnavailable />;

  const minimum = Math.min(...days.map((day) => day.min));
  const maximum = Math.max(...days.map((day) => day.max));
  const temperatureSpan = Math.max(1, maximum - minimum);
  const warmestDays = days.filter((day) => day.max === maximum);
  const coldestDays = days.filter((day) => day.min === minimum);
  const rainRanking = [...days]
    .filter(hasPositiveRain)
    .sort((a, b) => rainScore(b) - rainScore(a))
    .slice(0, 3);
  const windRanking = [...days]
    .filter(hasPositiveGust)
    .sort((a, b) => (b.windGust ?? 0) - (a.windGust ?? 0))
    .slice(0, 3);
  const hasPublishedGust = days.some((day) => day.windGust !== null);
  const officialPeriods = weather.inmetForecast.slice(0, 5);
  const regionalDays = weather.officialForecast.slice(0, 5);
  const hasOfficialContext = officialPeriods.length > 0 || regionalDays.length > 0;

  return (
    <div className="seven-day-v2-page">
      <InternalPageChapters items={chapters} label="Navegação da previsão de sete dias" />

      <section
        className="seven-day-v2-days"
        id="semana-dia-a-dia"
        aria-labelledby="seven-day-v2-days-title"
      >
        <header>
          <div>
            <h2 id="seven-day-v2-days-title">Previsão dos próximos 7 dias</h2>
          </div>
          <Link to="/tempo-hoje-pelotas">Hoje em detalhes</Link>
        </header>

        <div className="seven-day-v2-days__grid">
          {days.map((day, index) => {
            const tone = dayTone(day);
            const badge = index === 0 ? "Hoje" : index === 1 ? "Amanhã" : toneLabel(tone);
            return (
              <article className={`tone-${tone}${index === 0 ? " is-today" : ""}`} key={`${day.weekday}-${day.date}`}>
                <header>
                  <div>
                    <strong>{day.weekday}</strong>
                    <span>{day.date}</span>
                  </div>
                  {badge ? <b>{badge}</b> : null}
                </header>

                <div className="seven-day-v2-days__condition">
                  <WeatherIcon name={day.icon} title={`Condição prevista para ${day.weekday}`} />
                  <strong>{day.min}° <span>/</span> {day.max}°</strong>
                </div>

                <dl>
                  <div>
                    <dt><CloudRain aria-hidden="true" /> Chuva</dt>
                    <dd>{formatRainChance(day)}</dd>
                    <small>{day.precipitationMm} mm</small>
                  </div>
                  <div>
                    <dt><Wind aria-hidden="true" /> Rajadas</dt>
                    <dd>{formatGust(day)}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="seven-day-v2-trend"
        id="tendencia-semanal"
        aria-labelledby="seven-day-v2-trend-title"
      >
        <header>
          <div>
            <h2 id="seven-day-v2-trend-title">Temperaturas nos próximos 7 dias</h2>
          </div>
        </header>

        <div className="seven-day-v2-trend__list">
          {days.map((day) => {
            const low = ((day.min - minimum) / temperatureSpan) * 100;
            const span = Math.max(4, ((day.max - day.min) / temperatureSpan) * 100);
            const style = {
              "--week-low": `${low}%`,
              "--week-span": `${Math.min(span, 100 - low)}%`,
            } as CSSProperties;

            return (
              <article key={`${day.weekday}-${day.date}-trend`}>
                <strong>{day.weekday}</strong>
                <div>
                  <span>{day.min}°</span>
                  <i style={style} aria-label={`Faixa de ${day.min} a ${day.max} graus`}><b /></i>
                  <span>{day.max}°</span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="seven-day-v2-trend__facts">
          <article>
            <Thermometer aria-hidden="true" />
            <span>Maior máxima</span>
            <strong>
              {warmestDays.length === 1
                ? `${warmestDays[0]?.weekday} · ${maximum}°`
                : `${maximum}° · empate em ${warmestDays.length} dias`}
            </strong>
          </article>
          <article>
            <Thermometer aria-hidden="true" />
            <span>Menor mínima</span>
            <strong>
              {coldestDays.length === 1
                ? `${coldestDays[0]?.weekday} · ${minimum}°`
                : `${minimum}° · empate em ${coldestDays.length} dias`}
            </strong>
          </article>
          <article>
            <Gauge aria-hidden="true" />
            <span>Diferença entre extremos</span>
            <strong>{maximum - minimum}°</strong>
          </article>
        </div>
      </section>

      <section
        className="seven-day-v2-risks"
        id="riscos-da-semana"
        aria-labelledby="seven-day-v2-risks-title"
      >
        <header>
          <div>
            <h2 id="seven-day-v2-risks-title">Chuva e rajadas nos próximos 7 dias</h2>
          </div>
        </header>

        <div className="seven-day-v2-risks__grid">
          <article className="is-rain">
            <div className="seven-day-v2-risks__title">
              <CloudRain aria-hidden="true" />
              <span><strong>Maiores chances e volumes de chuva</strong></span>
            </div>
            {rainRanking.length ? (
              <ol>
                {rainRanking.map((day) => (
                  <li key={`${day.weekday}-rain`}>
                    <span><strong>{day.weekday}</strong><small>{day.precipitationMm} mm</small></span>
                    <b>{formatRainChance(day)}</b>
                  </li>
                ))}
              </ol>
            ) : <p>Sem chuva prevista nos valores atuais.</p>}
            <Link to="/chuva-em-pelotas">Ver chuva por horário <ArrowRight aria-hidden="true" /></Link>
          </article>

          <article className="is-wind">
            <div className="seven-day-v2-risks__title">
              <Wind aria-hidden="true" />
              <span><strong>Rajadas mais fortes</strong></span>
            </div>
            {windRanking.length ? (
              <ol>
                {windRanking.map((day) => (
                  <li key={`${day.weekday}-wind`}>
                    <span><strong>{day.weekday}</strong></span>
                    <b>{formatGust(day)}</b>
                  </li>
                ))}
              </ol>
            ) : (
              <p>
                {hasPublishedGust
                  ? "Sem rajadas previstas nos próximos dias."
                  : "As rajadas ainda não foram informadas."}
              </p>
            )}
            <Link to="/vento-em-pelotas">Ver vento e rajadas <ArrowRight aria-hidden="true" /></Link>
          </article>
        </div>
      </section>

      <section
        className="seven-day-v2-official"
        id="contexto-regional-semanal"
        aria-labelledby="seven-day-v2-official-title"
      >
        <header>
          <div>
            <h2 id="seven-day-v2-official-title">INMET e UFPel nos próximos dias</h2>
          </div>
          <Link to="/status-dos-dados">Sobre as fontes</Link>
        </header>

        {hasOfficialContext ? (
          <div className="seven-day-v2-official__grid">
            <article>
              <span>Instituto Nacional de Meteorologia</span>
              <strong>Pelotas</strong>
              <ul>
                {officialPeriods.map((period) => (
                  <li key={period.id}><span>{period.period}</span><p>{period.summary || "Em atualização"}</p></li>
                ))}
              </ul>
            </article>
            <article className="is-regional">
              <span>Centro de Pesquisas e Previsões Meteorológicas da UFPel</span>
              <strong>Região de Pelotas</strong>
              {regionalDays.length ? (
                <ul>
                  {regionalDays.map((day) => (
                    <li key={`${day.day}-${day.summary}`}><span>{day.day}</span><p>{day.summary || day.text || "Em atualização"}</p></li>
                  ))}
                </ul>
              ) : <p>Sem previsão publicada para os próximos dias.</p>}
            </article>
          </div>
        ) : (
          <div className="seven-day-v2-official__unavailable">
            <Info aria-hidden="true" />
            <div><strong>Sem previsão do INMET ou da UFPel para este período</strong></div>
          </div>
        )}
      </section>

      <nav className="seven-day-v2-related" aria-label="Outras previsões de Pelotas">
        <Link to="/tempo-hoje-pelotas"><span><strong>Tempo hoje em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/tempo-amanha-pelotas"><span><strong>Tempo amanhã em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/chuva-em-pelotas"><span><strong>Chuva por horário</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/vento-em-pelotas"><span><strong>Vento em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
      </nav>

      <aside className="seven-day-v2-source-note" aria-label="Origem e atualização da previsão">
        <Info aria-hidden="true" />
        <p>
          Atualizado em {formatDateTime(weather.source.fetchedAt)} · Fonte principal: {weather.quality.forecastProvider ?? "modelo meteorológico disponível"}.
        </p>
      </aside>
    </div>
  );
}
