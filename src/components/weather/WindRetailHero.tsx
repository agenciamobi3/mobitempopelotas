import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Gauge, ShieldAlert, TrendingUp, Wind } from "lucide-react";
import type { CSSProperties } from "react";

import type { WeatherData } from "@/production/lib/weather-data";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import { getRetailWeatherPhoto } from "./today-retail-hero-backgrounds";
import "./TodayRetailHero.css";
import "./TodayRetailHeroPhoto.css";
import "./WindRetailHero.css";

function formatSpeed(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value)} km/h`;
}

function formatGust(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  if (value <= 0) return "Sem rajadas";
  return `${Math.round(value)} km/h`;
}

export function WindRetailHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
}: {
  weather: WeatherData;
  advisoryLevel: AdvisoryLevel;
  officialAlertCount?: number;
}) {
  const hours = weather.hourly.slice(0, 24);
  const days = weather.daily.slice(0, 7);
  const current = weather.current;
  const positiveGustHours = hours.filter((hour) => (hour.windGust ?? 0) > 0);
  const peak = positiveGustHours.reduce<(typeof hours)[number] | null>(
    (selected, hour) =>
      !selected || (hour.windGust ?? -1) > (selected.windGust ?? -1) ? hour : selected,
    null,
  );
  const maximumGust = peak?.windGust ?? (hours.some((hour) => hour.windGust !== null) ? 0 : null);
  const averageSpeed = hours.length
    ? hours.reduce((total, hour) => total + hour.windSpeed, 0) / hours.length
    : null;
  const weeklyGusts = days
    .map((day) => day.windGust)
    .filter((value): value is number => value !== null && value > 0);
  const weeklyMaximum = weeklyGusts.length ? Math.max(...weeklyGusts) : null;
  const photoIcon = weather.hourly[0]?.icon ?? weather.daily[0]?.icon ?? "cloud";
  const photo = getRetailWeatherPhoto(photoIcon, advisoryLevel);
  const photoStyle = {
    "--today-retail-hero-photo": `url("${photo.src}")`,
    "--today-retail-hero-position": photo.position,
  } as CSSProperties;

  const description = current?.windSpeed !== null && current?.windSpeed !== undefined
    ? `Agora, ${formatSpeed(current.windSpeed)}${current.windDirection ? ` de ${current.windDirection}` : ""}. ${maximumGust === null ? "Rajadas ainda não informadas." : maximumGust > 0 ? `Rajadas de até ${formatGust(maximumGust)} nas próximas 24 horas.` : "Sem rajadas positivas previstas nas próximas 24 horas."}`
    : maximumGust !== null
      ? `Rajadas ${maximumGust > 0 ? `de até ${formatGust(maximumGust)}` : "sem valor positivo"} nas próximas 24 horas. O vento atual está em atualização.`
      : "Os dados de vento estão em atualização.";

  return (
    <section
      className={`today-retail-hero wind-retail-hero today-retail-hero--${advisoryLevel}`}
      aria-labelledby="wind-retail-hero-title"
    >
      <div className="today-retail-hero__inner wind-retail-hero__inner">
        <div className="today-retail-hero__copy wind-retail-hero__copy">
          <h1 id="wind-retail-hero-title">Vento em Pelotas hoje: <span>direção e rajadas.</span></h1>
          <p>{description}</p>

          {officialAlertCount > 0 ? (
            <div className="today-retail-hero__badges" aria-label="Avisos oficiais">
              <Link className="is-alert" to="/alertas">
                <ShieldAlert aria-hidden="true" /> {officialAlertCount === 1 ? "1 aviso oficial" : `${officialAlertCount} avisos oficiais`}
              </Link>
            </div>
          ) : null}

          <div className="today-retail-hero__actions">
            {hours.length ? (
              <a className="today-retail-hero__primary" href="#vento-por-hora">
                Ver próximas 24 horas <ArrowRight aria-hidden="true" />
              </a>
            ) : (
              <Link className="today-retail-hero__primary" to="/previsao-7-dias-pelotas">
                Ver 7 dias <ArrowRight aria-hidden="true" />
              </Link>
            )}
            <a className="today-retail-hero__secondary" href="#direcao-do-vento-por-hora">Ver direção</a>
          </div>
        </div>

        <div className="today-retail-hero__showcase wind-retail-hero__showcase">
          <article className="today-retail-hero__current wind-retail-hero__current" style={photoStyle}>
            <div className="today-retail-hero__current-photo" role="img" aria-label={photo.alt} />
            <div className="today-retail-hero__current-content">
              <header>
                <div><span>Pelotas, RS</span><small>Vento</small></div>
                <b><i aria-hidden="true" /> Hoje</b>
              </header>

              <div className="today-retail-hero__current-main">
                <div className="today-retail-hero__weather-icon"><Wind aria-hidden="true" /></div>
                <div>
                  <strong>{formatSpeed(current?.windSpeed)}</strong>
                  <span>{current?.windDirection ? `Vento de ${current.windDirection}` : "Direção não informada"}</span>
                  <small>{peak ? `Maior rajada por volta de ${peak.time}` : "Rajada sem horário de destaque"}</small>
                </div>
              </div>

              <div className="today-retail-hero__current-metrics">
                <div><TrendingUp aria-hidden="true" /><span><small>Maior rajada 24 h</small><strong>{formatGust(maximumGust)}</strong></span></div>
                <div><Gauge aria-hidden="true" /><span><small>Média 24 h</small><strong>{averageSpeed === null ? "—" : formatSpeed(averageSpeed)}</strong></span></div>
                <div><Compass aria-hidden="true" /><span><small>Direção agora</small><strong>{current?.windDirection ?? "—"}</strong></span></div>
              </div>

              <a className="today-retail-hero__photo-credit" href={photo.sourceHref} target="_blank" rel="noreferrer">Foto: {photo.credit}</a>
            </div>
          </article>

          <div className="today-retail-hero__tiles wind-retail-hero__tiles" aria-label="Destaques do vento">
            <article className="is-gust"><span><TrendingUp aria-hidden="true" /> Maior rajada</span><strong>{formatGust(maximumGust)}</strong><small>{peak?.time ?? "Sem horário"}</small></article>
            <article className="is-direction"><span><Compass aria-hidden="true" /> Direção agora</span><strong>{current?.windDirection ?? "—"}</strong></article>
            <article className="is-average"><span><Gauge aria-hidden="true" /> Média 24 h</span><strong>{averageSpeed === null ? "—" : formatSpeed(averageSpeed)}</strong></article>
            <article className="is-week"><span><Wind aria-hidden="true" /> Maior rajada em 7 dias</span><strong>{formatGust(weeklyMaximum)}</strong></article>
          </div>
        </div>
      </div>
    </section>
  );
}
