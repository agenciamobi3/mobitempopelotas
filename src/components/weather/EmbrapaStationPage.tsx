import { Link } from "@tanstack/react-router";

import {
  EMBRAPA_MONITOR_URL,
  type EmbrapaObservationData,
  type TimedObservation,
} from "@/lib/weather/embrapa-observation.types";

import "./EmbrapaStationPage.css";

function formatNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null) return "—";

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatFetchedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ExtremeValue({
  label,
  value,
  unit,
}: {
  label: string;
  value: TimedObservation;
  unit: string;
}) {
  return (
    <div className="embrapa-station-extreme__value">
      <span>{label}</span>
      <strong>
        {formatNumber(value.value)}
        {value.value === null ? "" : unit}
      </strong>
      <small>{value.time ? `às ${value.time}` : "Horário não informado"}</small>
    </div>
  );
}

function statusCopy(status: EmbrapaObservationData["status"]) {
  if (status === "live") return "Leitura disponível";
  if (status === "partial") return "Leitura parcial";
  return "Leitura indisponível";
}

export function EmbrapaStationPage({ data }: { data: EmbrapaObservationData }) {
  const available = data.status !== "unavailable";

  return (
    <article className="embrapa-station-page">
      <header className="embrapa-station-hero">
        <div className="embrapa-station-hero__copy">
          <span className="embrapa-station-eyebrow">Medições locais em Pelotas</span>
          <h1>Estação meteorológica da Embrapa Clima Temperado</h1>
          <p>
            Temperatura, umidade, vento, pressão e chuva medidos no Posto Meteorológico da Sede da
            Embrapa Clima Temperado, em Pelotas.
          </p>
          <div className="embrapa-station-hero__meta">
            <span className={`embrapa-station-status is-${data.status}`}>
              <i aria-hidden="true" /> {statusCopy(data.status)}
            </span>
            <span>
              {data.source.observationTime
                ? `Leitura das ${data.source.observationTime}`
                : `Consultado em ${formatFetchedAt(data.source.fetchedAt)}`}
            </span>
          </div>
        </div>

        <aside className={`embrapa-station-now is-${data.status}`} aria-label="Leitura atual da estação">
          {available ? (
            <>
              <span>Temperatura medida</span>
              <strong>{formatNumber(data.current.temperature)}°</strong>
              <p>
                Sensação de {formatNumber(data.current.feelsLike)} °C · Umidade de{" "}
                {formatNumber(data.current.humidity, 0)}%
              </p>
            </>
          ) : (
            <>
              <span>Fonte temporariamente indisponível</span>
              <strong>—</strong>
              <p>{data.error ?? "A leitura automática não respondeu."}</p>
            </>
          )}
        </aside>
      </header>

      {available ? (
        <>
          <section className="embrapa-station-section" aria-labelledby="embrapa-current-title">
            <div className="embrapa-station-section__heading">
              <span className="embrapa-station-eyebrow">Agora na estação</span>
              <h2 id="embrapa-current-title">O que está sendo medido</h2>
              <p>
                Estes valores representam o ponto onde a estação está instalada. Centro, Laranjal,
                Colônia e outras áreas de Pelotas podem registrar condições diferentes.
              </p>
            </div>

            <div className="embrapa-station-metrics">
              <article>
                <span>Temperatura</span>
                <strong>{formatNumber(data.current.temperature)} °C</strong>
                <small>Sensação de {formatNumber(data.current.feelsLike)} °C</small>
              </article>
              <article>
                <span>Umidade</span>
                <strong>{formatNumber(data.current.humidity, 0)}%</strong>
                <small>Ponto de orvalho: {formatNumber(data.current.dewPoint)} °C</small>
              </article>
              <article>
                <span>Pressão</span>
                <strong>{formatNumber(data.current.pressure)} hPa</strong>
                <small>{data.current.pressureTrend ?? "Tendência não informada"}</small>
              </article>
              <article>
                <span>Vento</span>
                <strong>{formatNumber(data.current.windSpeed)} km/h</strong>
                <small>{data.current.windDirection ?? "Direção não informada"}</small>
              </article>
              <article>
                <span>Sol</span>
                <strong>
                  {data.current.sunrise ?? "—"} · {data.current.sunset ?? "—"}
                </strong>
                <small>Nascer e pôr do sol informados pela estação</small>
              </article>
            </div>
          </section>

          <section className="embrapa-station-section" aria-labelledby="embrapa-rain-title">
            <div className="embrapa-station-section__heading">
              <span className="embrapa-station-eyebrow">Chuva medida</span>
              <h2 id="embrapa-rain-title">Acumulados da estação</h2>
              <p>
                Chuva medida no local da Embrapa. Não representa automaticamente o acumulado de toda
                Pelotas.
              </p>
            </div>

            <div className="embrapa-station-accumulated">
              <article>
                <span>Hoje</span>
                <strong>{formatNumber(data.accumulated.rainDaily)} mm</strong>
              </article>
              <article>
                <span>Neste mês</span>
                <strong>{formatNumber(data.accumulated.rainMonthly)} mm</strong>
              </article>
              <article>
                <span>Neste ano</span>
                <strong>{formatNumber(data.accumulated.rainAnnual)} mm</strong>
              </article>
            </div>
          </section>

          <section className="embrapa-station-section" aria-labelledby="embrapa-extremes-title">
            <div className="embrapa-station-section__heading">
              <span className="embrapa-station-eyebrow">Hoje</span>
              <h2 id="embrapa-extremes-title">Menores e maiores valores registrados</h2>
              <p>Os horários abaixo são os horários informados pela própria página da Embrapa.</p>
            </div>

            <div className="embrapa-station-extremes">
              <article>
                <h3>Temperatura do ar</h3>
                <div>
                  <ExtremeValue label="Mínima" value={data.extremes.temperatureMin} unit=" °C" />
                  <ExtremeValue label="Máxima" value={data.extremes.temperatureMax} unit=" °C" />
                </div>
              </article>
              <article>
                <h3>Umidade relativa</h3>
                <div>
                  <ExtremeValue label="Mínima" value={data.extremes.humidityMin} unit="%" />
                  <ExtremeValue label="Máxima" value={data.extremes.humidityMax} unit="%" />
                </div>
              </article>
              <article>
                <h3>Ponto de orvalho</h3>
                <div>
                  <ExtremeValue label="Mínimo" value={data.extremes.dewPointMin} unit=" °C" />
                  <ExtremeValue label="Máximo" value={data.extremes.dewPointMax} unit=" °C" />
                </div>
              </article>
              <article>
                <h3>Vento mais forte</h3>
                <div>
                  <ExtremeValue label="Máxima" value={data.extremes.windSpeedMax} unit=" km/h" />
                </div>
              </article>
            </div>
          </section>

          <section className="embrapa-station-section" aria-labelledby="embrapa-evapo-title">
            <div className="embrapa-station-section__heading">
              <span className="embrapa-station-eyebrow">Evapotranspiração</span>
              <h2 id="embrapa-evapo-title">Água que retorna para a atmosfera</h2>
              <p>
                A estação também informa evapotranspiração, uma referência útil para agricultura,
                hortas, jardins e acompanhamento das condições do solo e das plantas.
              </p>
            </div>

            <div className="embrapa-station-accumulated">
              <article>
                <span>Hoje</span>
                <strong>{formatNumber(data.accumulated.evapotranspirationDaily, 2)} mm</strong>
              </article>
              <article>
                <span>Neste mês</span>
                <strong>{formatNumber(data.accumulated.evapotranspirationMonthly, 2)} mm</strong>
              </article>
              <article>
                <span>Neste ano</span>
                <strong>{formatNumber(data.accumulated.evapotranspirationAnnual, 2)} mm</strong>
              </article>
            </div>
          </section>
        </>
      ) : (
        <section className="embrapa-station-section embrapa-station-unavailable" role="status">
          <div className="embrapa-station-section__heading">
            <span className="embrapa-station-eyebrow">Consulta automática</span>
            <h2>A página continua disponível mesmo quando a leitura falha</h2>
            <p>
              O Tempo Pelotas não substitui uma medição ausente por previsão. Você ainda pode abrir a
              fonte original e tentar novamente depois.
            </p>
          </div>
        </section>
      )}

      <section className="embrapa-station-section embrapa-station-source" aria-labelledby="embrapa-source-title">
        <div className="embrapa-station-section__heading">
          <span className="embrapa-station-eyebrow">Fonte e localização</span>
          <h2 id="embrapa-source-title">Posto Meteorológico da Sede</h2>
          <p>
            A Embrapa informa a estação na Sede da Embrapa Clima Temperado, em Pelotas, com altitude de
            {` ${data.source.altitude} m`}. Esta página voltou como uma consulta independente. Ela ainda
            não altera a fonte usada pelo Hero da Home nem reativa o coletor histórico aposentado.
          </p>
        </div>

        <div className="embrapa-station-source__actions">
          <a href={EMBRAPA_MONITOR_URL} target="_blank" rel="noreferrer">
            Abrir dados na Embrapa <span aria-hidden="true">↗</span>
          </a>
          <Link to="/status-dos-dados">Ver dados e fontes do portal</Link>
        </div>
      </section>
    </article>
  );
}
