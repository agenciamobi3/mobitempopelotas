import { CloudLightning, Radar, Satellite, type LucideIcon } from "lucide-react";

import {
  formatRedemetDateTime,
  isUsableRedemetObservedAt,
} from "@/lib/redemet/redemet-display-time";
import type {
  RedemetImageLayerResponse,
  RedemetOverview,
  RedemetStormLayerResponse,
  RedemetStormPoint,
} from "@/lib/redemet/redemet.types";

import "./RedemetDerivedContext.css";

const PELOTAS = { latitude: -31.7654, longitude: -52.3376 } as const;
const EARTH_RADIUS_KM = 6_371;

type FrameLayer = Pick<RedemetImageLayerResponse | RedemetStormLayerResponse, "frames" | "sourceLabel">;

function radians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceFromPelotas(point: RedemetStormPoint) {
  const latitudeDelta = radians(point.latitude - PELOTAS.latitude);
  const longitudeDelta = radians(point.longitude - PELOTAS.longitude);
  const latitudeA = radians(PELOTAS.latitude);
  const latitudeB = radians(point.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

function usableFrames(layer: FrameLayer) {
  return layer.frames.filter((frame) => isUsableRedemetObservedAt(frame.observedAt));
}

function CollectionRow({
  icon: Icon,
  label,
  layer,
}: {
  icon: LucideIcon;
  label: string;
  layer: FrameLayer;
}) {
  const frames = usableFrames(layer);
  const visible = frames.slice(-6);

  return (
    <article className="redemet-collections__row">
      <Icon aria-hidden="true" />
      <div className="redemet-collections__identity">
        <span>{label}</span>
        <strong>{frames.length ? `${frames.length} coletas com horário` : "Nenhuma coleta com horário"}</strong>
        <small>{layer.sourceLabel}</small>
      </div>
      <div className="redemet-collections__times" aria-label={`Horários recebidos de ${label}`}>
        {visible.length ? (
          visible.map((frame, index) => (
            <time dateTime={frame.observedAt ?? undefined} key={`${frame.observedAt ?? "sem-horario"}-${index}`}>
              {formatRedemetDateTime(frame.observedAt)}
            </time>
          ))
        ) : (
          <span>Sem horário recebido</span>
        )}
      </div>
    </article>
  );
}

function StormDistanceReading({ layer }: { layer: RedemetStormLayerResponse }) {
  const frame = usableFrames(layer).at(-1) ?? null;
  const hasUsableFrame = frame !== null;
  const points = frame && "points" in frame ? frame.points : [];
  const distances = points.map(distanceFromPelotas).sort((a, b) => a - b);
  const nearest = distances[0] ?? null;
  const near = distances.filter((distance) => distance <= 50).length;
  const middle = distances.filter((distance) => distance > 50 && distance <= 150).length;
  const regional = distances.filter((distance) => distance > 150 && distance <= 450).length;

  return (
    <div className="redemet-collections__storms" data-stsc-frame={hasUsableFrame ? "available" : "unavailable"}>
      <div>
        <span>Raios na coleta mais recente</span>
        <h3>
          {!hasUsableFrame
            ? "Sem coleta STSC com horário utilizável"
            : nearest === null
              ? "Nenhum raio detectado na última coleta recebida"
              : `Raio mais próximo a cerca de ${Math.round(nearest)} km de Pelotas`}
        </h3>
        <p>
          {hasUsableFrame
            ? "As faixas abaixo usam a distância em linha reta entre Pelotas e as coordenadas recebidas."
            : "Sem um quadro com horário válido, a página não calcula as faixas de distância."}
        </p>
      </div>
      <dl aria-label="Raios detectados por distância de Pelotas">
        <div><dt>Até 50 km</dt><dd>{hasUsableFrame ? near : "—"}</dd></div>
        <div><dt>50 a 150 km</dt><dd>{hasUsableFrame ? middle : "—"}</dd></div>
        <div><dt>150 a 450 km</dt><dd>{hasUsableFrame ? regional : "—"}</dd></div>
      </dl>
    </div>
  );
}

export function RedemetDerivedContext({ data }: { data: RedemetOverview }) {
  const satelliteLabel = data.satellite.provider === "INMET"
    ? "Satélite INMET · contingência"
    : "Satélite REDEMET · Realçado";

  return (
    <section className="redemet-collections" aria-labelledby="redemet-collections-title">
      <header>
        <div>
          <span>Horários recebidos</span>
          <h2 id="redemet-collections-title">Coletas desta atualização</h2>
        </div>
        <p>Consulte os horários para saber a idade de cada imagem ou leitura.</p>
      </header>

      <div className="redemet-collections__list">
        <CollectionRow icon={Radar} label="Radar REDEMET" layer={data.radar} />
        <CollectionRow icon={Satellite} label={satelliteLabel} layer={data.satellite} />
        <CollectionRow icon={CloudLightning} label="Raios REDEMET" layer={data.storms} />
      </div>

      <StormDistanceReading layer={data.storms} />
    </section>
  );
}
