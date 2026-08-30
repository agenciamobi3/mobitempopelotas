import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  LARANJAL_LATITUDE,
  LARANJAL_LONGITUDE,
  LARANJAL_OPEN_METEO_URL,
} from "@/lib/laranjal-weather";

import styles from "./LaranjalWeatherPageClient.module.css";

const REFRESH_INTERVAL_MS = 10 * 60 * 1_000;
const PORTAL_PRAIA_LARANJAL_LEVEL_URL =
  "https://praiadolaranjal.tur.br/nivel-lagoa-aovivo";

type LaranjalForecast = {
  fetchedAt: string;
  current: {
    time: string;
    temperature: number | null;
    feelsLike: number | null;
    humidity: number | null;
    windSpeed: number | null;
    windGust: number | null;
    windDirection: number | null;
    weatherCode: number | null;
  };
  daily: Array<{
    date: string;
    minimum: number | null;
    maximum: number | null;
    rainChance: number | null;
    precipitation: number | null;
    windGust: number | null;
    weatherCode: number | null;
  }>;
};

type ForecastPayload = {
  current?: Record<string, unknown>;
  daily?: Record<string, unknown>;
};

function numeric(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function numberArray(value: unknown) {
  return Array.isArray(value) ? value.map(numeric) : [];
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function weatherLabel(code: number | null) {
  if (code === 0) return "Céu limpo";
  if (code === 1 || code === 2) return "Parcialmente nublado";
  if (code === 3) return "Nublado";
  if (code === 45 || code === 48) return "Neblina";
  if (code !== null && code >= 51 && code <= 86) return "Chuva";
  if (code !== null && code >= 95) return "Temporal";
  return "Condição em atualização";
}

function compass(degrees: number | null) {
  if (degrees === null) return "—";
  const directions = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
  return directions[Math.round((((degrees % 360) + 360) % 360) / 45) % 8] ?? "—";
}

function metric(value: number | null, suffix: string, digits = 0) {
  if (value === null) return "—";
  return `${value.toFixed(digits).replace(".", ",")}${suffix}`;
}

function formatDate(value: string) {
  const parsed = new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
    .format(parsed)
    .replace(".", "");
}

function dayLabel(value: string, index: number) {
  if (index === 0) return "Hoje";
  if (index === 1) return "Amanhã";
  return formatDate(value);
}

function formatDateTime(value: string) {
  const hasExplicitZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const parsed = new Date(hasExplicitZone ? value : `${value}-03:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);
}

function forecastUrl() {
  const params = new URLSearchParams({
    latitude: String(LARANJAL_LATITUDE),
    longitude: String(LARANJAL_LONGITUDE),
    timezone: "America/Sao_Paulo",
    forecast_days: "7",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    cell_selection: "land",
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function normalizeForecast(payload: ForecastPayload): LaranjalForecast | null {
  const current = payload.current;
  const daily = payload.daily;
  if (!current || !daily) return null;

  const dates = stringArray(daily.time);
  const minimums = numberArray(daily.temperature_2m_min);
  const maximums = numberArray(daily.temperature_2m_max);
  const rainChance = numberArray(daily.precipitation_probability_max);
  const precipitation = numberArray(daily.precipitation_sum);
  const windGust = numberArray(daily.wind_gusts_10m_max);
  const weatherCodes = numberArray(daily.weather_code);

  if (dates.length === 0) return null;

  return {
    fetchedAt: new Date().toISOString(),
    current: {
      time: typeof current.time === "string" ? current.time : new Date().toISOString(),
      temperature: numeric(current.temperature_2m),
      feelsLike: numeric(current.apparent_temperature),
      humidity: numeric(current.relative_humidity_2m),
      windSpeed: numeric(current.wind_speed_10m),
      windGust: numeric(current.wind_gusts_10m),
      windDirection: numeric(current.wind_direction_10m),
      weatherCode: numeric(current.weather_code),
    },
    daily: dates.slice(0, 7).map((date, index) => ({
      date,
      minimum: minimums[index] ?? null,
      maximum: maximums[index] ?? null,
      rainChance: rainChance[index] ?? null,
      precipitation: precipitation[index] ?? null,
      windGust: windGust[index] ?? null,
      weatherCode: weatherCodes[index] ?? null,
    })),
  };
}

async function fetchForecast(signal: AbortSignal) {
  const response = await fetch(forecastUrl(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(`Open-Meteo respondeu com status ${response.status}`);
  const normalized = normalizeForecast((await response.json()) as ForecastPayload);
  if (!normalized) throw new Error("A previsão do Laranjal retornou formato inesperado");
  return normalized;
}

export function LaranjalWeatherPageClient() {
  const [forecast, setForecast] = useState<LaranjalForecast | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let activeController: AbortController | null = null;

    const load = () => {
      activeController?.abort();
      const requestController = new AbortController();
      activeController = requestController;

      void fetchForecast(requestController.signal)
        .then((next) => {
          if (disposed || requestController.signal.aborted) return;
          setForecast(next);
          setFailed(false);
        })
        .catch(() => {
          if (!disposed && !requestController.signal.aborted) setFailed(true);
        });
    };

    load();
    const interval = window.setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      disposed = true;
      window.clearInterval(interval);
      activeController?.abort();
    };
  }, []);

  const current = forecast?.current ?? null;
  const today = forecast?.daily[0] ?? null;

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="laranjal-weather-title">
        <div className={styles.heroCopy}>
          <span>Praia do Laranjal · Pelotas, RS</span>
          <h1 id="laranjal-weather-title">Tempo no Laranjal, Pelotas</h1>
          <p>
            Veja as condições agora e a previsão de 7 dias para um ponto de referência na orla
            do Laranjal. Os valores são estimativas de modelo e podem diferir entre Valverde,
            Santo Antônio, Barro Duro, áreas mais afastadas da Lagoa e outros pontos de Pelotas.
          </p>

          <div className={styles.todaySummary} aria-label="Resumo da previsão de hoje no Laranjal">
            <div>
              <span>Temperatura hoje</span>
              <strong>{metric(today?.minimum ?? null, "°")} / {metric(today?.maximum ?? null, "°")}</strong>
            </div>
            <div>
              <span>Chance de chuva</span>
              <strong>{metric(today?.rainChance ?? null, "%")}</strong>
            </div>
            <div>
              <span>Rajada máxima</span>
              <strong>{metric(today?.windGust ?? null, " km/h")}</strong>
            </div>
          </div>

          <div className={styles.actions}>
            <Link to="/nivel-da-lagoa-dos-patos-laranjal">Ver nível da Lagoa</Link>
            <Link to="/alertas">Ver avisos oficiais</Link>
            <a
              href={PORTAL_PRAIA_LARANJAL_LEVEL_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Nível no Portal Praia do Laranjal ↗
            </a>
          </div>
        </div>

        <div className={styles.currentCard}>
          <div className={styles.currentHeading}>
            <span>Estimativa para agora</span>
            <i aria-hidden="true" />
          </div>
          <strong>{metric(current?.temperature ?? null, "°C")}</strong>
          <p>
            {current
              ? weatherLabel(current.weatherCode)
              : failed
                ? "Previsão temporariamente indisponível"
                : "Atualizando previsão..."}
          </p>
          <dl>
            <div><dt>Sensação</dt><dd>{metric(current?.feelsLike ?? null, "°C")}</dd></div>
            <div><dt>Umidade</dt><dd>{metric(current?.humidity ?? null, "%")}</dd></div>
            <div><dt>Vento</dt><dd>{metric(current?.windSpeed ?? null, " km/h")}</dd></div>
            <div><dt>Rajada</dt><dd>{metric(current?.windGust ?? null, " km/h")}</dd></div>
            <div><dt>Direção</dt><dd>{compass(current?.windDirection ?? null)}</dd></div>
            <div><dt>Condição</dt><dd>{current ? weatherLabel(current.weatherCode) : "—"}</dd></div>
          </dl>
          <small>
            {current
              ? <>Modelo referente a <time dateTime={current.time}>{formatDateTime(current.time)}</time></>
              : "Nenhum valor é preenchido manualmente."}
          </small>
        </div>
      </section>

      <section className={styles.forecast} aria-labelledby="laranjal-seven-days-title">
        <header>
          <span>Próximos dias</span>
          <h2 id="laranjal-seven-days-title">Previsão de 7 dias para o Laranjal</h2>
          <p>
            Compare temperatura, chuva e rajadas. Quanto mais distante a data, maior a chance de
            a previsão mudar; confirme novamente antes de atividades ao ar livre ou na Lagoa.
          </p>
        </header>
        <div className={styles.days}>
          {forecast?.daily.length ? forecast.daily.map((day, index) => (
            <article key={day.date} className={index === 0 ? styles.today : undefined}>
              <strong><time dateTime={day.date}>{dayLabel(day.date, index)}</time></strong>
              <span>{weatherLabel(day.weatherCode)}</span>
              <p>{metric(day.minimum, "°")} / {metric(day.maximum, "°")}</p>
              <small>Chuva {metric(day.rainChance, "%")} · {metric(day.precipitation, " mm", 1)}</small>
              <small>Rajada {metric(day.windGust, " km/h")}</small>
            </article>
          )) : (
            <p className={styles.loading}>
              {failed
                ? "A previsão está temporariamente indisponível. Consulte os avisos oficiais e tente novamente em alguns minutos."
                : "Carregando a previsão para a orla do Laranjal..."}
            </p>
          )}
        </div>
      </section>

      <section className={styles.orlaGuide} aria-labelledby="laranjal-orla-guide-title">
        <header>
          <span>Antes de sair</span>
          <h2 id="laranjal-orla-guide-title">O que observar antes de ir para a orla</h2>
        </header>
        <div className={styles.guideGrid}>
          <article>
            <span>01</span>
            <h3>Vento e rajadas</h3>
            <p>Na beira da Lagoa, rajadas podem pesar mais na experiência do que a temperatura sozinha.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Chuva e temporais</h3>
            <p>Confira a chance de chuva e, em instabilidade, consulte os avisos meteorológicos oficiais.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Nível da Lagoa</h3>
            <p>A medição hidrológica é separada da previsão do tempo e deve ser consultada como outra camada de contexto.</p>
          </article>
        </div>
      </section>

      <section className={styles.context} aria-labelledby="laranjal-context-title">
        <div>
          <span>Como interpretar</span>
          <h2 id="laranjal-context-title">Laranjal não é o mesmo ponto meteorológico do centro de Pelotas</h2>
        </div>
        <p>
          A proximidade da Lagoa dos Patos e a exposição da orla podem influenciar vento,
          sensação térmica, neblina e distribuição de chuva. Esta página usa coordenadas
          próprias do Laranjal para a previsão. Ela não transforma a previsão do modelo em
          observação de estação e não usa o nível da Lagoa para inferir automaticamente risco
          meteorológico.
        </p>
        <ul>
          <li>Temperatura e vento desta página são estimativas para as coordenadas do Laranjal.</li>
          <li>O nível da Lagoa é uma medição hidrológica separada, com referência e horário próprios.</li>
          <li>Avisos de risco pertencem aos órgãos oficiais e devem ser consultados na página de alertas.</li>
          <li>Chuva localizada pode variar bastante entre a orla, bairros urbanos e zona rural.</li>
        </ul>
      </section>

      <section className={styles.portalFeature} aria-labelledby="portal-praia-laranjal-title">
        <div>
          <span>Portal parceiro do Laranjal</span>
          <h2 id="portal-praia-laranjal-title">Acompanhe também o nível da Lagoa no Portal Praia do Laranjal</h2>
          <p>
            O Tempo Pelotas concentra a leitura meteorológica. Para uma visão voltada à
            comunidade e aos visitantes da orla, o Portal Praia do Laranjal mantém uma página
            própria com o nível da Estação Laranjal e o contexto das condições na Lagoa dos Patos.
          </p>
        </div>
        <a
          href={PORTAL_PRAIA_LARANJAL_LEVEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.portalLink}
        >
          Ver nível no Portal Praia do Laranjal
          <span aria-hidden="true">↗</span>
        </a>
      </section>

      <footer className={styles.sources}>
        <strong>Fonte e referência</strong>
        <p>
          Previsão por coordenadas:{" "}
          <a href={LARANJAL_OPEN_METEO_URL} target="_blank" rel="noreferrer">Open-Meteo</a>.
          Ponto de referência aproximado da orla: {LARANJAL_LATITUDE}, {LARANJAL_LONGITUDE}.{" "}
          {forecast
            ? <>Consulta atualizada em <time dateTime={forecast.fetchedAt}>{formatDateTime(forecast.fetchedAt)}</time>.</>
            : "A fonte é consultada no navegador e pode ficar temporariamente indisponível."}
        </p>
      </footer>
    </div>
  );
}
