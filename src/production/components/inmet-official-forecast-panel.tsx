import { WeatherIcon } from "@/production/components/weather-icon";
import type { WeatherIconName } from "@/production/lib/weather-data";
import type {
  InmetForecastPeriod,
  InmetStationReference,
} from "@/lib/weather/official-sources.types";

import "./inmet-official-forecast-home.css";

function formatDate(value: string | null) {
  if (!value) return { weekday: "Data", date: "não informada" };

  const parsed = new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(parsed.getTime())) return { weekday: "Previsão", date: value };

  return {
    weekday: new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      weekday: "long",
    }).format(parsed),
    date: new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "short",
    }).format(parsed),
  };
}

function temperatureRange(period: InmetForecastPeriod) {
  if (period.minimum === null && period.maximum === null) return null;
  if (period.minimum === null) return `Máx. ${period.maximum}°`;
  if (period.maximum === null) return `Mín. ${period.minimum}°`;
  return `${period.minimum}° / ${period.maximum}°`;
}

function humidityRange(period: InmetForecastPeriod) {
  if (period.humidityMinimum === null && period.humidityMaximum === null) return null;
  return `${period.humidityMinimum ?? "—"}% a ${period.humidityMaximum ?? "—"}%`;
}

function windLabel(period: InmetForecastPeriod) {
  const value = [period.windDirection, period.windIntensity].filter(Boolean).join(" · ");
  return value || null;
}

function forecastWindSpeedLabel(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  return `${Math.round(value)} km/h previstos pelo modelo horário`;
}

function normalizeWeatherCopy(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function resolveForecastIcon(summary: string, periodLabel: string): WeatherIconName {
  const normalized = normalizeWeatherCopy(summary);
  const normalizedPeriod = normalizeWeatherCopy(periodLabel);
  const isNight = /noite|madrugada/.test(normalizedPeriod);

  if (/trovoad|temporal|raio|tempest/.test(normalized)) return "storm";
  if (/chuva|garoa|precipit|pancada/.test(normalized)) return "rain";
  if (/vento|rajada/.test(normalized)) return "wind";
  if (/nevoeiro|nevoa|cerracao/.test(normalized)) return "cloud";

  if (/poucas nuvens|parcialmente|nuvens esparsas|entre nuvens/.test(normalized)) {
    return isNight ? "partly-cloudy-night" : "partly-cloudy";
  }

  if (/ceu claro|ceu aberto|tempo claro|limpo|ensolarado|predominio de sol|sol/.test(normalized)) {
    return isNight ? "moon" : "sun";
  }

  if (/muitas nuvens|nublado|encoberto|nuvens/.test(normalized)) return "cloud";
  return isNight ? "moon" : "cloud";
}

function PeriodMetrics({
  period,
  forecastWindSpeedKmh = null,
}: {
  period: InmetForecastPeriod;
  forecastWindSpeedKmh?: number | null;
}) {
  const temperature = temperatureRange(period);
  const humidity = humidityRange(period);
  const wind = windLabel(period);
  const windSpeed = forecastWindSpeedLabel(forecastWindSpeedKmh);

  return (
    <dl className="tp-home-inmet__metrics">
      {temperature ? (
        <div className="is-temperature">
          <dt>Temperatura</dt>
          <dd>{temperature}</dd>
        </div>
      ) : null}
      {humidity ? (
        <div>
          <dt>Umidade</dt>
          <dd>{humidity}</dd>
        </div>
      ) : null}
      {wind || windSpeed ? (
        <div className="is-wind">
          <dt>Vento</dt>
          <dd>
            {wind ? <span>{wind}</span> : null}
            {windSpeed ? <small>{windSpeed}</small> : null}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

export function InmetOfficialForecastPanel({
  periods,
  forecastWindSpeedKmh = null,
}: {
  periods: InmetForecastPeriod[];
  station: InmetStationReference["station"];
  forecastWindSpeedKmh?: number | null;
}) {
  const visiblePeriods = periods.slice(0, 4);
  const featuredPeriod = visiblePeriods[0] ?? null;
  const nextPeriods = visiblePeriods.slice(1);

  return (
    <section className="tp-home-inmet" aria-labelledby="inmet-official-title">
      <header className="tp-home-inmet__header">
        <div className="tp-home-inmet__heading">
          <h2 id="inmet-official-title">Previsão oficial do INMET</h2>
          <p>Previsão municipal oficial para Pelotas.</p>
        </div>
      </header>

      {featuredPeriod ? (
        <div className="tp-home-inmet__layout">
          <article className="tp-home-inmet__featured">
            <div className="tp-home-inmet__topline">
              <div>
                <span>{formatDate(featuredPeriod.date).weekday}</span>
                <strong>{formatDate(featuredPeriod.date).date}</strong>
              </div>
              <b>{featuredPeriod.period}</b>
            </div>

            <div className="tp-home-inmet__featured-summary">
              <span className="tp-home-inmet__icon is-featured">
                <WeatherIcon
                  name={resolveForecastIcon(featuredPeriod.summary, featuredPeriod.period)}
                  title={featuredPeriod.summary}
                />
              </span>
              <div>
                <small>Síntese oficial</small>
                <h3>{featuredPeriod.summary}</h3>
              </div>
            </div>

            <PeriodMetrics
              period={featuredPeriod}
              forecastWindSpeedKmh={forecastWindSpeedKmh}
            />
          </article>

          <div className="tp-home-inmet__next" aria-label="Próximos períodos da previsão oficial">
            {nextPeriods.map((period) => {
              const formattedDate = formatDate(period.date);
              return (
                <article key={period.id}>
                  <div className="tp-home-inmet__topline">
                    <div>
                      <span>{formattedDate.weekday}</span>
                      <strong>{formattedDate.date}</strong>
                    </div>
                    <b>{period.period}</b>
                  </div>

                  <div className="tp-home-inmet__compact-summary">
                    <span className="tp-home-inmet__icon">
                      <WeatherIcon
                        name={resolveForecastIcon(period.summary, period.period)}
                        title={period.summary}
                      />
                    </span>
                    <h3>{period.summary}</h3>
                  </div>

                  <PeriodMetrics period={period} />
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="tp-home-inmet__unavailable">
          <strong>Previsão oficial temporariamente indisponível</strong>
        </div>
      )}

      <footer className="tp-home-inmet__footer">
        <span>Fonte: Instituto Nacional de Meteorologia — INMET</span>
      </footer>
    </section>
  );
}
