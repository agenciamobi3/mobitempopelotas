import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Info,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import type { CSSProperties } from "react";

import { RainAccumulationContext } from "@/components/weather/RainAccumulationContext";
import { RainHourlyVolumeContext } from "@/components/weather/RainHourlyVolumeContext";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { DailyForecast } from "@/lib/weather/types";
import { WeatherIcon } from "@/production/components/weather-icon";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./RainOfficialEditorial.css";

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
  return count === 1 ? "1 aviso ativo" : `${count} avisos ativos`;
}

function officialPeriodLabel(count: number) {
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

function EmptyRainForecast() {
  return (
    <section className="rain-page__empty" aria-labelledby="rain-page-empty-title">
      <RefreshCw aria-hidden="true" />
      <div>
        <h2 id="rain-page-empty-title">A previsão de chuva está em atualização</h2>
        <p>As medições disponíveis continuam acima.</p>
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
  const hasForecast = hours.length > 0 || days.length > 0;
  const forecastSource = weather.quality.forecastSource;
  const forecastFetchedAt = forecastSource
    ? weather.sources[forecastSource].fetchedAt
    : weather.source.fetchedAt;

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
  const inmetStatus = weather.sources.inmet.status;
  const hasOfficialContent = activeRainAlerts.length > 0 || officialPeriods.length > 0;
  const showInmetState =
    inmetStatus === "unavailable" || (inmetStatus !== "live" && !hasOfficialContent);
  const activeAlertsReading = activeRainAlerts.length
    ? activeAlertLabel(activeRainAlerts.length)
    : inmetStatus === "live"
      ? "Nenhum aviso ativo"
      : "Consulta parcial";
  const officialForecastReading = officialPeriods.length
    ? officialPeriodLabel(officialPeriods.length)
    : inmetStatus === "live"
      ? "Sem chuva mencionada"
      : "Consulta parcial";

  return (
    <div className="rain-page">
      <RainAccumulationContext data={recoveredData} />

      {hours.length ? (
        <section className="rain-page__hourly" id="chuva-por-hora" aria-labelledby="rain-page-hourly-title">
          <header className="rain-page__section-heading">
            <div>
              <span>Próximas horas</span>
              <h2 id="rain-page-hourly-title">Chance de chuva</h2>
            </div>
            <Link to="/tempo-hoje-pelotas">Tempo de hoje</Link>
          </header>

          <div className="rain-page__hourly-track" aria-label="Probabilidade de chuva por horário">
            {hours.map((hour, index) => {
              const chance = hour.precipitationProbability;
              const style = {
                "--rain-chance": `${chance === null ? 0 : Math.max(4, chance)}%`,
              } as CSSProperties;

              return (
                <article
                  className={`tone-${chanceTone(chance)}${index === 0 ? " is-current" : ""}`}
                  key={`${hour.time}-${index}`}
                  style={style}
                >
                  <header>
                    <strong>{hour.time}</strong>
                    {index === 0 ? <b>Agora</b> : null}
                  </header>
                  <WeatherIcon name={hour.icon} title={`Condição prevista para ${hour.time}`} />
                  <div className="rain-page__hourly-reading">
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
      ) : null}

      <RainHourlyVolumeContext
        hourly={weather.hourly}
        forecastFetchedAt={forecastFetchedAt}
      />

      {days.length ? (
        <section className="rain-page__week" id="chuva-na-semana" aria-labelledby="rain-page-week-title">
          <header className="rain-page__section-heading">
            <div>
              <span>Próximos dias</span>
              <h2 id="rain-page-week-title">Chuva em 7 dias</h2>
            </div>
          </header>

          <div className="rain-page__week-grid">
            {days.map((day, index) => (
              <article
                className={`tone-${chanceTone(day.rainChance)}${index === 0 ? " is-today" : ""}`}
                key={`${day.weekday}-${day.date}`}
              >
                <header>
                  <div><strong>{day.weekday}</strong><span>{day.date}</span></div>
                  {index < 2 ? <b>{index === 0 ? "Hoje" : "Amanhã"}</b> : null}
                </header>
                <WeatherIcon name={day.icon} title={`Condição prevista para ${day.weekday}`} />
                <dl>
                  <div><dt>Chuva</dt><dd>{formatChance(day.rainChance)}</dd></div>
                  <div><dt>Volume</dt><dd>{formatMillimeters(day.precipitationMm)}</dd></div>
                </dl>
              </article>
            ))}
          </div>

          <dl className="rain-page__week-summary" aria-label="Resumo da chuva prevista em sete dias">
            <div><dt>Total em 7 dias</dt><dd>{formatMillimeters(totalRain)}</dd></div>
            <div>
              <dt>Maior volume</dt>
              <dd>
                {hasPositiveRainVolume
                  ? `${highestVolumeDay?.weekday} · ${formatMillimeters(highestVolumeDay?.precipitationMm ?? 0)}`
                  : "Sem volume previsto"}
              </dd>
            </div>
            <div><dt>Dias com chuva prevista</dt><dd>{rainyDays.length} de {days.length}</dd></div>
          </dl>
        </section>
      ) : null}

      {!hasForecast ? <EmptyRainForecast /> : null}

      <section className="rain-page__official" id="contexto-oficial-da-chuva" aria-labelledby="rain-page-official-title">
        <header className="rain-page__section-heading">
          <div>
            <span>Fonte oficial</span>
            <h2 id="rain-page-official-title">INMET para Pelotas</h2>
          </div>
          <Link to="/alertas">Ver avisos oficiais</Link>
        </header>

        {showInmetState ? (
          <div className="rain-page__official-state" role="status">
            <RefreshCw aria-hidden="true" />
            <div>
              <strong>
                {inmetStatus === "unavailable"
                  ? "INMET temporariamente indisponível"
                  : "Consulta do INMET em atualização"}
              </strong>
              <p>
                {inmetStatus === "unavailable"
                  ? "A consulta oficial não respondeu nesta atualização. A previsão meteorológica do portal continua disponível acima de forma independente."
                  : "Nenhum dado oficial suficiente foi recebido neste ciclo para afirmar ausência de chuva ou de avisos."}
              </p>
            </div>
            <Link to="/alertas">Abrir avisos oficiais</Link>
          </div>
        ) : (
          <div className="rain-page__official-grid">
            <article
              className={
                activeRainAlerts.length
                  ? "has-alert"
                  : inmetStatus === "live"
                    ? "is-stable"
                    : "is-partial"
              }
            >
              <div>
                {activeRainAlerts.length ? <ShieldAlert aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
                <span>Avisos de chuva e tempestade</span>
              </div>
              <strong>{activeAlertsReading}</strong>
              {activeRainAlerts.length ? <p>{activeRainAlerts[0]?.headline || activeRainAlerts[0]?.event}</p> : null}
            </article>
            <article className={inmetStatus === "live" ? "" : "is-partial"}>
              <div><Info aria-hidden="true" /><span>Previsão do INMET</span></div>
              <strong>{officialForecastReading}</strong>
              {officialPeriods[0]?.summary ? <p>{officialPeriods[0].summary}</p> : null}
            </article>
          </div>
        )}
      </section>

      <footer className="rain-page__footer">
        <p>
          <Info aria-hidden="true" />
          <span>Atualizado em {formatFetchedAt(weather.source.fetchedAt)}.</span>
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
