import { ExternalLink, MapPin, Radio, Waves } from "lucide-react";

import type {
  AnaRhnRegionalInventoryData,
  AnaRhnRegionalStation,
} from "@/lib/hydrology/ana-rhn-regional.server";

import "./AnaRhnRegionalStations.css";

type AnaRhnRegionalStationsProps = {
  data: AnaRhnRegionalInventoryData;
};

const PELOTAS = { latitude: -31.7719, longitude: -52.3371 } as const;
const PLOT_WIDTH = 680;
const PLOT_HEIGHT = 430;
const PLOT_PADDING = 42;

function formatDistance(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value)} km`;
}

function formatArea(value: number | null) {
  if (value === null) return null;
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value)} km²`;
}

function operatingLabel(value: boolean | null) {
  if (value === true) return "Operando";
  if (value === false) return "Fora de operação";
  return "Situação não informada";
}

function stationPlace(station: AnaRhnRegionalStation) {
  return [station.municipality, station.state].filter(Boolean).join(" / ") || "Local não informado";
}

function stationContext(station: AnaRhnRegionalStation) {
  return [station.river, station.subBasin ?? station.basin].filter(Boolean).join(" · ");
}

function plotPoints(stations: AnaRhnRegionalStation[]) {
  const coordinates = [
    ...stations.map((station) => ({ latitude: station.latitude, longitude: station.longitude })),
    PELOTAS,
  ];
  const latitudes = coordinates.map(({ latitude }) => latitude);
  const longitudes = coordinates.map(({ longitude }) => longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeSpan = Math.max(0.1, maxLatitude - minLatitude);
  const longitudeSpan = Math.max(0.1, maxLongitude - minLongitude);

  const project = (latitude: number, longitude: number) => ({
    x:
      PLOT_PADDING +
      ((longitude - minLongitude) / longitudeSpan) * (PLOT_WIDTH - PLOT_PADDING * 2),
    y:
      PLOT_HEIGHT -
      PLOT_PADDING -
      ((latitude - minLatitude) / latitudeSpan) * (PLOT_HEIGHT - PLOT_PADDING * 2),
  });

  return {
    stations: stations.map((station) => ({ ...station, point: project(station.latitude, station.longitude) })),
    pelotas: project(PELOTAS.latitude, PELOTAS.longitude),
  };
}

export function AnaRhnRegionalStations({ data }: AnaRhnRegionalStationsProps) {
  if (data.status !== "live" || data.stations.length === 0) return null;

  const points = plotPoints(data.stations);
  const operatingCount = data.stations.filter((station) => station.operating === true).length;
  const telemetryCount = data.stations.filter((station) =>
    station.instruments.includes("Telemetria"),
  ).length;

  return (
    <section className="ana-rhn-regional" aria-labelledby="ana-rhn-regional-title">
      <header className="ana-rhn-regional__heading">
        <div>
          <span>Rede Hidrometeorológica Nacional</span>
          <h2 id="ana-rhn-regional-title">Estações oficiais na região de Pelotas</h2>
        </div>
        <p>
          {data.stations.length} estações do cadastro público da ANA/SNIRH encontradas em até {data.searchRadiusKm} km de Pelotas.
        </p>
      </header>

      <div className="ana-rhn-regional__overview">
        <figure className="ana-rhn-regional__plot" aria-labelledby="ana-rhn-regional-plot-title">
          <figcaption id="ana-rhn-regional-plot-title">Distribuição geográfica das estações encontradas</figcaption>
          <svg viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`} role="img" aria-label="Posição relativa das estações ANA e de Pelotas">
            <path d="M42 110 H638 M42 215 H638 M42 320 H638" aria-hidden="true" />
            <path d="M165 42 V388 M340 42 V388 M515 42 V388" aria-hidden="true" />

            {points.stations.map((station) => (
              <g key={station.id} transform={`translate(${station.point.x} ${station.point.y})`}>
                <circle r={station.operating === true ? 7 : 5} />
                <title>{`${station.name} · ${stationPlace(station)} · ${formatDistance(station.distanceKm)} de Pelotas`}</title>
              </g>
            ))}

            <g className="ana-rhn-regional__pelotas" transform={`translate(${points.pelotas.x} ${points.pelotas.y})`}>
              <circle r="12" />
              <circle r="4" />
              <text x="16" y="5">Pelotas</text>
            </g>
          </svg>
          <p>Os pontos usam as coordenadas publicadas no inventário da rede. Pelotas aparece apenas como referência de localização.</p>
        </figure>

        <div className="ana-rhn-regional__numbers" aria-label="Resumo do inventário consultado">
          <article>
            <MapPin aria-hidden="true" />
            <div><strong>{data.stations.length}</strong><span>estações encontradas</span></div>
          </article>
          <article>
            <Waves aria-hidden="true" />
            <div><strong>{operatingCount}</strong><span>marcadas como operando</span></div>
          </article>
          <article>
            <Radio aria-hidden="true" />
            <div><strong>{telemetryCount}</strong><span>com telemetria cadastrada</span></div>
          </article>
        </div>
      </div>

      <div className="ana-rhn-regional__stations">
        {data.stations.map((station) => {
          const area = formatArea(station.drainageAreaKm2);
          const context = stationContext(station);
          return (
            <article className="ana-rhn-station" key={station.id}>
              <header>
                <div>
                  <h3>{station.name}</h3>
                  <p>{stationPlace(station)}{context ? ` · ${context}` : ""}</p>
                </div>
                <strong>{operatingLabel(station.operating)}</strong>
              </header>

              <dl>
                {station.code ? <div><dt>Código</dt><dd>{station.code}</dd></div> : null}
                {station.stationType ? <div><dt>Cadastro</dt><dd>{station.stationType}</dd></div> : null}
                <div><dt>Distância de Pelotas</dt><dd>{formatDistance(station.distanceKm)}</dd></div>
                {area ? <div><dt>Área de drenagem</dt><dd>{area}</dd></div> : null}
                {station.responsible ? <div><dt>Responsável</dt><dd>{station.responsible}</dd></div> : null}
                {station.operator ? <div><dt>Operadora</dt><dd>{station.operator}</dd></div> : null}
              </dl>

              {station.instruments.length > 0 ? (
                <p className="ana-rhn-station__instruments">
                  <strong>Instrumentos cadastrados:</strong> {station.instruments.join(" · ")}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      <footer className="ana-rhn-regional__footer">
        <div>
          <h3>Como interpretar esta seção</h3>
          <p>
            Este inventário mostra estações cadastradas na rede nacional próximas de Pelotas. Ele não substitui a leitura atual do Laranjal e não transforma automaticamente uma estação próxima em referência para a cidade. Situação, instrumentos e instituições são reproduzidos do cadastro consultado.
          </p>
        </div>
        <a href={data.source.layerUrl} target="_blank" rel="noreferrer">
          Consultar inventário da ANA <ExternalLink aria-hidden="true" />
        </a>
      </footer>
    </section>
  );
}
