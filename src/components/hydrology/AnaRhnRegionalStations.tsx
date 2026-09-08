import { CheckCircle2, ExternalLink, MapPin, Radio } from "lucide-react";

import type { AnaRhnHydrographyData } from "@/lib/hydrology/ana-rhn-hydrography.server";
import type {
  AnaRhnRegionalInventoryData,
  AnaRhnRegionalStation,
} from "@/lib/hydrology/ana-rhn-regional.server";
import { AnaRhnRegionalMap } from "./AnaRhnRegionalMap";

import "./AnaRhnRegionalStations.css";

type AnaRhnRegionalStationsProps = {
  data: AnaRhnRegionalInventoryData;
  hydrography: AnaRhnHydrographyData;
};

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

export function AnaRhnRegionalStations({ data, hydrography }: AnaRhnRegionalStationsProps) {
  if (data.status !== "live" || data.stations.length === 0) return null;

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
        <AnaRhnRegionalMap stations={data.stations} hydrography={hydrography} />

        <div className="ana-rhn-regional__numbers" aria-label="Resumo do inventário consultado">
          <article>
            <MapPin aria-hidden="true" />
            <div><strong>{data.stations.length}</strong><span>estações encontradas</span></div>
          </article>
          <article>
            <CheckCircle2 aria-hidden="true" />
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
            Este inventário mostra estações cadastradas na rede nacional próximas de Pelotas. O mapa acrescenta rios principais e massas d’água publicados pela ANA/SNIRH quando essas camadas estão disponíveis. Isso não substitui a leitura atual do Laranjal nem transforma automaticamente uma estação próxima em referência para a cidade.
          </p>
        </div>
        <a href={data.source.layerUrl} target="_blank" rel="noreferrer">
          Consultar inventário da ANA <ExternalLink aria-hidden="true" />
        </a>
      </footer>
    </section>
  );
}
