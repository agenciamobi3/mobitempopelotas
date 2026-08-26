import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CloudRain,
  Info,
  RefreshCw,
  Thermometer,
  TriangleAlert,
  Wind,
} from "lucide-react";

import type { ExtendedForecastData } from "@/lib/weather/extended-forecast.types";
import type { DailyForecast } from "@/lib/weather/types";
import { WeatherIcon } from "@/production/components/weather-icon";

import { InternalPageChapters } from "./InternalWeatherWidgets";
import "./FifteenDayForecastPage.css";

const chapters = [
  { href: "#resumo-15-dias", label: "Resumo", detail: "Destaques da janela" },
  { href: "#previsao-15-dias-dia-a-dia", label: "Dias 1–7", detail: "Horizonte mais próximo" },
  { href: "#previsao-estendida-8-15", label: "Dias 8–15", detail: "Horizonte estendido" },
  { href: "#incerteza-15-dias", label: "Incerteza", detail: "Como usar cada horizonte" },
  { href: "#fontes-15-dias", label: "Fonte", detail: "Origem e atualização" },
];

function formatMillimeters(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mm`;
}

function formatGust(value: number | null) {
  if (value === null) return "Não informada";
  if (value <= 0) return "Sem rajada prevista";
  return `${value} km/h`;
}

function formatDateTime(value: string) {
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

function rainScore(day: DailyForecast) {
  return (day.rainChance ?? 0) + day.precipitationMm * 4;
}

function DayCard({ day, index }: { day: DailyForecast; index: number }) {
  const rainSignal = (day.rainChance ?? 0) >= 35 || day.precipitationMm >= 4;
  const windSignal = (day.windGust ?? 0) >= 40;
  const tone = rainSignal || windSignal ? "attention" : "stable";

  return (
    <article className={`fifteen-day__day tone-${tone}`}>
      <header>
        <div>
          <strong>{day.weekday}</strong>
          <span>{day.date}</span>
        </div>
        <b>{index === 0 ? "Hoje" : index === 1 ? "Amanhã" : `Dia ${index + 1}`}</b>
      </header>

      <div className="fifteen-day__condition">
        <WeatherIcon name={day.icon} title={`Condição prevista para ${day.weekday}`} />
        <strong>
          {day.min}° <span>/</span> {day.max}°
        </strong>
      </div>

      <dl>
        <div>
          <dt><CloudRain aria-hidden="true" /> Chuva</dt>
          <dd>{day.rainChance === null ? "Não informada" : `${day.rainChance}%`}</dd>
          <small>{formatMillimeters(day.precipitationMm)} previstos</small>
        </div>
        <div>
          <dt><Wind aria-hidden="true" /> Rajada máxima</dt>
          <dd>{formatGust(day.windGust)}</dd>
          <small>Maior valor previsto para o dia</small>
        </div>
      </dl>
    </article>
  );
}

function ForecastUnavailable() {
  return (
    <section className="fifteen-day__unavailable" aria-labelledby="fifteen-day-unavailable-title">
      <RefreshCw aria-hidden="true" />
      <div>
        <span>Previsão estendida</span>
        <h2 id="fifteen-day-unavailable-title">Os 15 dias estão em atualização</h2>
        <p>A fonte não entregou uma janela utilizável. Nenhum dia foi preenchido manualmente.</p>
      </div>
      <Link to="/previsao-7-dias-pelotas">
        Ver previsão de 7 dias <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}

export function FifteenDayForecastPage({ forecast }: { forecast: ExtendedForecastData }) {
  const days = forecast.days.slice(0, 15);
  if (days.length === 0) return <ForecastUnavailable />;

  const nearDays = days.slice(0, 7);
  const extendedDays = days.slice(7, 15);
  const minimum = Math.min(...days.map((day) => day.min));
  const maximum = Math.max(...days.map((day) => day.max));
  const rainiestDay = days.reduce((selected, day) =>
    rainScore(day) > rainScore(selected) ? day : selected,
  );
  const strongestGustDay = days.reduce((selected, day) =>
    (day.windGust ?? -1) > (selected.windGust ?? -1) ? day : selected,
  );
  const rainyDays = days.filter(
    (day) => (day.rainChance ?? 0) >= 30 || day.precipitationMm >= 1,
  );

  return (
    <div className="fifteen-day">
      <InternalPageChapters items={chapters} label="Navegação da previsão de 15 dias" />

      <section className="fifteen-day__summary" id="resumo-15-dias" aria-labelledby="fifteen-day-summary-title">
        <header>
          <div>
            <span className="eyebrow">Resumo dos próximos 15 dias</span>
            <h2 id="fifteen-day-summary-title">Uma janela maior para planejar, sem esconder a incerteza</h2>
          </div>
          <p>
            Os primeiros dias permitem decisões mais específicas. Na segunda semana, use os valores
            como tendência diária e confirme novamente quando a data estiver mais próxima.
          </p>
        </header>

        <div className="fifteen-day__summary-grid">
          <article><Thermometer aria-hidden="true" /><span>Faixa de temperatura</span><strong>{minimum}° a {maximum}°</strong></article>
          <article><CloudRain aria-hidden="true" /><span>Maior sinal de chuva</span><strong>{rainiestDay.weekday}</strong><small>{rainiestDay.rainChance === null ? "chance não informada" : `${rainiestDay.rainChance}%`} · {formatMillimeters(rainiestDay.precipitationMm)}</small></article>
          <article><Wind aria-hidden="true" /><span>Rajada mais forte</span><strong>{strongestGustDay.weekday}</strong><small>{formatGust(strongestGustDay.windGust)}</small></article>
          <article><CalendarDays aria-hidden="true" /><span>Dias com sinal de chuva</span><strong>{rainyDays.length} de {days.length}</strong><small>30% ou mais de chance, ou pelo menos 1 mm previsto</small></article>
        </div>
      </section>

      <section className="fifteen-day__days" id="previsao-15-dias-dia-a-dia" aria-labelledby="fifteen-day-near-title">
        <header>
          <div>
            <span className="eyebrow">Dias 1 a 7</span>
            <h2 id="fifteen-day-near-title">Horizonte mais próximo</h2>
          </div>
          <Link to="/previsao-7-dias-pelotas">Abrir a página detalhada de 7 dias</Link>
        </header>
        <div className="fifteen-day__grid">
          {nearDays.map((day, index) => <DayCard day={day} index={index} key={day.dateIso ?? `${day.weekday}-${day.date}`} />)}
        </div>
      </section>

      <section className="fifteen-day__days is-extended" id="previsao-estendida-8-15" aria-labelledby="fifteen-day-extended-title">
        <header>
          <div>
            <span className="eyebrow">Dias 8 a 15</span>
            <h2 id="fifteen-day-extended-title">Horizonte estendido</h2>
          </div>
          <p>Quanto mais distante a data, maior a possibilidade de ajustes em temperatura, chuva e vento.</p>
        </header>
        {extendedDays.length > 0 ? (
          <div className="fifteen-day__grid">
            {extendedDays.map((day, offset) => <DayCard day={day} index={offset + 7} key={day.dateIso ?? `${day.weekday}-${day.date}`} />)}
          </div>
        ) : (
          <div className="fifteen-day__partial">
            <TriangleAlert aria-hidden="true" />
            <p>A fonte ainda não entregou os dias 8 a 15 nesta atualização. A página preserva apenas os dias realmente recebidos.</p>
          </div>
        )}
      </section>

      <section className="fifteen-day__uncertainty" id="incerteza-15-dias" aria-labelledby="fifteen-day-uncertainty-title">
        <header>
          <span className="eyebrow">Como usar a previsão</span>
          <h2 id="fifteen-day-uncertainty-title">A confiança não é igual em toda a janela</h2>
        </header>
        <div>
          <article><strong>1–3 dias</strong><p>Use para decisões mais específicas e confira a previsão por hora quando o dia chegar.</p></article>
          <article><strong>4–7 dias</strong><p>Boa janela para planejamento geral, ainda sujeita a ajustes conforme novas rodadas entram.</p></article>
          <article><strong>8–15 dias</strong><p>Use para tendência e organização antecipada. Reconfirme antes de decisões sensíveis ao tempo.</p></article>
        </div>
      </section>

      <aside className="fifteen-day__source" id="fontes-15-dias" aria-label="Fonte da previsão de 15 dias">
        <Info aria-hidden="true" />
        <p>
          Fonte: {forecast.source.name} · {forecast.source.model}. Atualizado em {formatDateTime(forecast.source.fetchedAt)}.
          Foram recebidos {forecast.source.returnedDays} de {forecast.source.requestedDays} dias solicitados. A página não transforma ausência de dado em zero e não projeta alertas oficiais para datas sem aviso publicado.
        </p>
      </aside>

      <nav className="fifteen-day__related" aria-label="Continue acompanhando a previsão">
        <Link to="/previsao-7-dias-pelotas"><span><small>Horizonte mais próximo</small><strong>Previsão de 7 dias</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/tempo-amanha-pelotas"><span><small>Próximo dia</small><strong>Tempo amanhã</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/chuva-em-pelotas"><span><small>Chance e volume</small><strong>Chuva em Pelotas</strong></span><ArrowRight aria-hidden="true" /></Link>
      </nav>
    </div>
  );
}
