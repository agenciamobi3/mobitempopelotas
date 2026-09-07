import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  CloudRain,
  Droplets,
  Info,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
  Umbrella,
} from "lucide-react";
import type { CSSProperties } from "react";

import { InternalPageChapters } from "@/components/weather/InternalWeatherWidgets";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { DailyForecast, HourlyForecast } from "@/lib/weather/types";
import { WeatherIcon } from "@/production/components/weather-icon";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./RainForecastPageV2.css";

const chapters = [
  { href: "#chuva-acumulada", label: "Acumulado", detail: "Chuva medida" },
  { href: "#chuva-por-hora", label: "Próximas horas", detail: "Chance por horário" },
  { href: "#volume-de-chuva-por-hora", label: "Volume por hora", detail: "Milímetros previstos" },
  { href: "#chuva-na-semana", label: "Próximos 7 dias", detail: "Chance e volume" },
  { href: "#planejamento-da-chuva", label: "Horários", detail: "Menor e maior chance" },
  { href: "#contexto-oficial-da-chuva", label: "INMET", detail: "Avisos e previsão" },
];

type WindowSummary = {
  start: string;
  end: string;
  averageChance: number | null;
  maximumChance: number | null;
  maximumGust: number | null;
  windRisk: number;
};

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

function formatGust(value: number | null | undefined) {
  if (value === null || value === undefined) return "não informada";
  if (value <= 0) return "sem rajadas";
  return `até ${value} km/h`;
}

function activeAlertLabel(count: number) {
  if (count === 0) return "Nenhum aviso ativo";
  return count === 1 ? "1 aviso ativo" : `${count} avisos ativos`;
}

function officialPeriodLabel(count: number) {
  if (count === 0) return "Sem chuva mencionada na previsão disponível";
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

function buildWindows(hours: HourlyForecast[]): WindowSummary[] {
  const result: WindowSummary[] = [];
  for (let index = 0; index < hours.length; index += 3) {
    const slice = hours.slice(index, index + 3);
    if (!slice.length) continue;
    const knownChances = slice
      .map((hour) => hour.precipitationProbability)
      .filter((value): value is number => value !== null);
    const gusts = slice
      .map((hour) => hour.windGust)
      .filter((value): value is number => value !== null);
    result.push({
      start: slice[0]?.time ?? "—",
      end: slice[slice.length - 1]?.time ?? "—",
      averageChance: knownChances.length
        ? Math.round(knownChances.reduce((total, value) => total + value, 0) / knownChances.length)
        : null,
      maximumChance: knownChances.length ? Math.max(...knownChances) : null,
      maximumGust: gusts.length ? Math.max(...gusts) : null,
      windRisk: Math.max(...slice.map((hour) => hour.windGust ?? hour.windSpeed)),
    });
  }
  return result;
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
  const highestVolumeDay = days.reduce<DailyForecast | null>(
    (selected, day) => (!selected || rainScore(day) > rainScore(selected) ? day : selected),
    null,
  );
  const hasPositiveRainVolume = (highestVolumeDay?.precipitationMm ?? 0) > 0;

  const knownChanceHours = hours.filter((hour) => hour.precipitationProbability !== null);
  const windows = buildWindows(hours);
  const bestCandidates = windows.filter((window) => window.averageChance !== null);
  const bestCandidate = bestCandidates.reduce<WindowSummary | null>((selected, window) => {
    if (!selected) return window;
    const selectedChance = selected.averageChance ?? 101;
    const currentChance = window.averageChance ?? 101;
    if (currentChance !== selectedChance) return currentChance < selectedChance ? window : selected;
    return window.windRisk < selected.windRisk ? window : selected;
  }, null);
  const bestKeys = new Set(
    bestCandidates.map((window) => `${window.averageChance ?? "unknown"}:${window.windRisk}`),
  );
  const hasBestContrast = bestKeys.size > 1;
  const bestWindow = hasBestContrast ? bestCandidate : null;

  const attentionCandidates = windows.filter((window) => window.maximumChance !== null);
  const attentionCandidate = attentionCandidates.reduce<WindowSummary | null>((selected, window) => {
    if (!selected) return window;
    return (window.maximumChance ?? -1) > (selected.maximumChance ?? -1) ? window : selected;
  }, null);
  const attentionChances = attentionCandidates.map((window) => window.maximumChance as number);
  const hasAttentionContrast =
    attentionChances.length > 1 && Math.max(...attentionChances) > Math.min(...attentionChances);
  const attentionWindow = hasAttentionContrast ? attentionCandidate : null;
  const wetHours = knownChanceHours.filter((hour) => (hour.precipitationProbability ?? 0) >= 30);

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

      <section
        className="rain-v2-hourly"
        id="chuva-por-hora"
        aria-labelledby="rain-v2-hourly-title"
      >
        <header>
          <div>
            <h2 id="rain-v2-hourly-title">Chance de chuva nas próximas 12 horas</h2>
          </div>
          <Link to="/tempo-hoje-pelotas">Temperatura e vento de hoje</Link>
        </header>

        <div className="rain-v2-hourly__grid" aria-label="Probabilidade de chuva por horário">
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
                  {index === 0 ? <b>Próxima hora</b> : null}
                </header>
                <div className="rain-v2-hourly__reading">
                  <WeatherIcon name={hour.icon} title={`Condição prevista para ${hour.time}`} />
                  <strong>{formatChance(chance)}</strong>
                  <span>{hour.temperature}°</span>
                </div>
                <i aria-hidden="true"><b /></i>
                <small>
                  {hour.windGust === null
                    ? `Rajada não informada · vento de ${hour.windSpeed} km/h`
                    : hour.windGust <= 0
                      ? "Sem rajadas"
                      : `Rajadas de até ${hour.windGust} km/h`}
                </small>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="rain-v2-week"
        id="chuva-na-semana"
        aria-labelledby="rain-v2-week-title"
      >
        <header>
          <div>
            <h2 id="rain-v2-week-title">Chuva nos próximos 7 dias</h2>
          </div>
          <p>{rainyDays.length} de {days.length} dias têm pelo menos 30% de chance ou 1 mm previsto.</p>
        </header>

        <div className="rain-v2-week__grid">
          {days.map((day, index) => (
            <article className={`tone-${chanceTone(day.rainChance)}${index === 0 ? " is-today" : ""}`} key={`${day.weekday}-${day.date}`}>
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

        <div className="rain-v2-week__summary">
          <article><Droplets aria-hidden="true" /><span>Total previsto em 7 dias</span><strong>{formatMillimeters(totalRain)}</strong></article>
          <article><Umbrella aria-hidden="true" /><span>Maior volume</span><strong>{hasPositiveRainVolume ? `${highestVolumeDay?.weekday} · ${formatMillimeters(highestVolumeDay?.precipitationMm ?? 0)}` : "Sem volume previsto"}</strong></article>
          <article><CloudRain aria-hidden="true" /><span>Dias com chuva prevista</span><strong>{rainyDays.length} de {days.length}</strong></article>
        </div>
      </section>

      <section
        className="rain-v2-planning"
        id="planejamento-da-chuva"
        aria-labelledby="rain-v2-planning-title"
      >
        <header>
          <div>
            <h2 id="rain-v2-planning-title">Menor e maior chance nas próximas 12 horas</h2>
          </div>
        </header>

        <div className="rain-v2-planning__grid">
          <article className={bestWindow ? "is-best" : undefined}>
            <CheckCircle2 aria-hidden="true" />
            <div>
              <span>Menor chance</span>
              <strong>{bestWindow ? `${bestWindow.start}–${bestWindow.end}` : bestCandidates.length ? "Sem período de destaque" : "Em atualização"}</strong>
              <p>{bestWindow ? `Média de ${bestWindow.averageChance}%` : bestCandidates.length ? "Os períodos estão parecidos." : "Chance ainda não informada."}</p>
            </div>
          </article>
          <article className={attentionWindow ? "is-attention" : undefined}>
            <TriangleAlert aria-hidden="true" />
            <div>
              <span>Maior chance</span>
              <strong>{attentionWindow ? `${attentionWindow.start}–${attentionWindow.end}` : attentionCandidates.length ? "Sem período de destaque" : "Em atualização"}</strong>
              <p>
                {attentionWindow
                  ? `Até ${attentionWindow.maximumChance}% · rajadas ${formatGust(attentionWindow.maximumGust)}`
                  : attentionCandidates.length
                    ? "Os períodos estão parecidos."
                    : "Chance ainda não informada."}
              </p>
            </div>
          </article>
          <article>
            <Umbrella aria-hidden="true" />
            <div>
              <span>Horários com 30% ou mais</span>
              <strong>{knownChanceHours.length ? `${wetHours.length} de ${knownChanceHours.length}` : "Em atualização"}</strong>
            </div>
          </article>
        </div>
      </section>

      <section
        className="rain-v2-official"
        id="contexto-oficial-da-chuva"
        aria-labelledby="rain-v2-official-title"
      >
        <header>
          <div>
            <h2 id="rain-v2-official-title">INMET para Pelotas</h2>
          </div>
          <Link to="/alertas">Ver avisos oficiais</Link>
        </header>

        <div className="rain-v2-official__grid">
          <article className={activeRainAlerts.length ? "has-alert" : "is-stable"}>
            {activeRainAlerts.length ? <ShieldAlert aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
            <div>
              <span>Avisos de chuva e tempestade</span>
              <strong>{activeAlertLabel(activeRainAlerts.length)}</strong>
              {activeRainAlerts.length ? <p>{activeRainAlerts[0]?.headline || activeRainAlerts[0]?.event}</p> : null}
            </div>
          </article>
          <article>
            <Info aria-hidden="true" />
            <div>
              <span>Previsão do INMET</span>
              <strong>{officialPeriodLabel(officialPeriods.length)}</strong>
              {officialPeriods[0]?.summary ? <p>{officialPeriods[0].summary}</p> : null}
            </div>
          </article>
        </div>
      </section>

      <nav className="rain-v2-related" aria-label="Outras páginas sobre o tempo em Pelotas">
        <Link to="/radar-e-satelite-pelotas"><span><strong>Radar e satélite</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/vento-em-pelotas"><span><strong>Vento em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/previsao-7-dias-pelotas"><span><strong>Previsão de 7 dias</strong></span><ArrowRight aria-hidden="true" /></Link>
      </nav>

      <aside className="rain-v2-source-note" aria-label="Origem e atualização da previsão de chuva">
        <Info aria-hidden="true" />
        <p>
          Atualizado em {formatFetchedAt(weather.source.fetchedAt)} · Previsão: {weather.quality.forecastProvider ?? "modelo meteorológico disponível"}. Chance e volume são previstos, não medidos.
        </p>
      </aside>
    </div>
  );
}
