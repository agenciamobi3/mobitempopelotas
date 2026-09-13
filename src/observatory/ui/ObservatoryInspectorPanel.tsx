import { LoaderCircle, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  selectObservatoryInspectorHour,
  type ObservatoryInspectorPoint,
} from "../core/ObservatoryInspector";
import {
  getObservatoryPointForecast,
  type ObservatoryInspectorResponse,
} from "../data/observatory-inspector.functions";
import "./ObservatoryInspector.css";

type ObservatoryInspectorPanelProps = {
  point: ObservatoryInspectorPoint;
  selectedAt: string | null;
  onClose: () => void;
};

function formatTimestamp(value: string | null) {
  if (!value) return "Horário indisponível";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function valueOrDash(value: number | null, suffix: string, digits = 0) {
  if (value === null || !Number.isFinite(value)) return "Não informado";
  return `${value.toFixed(digits).replace(".", ",")}${suffix}`;
}

function windDirection(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Não informado";
  const directions = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
  const index = Math.round((((value % 360) + 360) % 360) / 45) % directions.length;
  return `${directions[index]} · ${Math.round(value)}°`;
}

export function ObservatoryInspectorPanel({
  point,
  selectedAt,
  onClose,
}: ObservatoryInspectorPanelProps) {
  const [snapshot, setSnapshot] = useState<ObservatoryInspectorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const requestRevisionRef = useRef(0);

  useEffect(() => {
    const revision = ++requestRevisionRef.current;
    setLoading(true);
    setSnapshot(null);

    void getObservatoryPointForecast({ data: point })
      .then((result) => {
        if (requestRevisionRef.current !== revision) return;
        setSnapshot(result);
      })
      .catch((error) => {
        if (requestRevisionRef.current !== revision) return;
        console.warn("[observatory] Falha ao abrir o inspetor do ponto.", error);
        setSnapshot({
          status: "unavailable",
          point,
          hours: [],
          source: null,
          message: "Não foi possível consultar este ponto agora.",
        });
      })
      .finally(() => {
        if (requestRevisionRef.current === revision) setLoading(false);
      });

    return () => {
      requestRevisionRef.current += 1;
    };
  }, [point.latitude, point.longitude]);

  const selectedHour = useMemo(
    () => (snapshot?.status === "live" ? selectObservatoryInspectorHour(snapshot.hours, selectedAt) : null),
    [snapshot, selectedAt],
  );

  return (
    <aside className="observatory-inspector" aria-label="Previsão no ponto selecionado" aria-live="polite">
      <header className="observatory-inspector__header">
        <div>
          <span className="observatory-inspector__eyebrow">Previsão no ponto</span>
          <strong>
            {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
          </strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar inspetor do ponto" title="Fechar">
          <X aria-hidden="true" size={17} />
        </button>
      </header>

      <p className="observatory-inspector__notice">
        Dados modelados para este local. Não são uma medição feita por estação meteorológica.
      </p>

      {loading ? (
        <div className="observatory-inspector__state" role="status">
          <LoaderCircle aria-hidden="true" size={18} />
          <span>Consultando a previsão deste ponto…</span>
        </div>
      ) : snapshot?.status !== "live" || !selectedHour ? (
        <div className="observatory-inspector__state is-error">
          <span>{snapshot?.message ?? "Não há dados utilizáveis para este ponto."}</span>
        </div>
      ) : (
        <>
          <div className="observatory-inspector__time">
            <span>Horário usado</span>
            <strong>{formatTimestamp(selectedHour.timestamp)}</strong>
          </div>

          <dl className="observatory-inspector__grid">
            <div>
              <dt>Temperatura</dt>
              <dd>{valueOrDash(selectedHour.temperatureC, " °C", 1)}</dd>
            </div>
            <div>
              <dt>Sensação</dt>
              <dd>{valueOrDash(selectedHour.apparentTemperatureC, " °C", 1)}</dd>
            </div>
            <div>
              <dt>Chuva</dt>
              <dd>{valueOrDash(selectedHour.precipitationProbabilityPercent, "%")}</dd>
              <small>{valueOrDash(selectedHour.precipitationMm, " mm", 1)}</small>
            </div>
            <div>
              <dt>Vento</dt>
              <dd>{valueOrDash(selectedHour.windSpeedKmh, " km/h")}</dd>
              <small>{windDirection(selectedHour.windDirectionDegrees)}</small>
            </div>
            <div>
              <dt>Rajada</dt>
              <dd>{valueOrDash(selectedHour.windGustKmh, " km/h")}</dd>
            </div>
            <div>
              <dt>Umidade</dt>
              <dd>{valueOrDash(selectedHour.relativeHumidityPercent, "%")}</dd>
            </div>
            <div>
              <dt>Pressão</dt>
              <dd>{valueOrDash(selectedHour.pressureHpa, " hPa")}</dd>
            </div>
            <div>
              <dt>Nuvens</dt>
              <dd>{valueOrDash(selectedHour.cloudCoverPercent, "%")}</dd>
            </div>
          </dl>

          <footer className="observatory-inspector__source">
            <span>Fonte: {snapshot.source.name} · {snapshot.source.model}</span>
            <span>Previsão por modelo para o ponto selecionado.</span>
          </footer>
        </>
      )}
    </aside>
  );
}
