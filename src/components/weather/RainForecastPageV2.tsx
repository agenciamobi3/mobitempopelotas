import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  CloudRain,
  Info,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import type { CSSProperties } from "react";

import { InternalPageChapters } from "@/components/weather/InternalWeatherWidgets";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { DailyForecast } from "@/lib/weather/types";
import { WeatherIcon } from "@/production/components/weather-icon";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./RainForecastPageV2.css";

const chapters = [
  { href: "#chuva-acumulada", label: "Acumulado", detail: "Medido" },
  { href: "#chuva-por-hora", label: "12 horas", detail: "Chance" },
  { href: "#volume-de-chuva-por-hora", label: "Volume por hora", detail: "Milímetros" },
  { href: "#chuva-na-semana", label: "7 dias", detail: "Dia a dia" },
  { href: "#contexto-oficial-da-chuva", label: "INMET", detail: "Avisos" },
];

function formatFetchedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatChance(value: number | null | undefined) {
  return value === null || value === undefined ? "Não informada" : `${value}%`;
}

function formatMillimeters(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mm`;
}

function activeAlertLabel(count: number) {
  if (count === 0) return "Nenhum aviso ativo";
  return count === 1 ? "1 aviso ativo" : `${count} avisos ativos`;
}

function officialPeriodLabel(count: number) {
  if (count === 0) return "Sem chuva mencionada";
  return count === 1 ? "1 período com chuva" : `${count} períodos com chuva`;
}

function rainScore(day: DailyForecast) {
  return (day.rainChance ?? 0) + day.precipitationMm * 4;
}

function chanceTone(value: number | null) {
  if (value === null) return "unknown";
  if (value >= 70) return "high";
  if (value >= 35) return "attention";
  return "stable";
}

function EmptyRainPage() {
  return (
    <section className="rain-v2-unavailable" aria-labelledby="rain-v2-unavailable-title">
      <RefreshCw aria-hidden="true" />
      <div>
        <h2 id="rain-v2-unavailable-title">A previsão de chuva está em atualização</h2>
        <p>Ainda não há dados suficientes para mostrar as próximas horas e dias.</p>
      </div>
      <Link to="/tempo-hoje-pelotas">
        Ver o tempo de hoje <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}

export function RainForecastPageV2({ data }: { data: WeatherIntelligenceData }) {
  const recoveredData = useOpenMeteoIntelligenceRecovery(data);
  const weather = recoveredData.weather;
  const hours = weather.hourly.slice(0, 12);
  const days = weather.daily.slice(0, 7);

  if (!hours.length && !days.length) return <EmptyRainPage />;

  const totalRain = days.reduce((total, day) => total + day.precipitationMm, 0);
  const rainyDays = days.filter(
    (day) => (day.rainChance ?? 0) >= 30 || day.precipitationMm >= 1,
  );
  const highestVolumeDay = days.reduce<DailyForecast | null>((selected, day) => {
    if (!selected) return day;
    if (day.precipitationMm !== selected.precipitationMm) {
      return day.precipitationMm > selected.precipitationMm ? day : selected;
    }
    return rainScore(day) > rainScore(selected) ? day : selected;
  }, null);
  const hasPositiveRainVolume = (highestVolumeDay?.precipitationMm ?? 0) > 0;

  const activeRainAlerts = weather.alerts.filter(
    (alert) =>
      alert.period === "active" &&
      /chuva|tempestade|alagamento|inunda|granizo/i.test(
        `${alert.event} ${alert.headline} ${alert.description}`,
      ),
  );
  const officialPeriods = weather.inmetForecast
    .filter((period) => /chuva|pancada|tempestade|granizo|precipita/i.test(period.summary))
    .slice(0, 4);

  return (
    <div className="rain-v2-page">
      <InternalPageChapters items={chapters} label="Navegação da página de chuva" />

      <section className="rain-v2-hourly" id="chuva-por-hora" aria-labelledby="rain-v2-hourly-title">
        <header>
          <h2 id="rain-v2-hourly-title">Chance de chuva nas próximas 12 horas</h2>
          <Link to="/tempo-hoje-pelotas">Temperatura e vento de hoje</Link>
        </header>

        <div className="rain-v2-hourly__grid" aria-label="Probabilidade de chuva por horário">
          {hours.map((hour, index) => {
            const chance = hour.precipitationProbability;
            const style = { "--rain-chance": `${chance === null ? 0 : Math.max(4, chance)}%` } as CSSProperties;
            return (
              <article
                className={`tone-${chanceTone(chance)}${index === 0 ? " is-current" : ""}`}
                key={`${hour.time}-${index}`}
                style={style}
              >
                <header><strong>{hour.time}</strong>{index === 0 ? <b>Próxima hora</b> : null}</header>
                <div className="rain-v2-hourly__reading">
                  <WeatherIcon name={hour.icon} title={`Condição prevista para ${hour.time}`} />
                  <strong>{formatChance(chance)}</strong>
                  <span>{hour.temperature}°</span>
                </div>
                <i aria-hidden="true"><b /></i>
                <small>
                  {hour.windGust === null
                    ? `Vento ${hour.windSpeed} km/h`
                    : hour.windGust <= 0
                      ? "Sem rajadas"
                      : `Rajadas até ${hour.windGust} km/h`}
                </small>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rain-v2-week" id="chuva-na-semana" aria-labelledby="rain-v2-week-title">
        <header>
          <h2 id="rain-v2-week-title">Chuva nos próximos 7 dias</h2>
        </header>

        <div className="rain-v2-week__grid">
          {days.map((day, index) => (
            <article
              className={`tone-${chanceTone(day.rainChance)}${index === 0 ? " is-today" : ""}`}
              key={`${day.weekday}-${day.date}`}
            >
              <header>
                <div><strong>{day.weekday}</strong><span>{day.date}</span></div>
                {index < 2 ? <b>{index === 0 ? "Hoje" : "Amanhã"}</b> : null}
              </header>
              <CloudRain aria-hidden="true" />
              <dl>
                <div><dt>Chance</dt><dd>{formatChance(day.rainChance)}</dd></div>
                <div><dt>Volume</dt><dd>{formatMillimeters(day.precipitationMm)}</dd></div>
              </dl>
            </article>
          ))}
        </div>

        <dl className="rain-v2-week__summary" aria-label="Resumo da chuva prevista em sete dias">
          <div><dt>Total em 7 dias</dt><dd>{formatMillimeters(totalRain)}</dd></div>
          <div>
            <dt>Maior volume</dt>
            <dd>
              {hasPositiveRainVolume
                ? `${highestVolumeDay?.weekday} · ${formatMillimeters(highestVolumeDay?.precipitationMm ?? 0)}`
                : "Sem volume previsto"}
            </dd>
          </div>
          <div><dt>Dias com chuva</dt><dd>{rainyDays.length} de {days.length}</dd></div>
        </dl>
      </section>

      <section className="rain-v2-official" id="contexto-oficial-da-chuva" aria-labelledby="rain-v2-official-title">
        <header>
          <h2 id="rain-v2-official-title">INMET para Pelotas</h2>
          <Link to="/alertas">Ver avisos oficiais</Link>
        </header>

        <dl className="rain-v2-official__list">
          <div className={activeRainAlerts.length ? "has-alert" : "is-stable"}>
            <dt>
              {activeRainAlerts.length ? <ShieldAlert aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
              Avisos de chuva e tempestade
            </dt>
            <dd>{activeAlertLabel(activeRainAlerts.length)}</dd>
            {activeRainAlerts.length ? <p>{activeRainAlerts[0]?.headline || activeRainAlerts[0]?.event}</p> : null}
          </div>
          <div>
            <dt><Info aria-hidden="true" /> Previsão do INMET</dt>
            <dd>{officialPeriodLabel(officialPeriods.length)}</dd>
            {officialPeriods[0]?.summary ? <p>{officialPeriods[0].summary}</p> : null}
          </div>
        </dl>
      </section>

      <footer className="rain-v2-footer">
        <p>
          <Info aria-hidden="true" />
          <span>
            Atualizado em {formatFetchedAt(weather.source.fetchedAt)} · {weather.quality.forecastProvider ?? "modelo meteorológico disponível"}.
          </span>
        </p>
        <nav aria-label="Outras páginas sobre o tempo em Pelotas">
          <Link to="/radar-e-satelite-pelotas">Radar</Link>
          <Link to="/vento-em-pelotas">Vento</Link>
          <Link to="/previsao-7-dias-pelotas">7 dias</Link>
        </nav>
      </footer>
    </div>
  );
}
