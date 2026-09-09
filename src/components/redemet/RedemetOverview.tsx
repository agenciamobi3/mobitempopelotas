import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock3,
  CloudLightning,
  ExternalLink,
  Image as ImageIcon,
  Maximize2,
  Pause,
  Play,
  Radar,
  RotateCcw,
  Satellite,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  formatRedemetDateTime,
  getRedemetFreshness,
  latestUsableRedemetFrameTime,
  redemetFrameDisplayLabel,
} from "@/lib/redemet/redemet-display-time";
import type {
  RedemetImageLayerResponse,
  RedemetOverview as RedemetOverviewData,
  RedemetStormLayerResponse,
} from "@/lib/redemet/redemet.types";

import { RadarMapFrame } from "./RadarMapFrame";
import "./RedemetOverview.css";

const REDEMET_URL = "https://redemet.decea.mil.br/";
const FRAME_INTERVAL_MS = 1_600;

type ObservedFrame = { observedAt: string | null };
type SourceLayer = RedemetImageLayerResponse | RedemetStormLayerResponse;

function latestFrameTime(frames: readonly ObservedFrame[]) {
  return latestUsableRedemetFrameTime(frames);
}

function latestObservedAt(data: RedemetOverviewData) {
  return latestFrameTime([
    ...data.radar.frames,
    ...data.satellite.frames,
    ...data.inmetSatellite.frames,
    ...data.storms.frames,
  ]);
}

function sourceHasData(layer: SourceLayer) {
  return layer.available && layer.frames.length > 0;
}

function sourceCountLabel(count: number) {
  if (count === 1) return "1 fonte com dados";
  return `${count} fontes com dados`;
}

function frameCountLabel(count: number, storm = false) {
  if (storm) return count === 1 ? "1 horário" : `${count} horários`;
  return count === 1 ? "1 imagem" : `${count} imagens`;
}

function FreshnessBadge({ value, reading = false }: { value: string | null; reading?: boolean }) {
  const freshness = getRedemetFreshness(value);
  const label = reading
    ? freshness.label.replace(/^Imagem\b/i, "Leitura")
    : freshness.label;

  return (
    <span className={`redemet-freshness is-${freshness.tone}`}>
      <i aria-hidden="true" /> {label}
    </span>
  );
}

function SourceState({ layer, refreshing }: { layer: SourceLayer; refreshing: boolean }) {
  const hasData = sourceHasData(layer);
  const label = hasData ? "Recebido" : refreshing ? "Buscando coleta" : "Sem coleta recente";
  const className = hasData ? "is-live" : refreshing ? "is-loading" : "is-unavailable";

  return (
    <span className={`redemet-source-state ${className}`}>
      <i aria-hidden="true" /> {label}
    </span>
  );
}

function SourceSummaryRow({
  icon: Icon,
  title,
  description,
  layer,
  refreshing,
  storm = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  layer: SourceLayer;
  refreshing: boolean;
  storm?: boolean;
}) {
  const latest = latestFrameTime(layer.frames);

  return (
    <article className="redemet-source-row">
      <Icon aria-hidden="true" />
      <div className="redemet-source-row__name">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <SourceState layer={layer} refreshing={refreshing} />
      <div className="redemet-source-row__time">
        <small>Última coleta</small>
        <strong>{formatRedemetDateTime(latest)}</strong>
      </div>
      <b>{frameCountLabel(layer.frames.length, storm)}</b>
    </article>
  );
}

function useFramePlayback(frameCount: number, currentIndex: number) {
  const safeIndex = Math.max(0, Math.min(Math.max(0, frameCount - 1), currentIndex));
  const [selectedIndex, setSelectedIndex] = useState(safeIndex);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setSelectedIndex(safeIndex);
    setIsPlaying(false);
  }, [frameCount, safeIndex]);

  useEffect(() => {
    if (!isPlaying || frameCount <= 1) return;
    const timer = window.setInterval(() => {
      setSelectedIndex((index) => (index >= frameCount - 1 ? 0 : index + 1));
    }, FRAME_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [frameCount, isPlaying]);

  function selectFrame(index: number) {
    setIsPlaying(false);
    setSelectedIndex(Math.max(0, Math.min(Math.max(0, frameCount - 1), index)));
  }

  return {
    selectedIndex,
    isPlaying,
    selectFrame,
    togglePlayback: () => frameCount > 1 && setIsPlaying((value) => !value),
    showLatest: () => {
      setIsPlaying(false);
      setSelectedIndex(safeIndex);
    },
    isLatest: selectedIndex === safeIndex,
  };
}

function EmptyLayer({
  sourceName,
  refreshing,
}: {
  sourceName: string;
  refreshing: boolean;
}) {
  return (
    <div className="redemet-layer-empty" role="status">
      <ImageIcon aria-hidden="true" />
      <div>
        <strong>{refreshing ? "Buscando a coleta mais recente" : "Nenhuma imagem recente recebida"}</strong>
        <p>
          {refreshing
            ? `A página já abriu e continua consultando ${sourceName} em segundo plano.`
            : `Nesta consulta, ${sourceName} não entregou uma imagem recente. Nada é preenchido manualmente.`}
        </p>
      </div>
    </div>
  );
}

function ImageLayerPanel({
  id,
  layer,
  kind,
  kicker,
  title,
  description,
  refreshing,
  featured = false,
}: {
  id: string;
  layer: RedemetImageLayerResponse;
  kind: "radar" | "satellite";
  kicker: string;
  title: string;
  description: string;
  refreshing: boolean;
  featured?: boolean;
}) {
  const playback = useFramePlayback(layer.frames.length, layer.currentIndex);
  const selected = layer.frames[playback.selectedIndex] ?? layer.frames.at(-1) ?? null;
  const hasImage = layer.available && selected !== null;
  const Icon = kind === "radar" ? Radar : Satellite;
  const sourceName = layer.provider === "INMET" ? "o INMET" : "a REDEMET";

  return (
    <section className={`redemet-monitor${featured ? " is-featured" : ""}`} id={id} aria-labelledby={`${id}-title`}>
      <header className="redemet-monitor__heading">
        <div>
          <span><Icon aria-hidden="true" /> {kicker}</span>
          <h2 id={`${id}-title`}>{title}</h2>
        </div>
        <p>{description}</p>
      </header>

      <div className="redemet-monitor__surface">
        {hasImage && selected ? (
          <figure className="redemet-image-frame" data-freshness={getRedemetFreshness(selected.observedAt).tone}>
            {kind === "radar" ? (
              <RadarMapFrame
                frame={selected}
                alt={`${title}, registrada em ${formatRedemetDateTime(selected.observedAt)}`}
              />
            ) : (
              <img
                src={selected.imageUrl}
                alt={`${title}, registrada em ${formatRedemetDateTime(selected.observedAt)}`}
                loading="lazy"
                decoding="async"
              />
            )}
            <figcaption>
              <div>
                <strong>{formatRedemetDateTime(selected.observedAt)}</strong>
                <span>{redemetFrameDisplayLabel(selected)}</span>
              </div>
              <FreshnessBadge value={selected.observedAt} />
            </figcaption>
          </figure>
        ) : (
          <EmptyLayer sourceName={sourceName} refreshing={refreshing} />
        )}

        {hasImage && selected ? (
          <div className="redemet-frame-controls" aria-label={`Coletas de ${title}`}>
            <button
              type="button"
              onClick={() => playback.selectFrame(playback.selectedIndex - 1)}
              disabled={playback.selectedIndex === 0}
              aria-label="Ver coleta anterior"
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <label>
              <span>Coleta {playback.selectedIndex + 1} de {layer.frames.length}</span>
              <input
                type="range"
                min="0"
                max={Math.max(0, layer.frames.length - 1)}
                value={playback.selectedIndex}
                onChange={(event) => playback.selectFrame(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              onClick={() => playback.selectFrame(playback.selectedIndex + 1)}
              disabled={playback.selectedIndex >= layer.frames.length - 1}
              aria-label="Ver próxima coleta"
            >
              <ArrowRight aria-hidden="true" />
            </button>
            <div className="redemet-frame-tools">
              <button
                type="button"
                onClick={playback.togglePlayback}
                disabled={layer.frames.length <= 1}
                aria-pressed={playback.isPlaying}
              >
                {playback.isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                {playback.isPlaying ? "Pausar" : "Reproduzir"}
              </button>
              <button type="button" onClick={playback.showLatest} disabled={playback.isLatest}>
                <RotateCcw aria-hidden="true" /> Mais recente
              </button>
              <a href={selected.imageUrl} target="_blank" rel="noopener noreferrer">
                <Maximize2 aria-hidden="true" /> Abrir imagem
              </a>
            </div>
          </div>
        ) : null}
      </div>

      <footer className="redemet-monitor__source">
        <span>{layer.sourceLabel} · {layer.product}</span>
        <a href={layer.officialUrl ?? REDEMET_URL} target="_blank" rel="noopener noreferrer">
          Fonte oficial <ExternalLink aria-hidden="true" />
        </a>
      </footer>
    </section>
  );
}

function StormPanel({ layer, refreshing }: { layer: RedemetStormLayerResponse; refreshing: boolean }) {
  const playback = useFramePlayback(layer.frames.length, layer.currentIndex);
  const selected = layer.frames[playback.selectedIndex] ?? layer.frames.at(-1) ?? null;
  const hasReading = layer.available && selected !== null;
  const count = selected?.points.length ?? 0;

  return (
    <section className="redemet-monitor redemet-storms" id="trovoadas-regionais" aria-labelledby="redemet-storms-title">
      <header className="redemet-monitor__heading">
        <div>
          <span><CloudLightning aria-hidden="true" /> Raios detectados</span>
          <h2 id="redemet-storms-title">Atividade elétrica na região</h2>
        </div>
        <p>Os registros mostram descargas elétricas detectadas pela REDEMET. Eles não são um alerta de risco.</p>
      </header>

      <div className="redemet-storms__reading">
        <div>
          <small>Coleta selecionada</small>
          <strong>{hasReading ? formatRedemetDateTime(selected?.observedAt ?? null) : "Horário não recebido"}</strong>
          <FreshnessBadge value={selected?.observedAt ?? null} reading />
        </div>
        <div>
          <strong>{hasReading ? count : "—"}</strong>
          <span>
            {!hasReading
              ? refreshing ? "buscando coleta" : "sem coleta recente"
              : count === 0 ? "nenhum raio detectado"
              : count === 1 ? "raio detectado"
              : "raios detectados"}
          </span>
        </div>
      </div>

      {hasReading ? (
        <div className="redemet-storm-controls">
          <button type="button" onClick={() => playback.selectFrame(playback.selectedIndex - 1)} disabled={playback.selectedIndex === 0} aria-label="Ver horário anterior">
            <ArrowLeft aria-hidden="true" />
          </button>
          <label>
            <span>Coleta {playback.selectedIndex + 1} de {layer.frames.length}</span>
            <input type="range" min="0" max={Math.max(0, layer.frames.length - 1)} value={playback.selectedIndex} onChange={(event) => playback.selectFrame(Number(event.target.value))} />
          </label>
          <button type="button" onClick={() => playback.selectFrame(playback.selectedIndex + 1)} disabled={playback.selectedIndex >= layer.frames.length - 1} aria-label="Ver próximo horário">
            <ArrowRight aria-hidden="true" />
          </button>
          <div className="redemet-frame-tools">
            <button type="button" onClick={playback.togglePlayback} disabled={layer.frames.length <= 1} aria-pressed={playback.isPlaying}>
              {playback.isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              {playback.isPlaying ? "Pausar" : "Reproduzir"}
            </button>
            <button type="button" onClick={playback.showLatest} disabled={playback.isLatest}>
              <RotateCcw aria-hidden="true" /> Mais recente
            </button>
          </div>
        </div>
      ) : (
        <div className="redemet-storms__empty" role="status">
          {refreshing ? "Buscando a coleta mais recente de atividade elétrica." : "Nenhuma coleta recente de atividade elétrica foi recebida nesta consulta."}
        </div>
      )}

      <div className="redemet-safety-note">
        <AlertTriangle aria-hidden="true" />
        <p>Para risco e segurança, consulte os <Link to="/alertas">avisos oficiais para Pelotas</Link>.</p>
      </div>
    </section>
  );
}

export function RedemetOverview({
  data,
  isRefreshing = false,
}: {
  data: RedemetOverviewData;
  isRefreshing?: boolean;
}) {
  const satelliteUsesInmetFallback = data.satellite.provider === "INMET";
  const allSources: SourceLayer[] = satelliteUsesInmetFallback
    ? [data.radar, data.satellite, data.storms]
    : [data.radar, data.satellite, data.inmetSatellite, data.storms];
  const availableSources = allSources.filter(sourceHasData).length;
  const latest = latestObservedAt(data);
  const latestFreshness = getRedemetFreshness(latest);
  const selectedSatelliteTitle = satelliteUsesInmetFallback
    ? "Satélite INMET · contingência"
    : "Satélite REDEMET";
  const selectedSatelliteDescription = satelliteUsesInmetFallback
    ? "Imagem GOES usada como contingência oficial"
    : "Nuvens na Região Sul";

  return (
    <div className="redemet-page">
      <section className="redemet-hero" aria-labelledby="redemet-page-title">
        <div className="redemet-hero__copy">
          <span>Pelotas · monitoramento regional</span>
          <h1 id="redemet-page-title">Radar, satélite e raios na região de Pelotas</h1>
          <p>
            Veja as coletas mais recentes recebidas da REDEMET/DECEA e do INMET. Cada imagem mantém o horário e a fonte para você saber exatamente o que está olhando.
          </p>
          <div className="redemet-hero__actions">
            <a href="#radar-regional">Ver radar <ArrowRight aria-hidden="true" /></a>
            <Link to="/alertas">Avisos oficiais <ShieldAlert aria-hidden="true" /></Link>
          </div>
        </div>
        <aside data-freshness={latestFreshness.tone}>
          <Clock3 aria-hidden="true" />
          <span>Última coleta recebida</span>
          <strong>{formatRedemetDateTime(latest)}</strong>
          <FreshnessBadge value={latest} />
          <small>{sourceCountLabel(availableSources)}{isRefreshing ? " · buscando fontes restantes" : ""}</small>
        </aside>
      </section>

      <section className="redemet-source-overview" aria-labelledby="redemet-source-overview-title">
        <header>
          <div>
            <span>Coletas reais recebidas</span>
            <h2 id="redemet-source-overview-title">O que chegou das fontes agora</h2>
          </div>
          <p>Os horários podem ser diferentes entre radar, satélite e raios. Isso é normal: cada fonte atualiza no seu próprio ritmo.</p>
        </header>
        <div className="redemet-source-overview__list">
          <SourceSummaryRow icon={Radar} title="Radar REDEMET" description="Áreas de chuva" layer={data.radar} refreshing={isRefreshing} />
          <SourceSummaryRow
            icon={Satellite}
            title={selectedSatelliteTitle}
            description={selectedSatelliteDescription}
            layer={data.satellite}
            refreshing={isRefreshing}
          />
          {!satelliteUsesInmetFallback ? (
            <SourceSummaryRow icon={Satellite} title="Satélite INMET" description="Imagem GOES" layer={data.inmetSatellite} refreshing={isRefreshing} />
          ) : null}
          <SourceSummaryRow icon={CloudLightning} title="Raios REDEMET" description="Descargas elétricas" layer={data.storms} refreshing={isRefreshing} storm />
        </div>
      </section>

      <ImageLayerPanel
        id="radar-regional"
        layer={data.radar}
        kind="radar"
        kicker="Radar REDEMET"
        title="Onde aparecem áreas de chuva"
        description="Use a sequência para comparar as últimas imagens recebidas. O radar mostra a região, não uma rua específica."
        refreshing={isRefreshing}
        featured
      />

      <section className="redemet-satellite-section" aria-labelledby="redemet-satellite-title">
        <header>
          <div>
            <span>Satélites</span>
            <h2 id="redemet-satellite-title">Como estão as nuvens sobre a Região Sul</h2>
          </div>
          <p>
            {satelliteUsesInmetFallback
              ? "A REDEMET não entregou uma imagem utilizável nesta composição. A camada principal usa a contingência oficial do INMET e permanece identificada como INMET."
              : "Nuvens no satélite não significam necessariamente chuva no solo. Compare o horário com o radar e a previsão."}
          </p>
        </header>
        <div className="redemet-satellite-grid">
          <ImageLayerPanel
            id={satelliteUsesInmetFallback ? "satelite-contingencia-inmet" : "satelite-redemet"}
            layer={data.satellite}
            kind="satellite"
            kicker={selectedSatelliteTitle}
            title={satelliteUsesInmetFallback ? "Imagem GOES da Região Sul" : "Imagem de nuvens pela REDEMET"}
            description={satelliteUsesInmetFallback
              ? "Contingência oficial usada somente porque a camada REDEMET selecionada não veio utilizável nesta atualização."
              : "Veja a mudança da cobertura de nuvens entre as coletas recebidas."}
            refreshing={isRefreshing}
          />
          {!satelliteUsesInmetFallback ? (
            <ImageLayerPanel
              id="satelite-inmet"
              layer={data.inmetSatellite}
              kind="satellite"
              kicker="Satélite INMET"
              title="Imagem GOES da Região Sul"
              description="Uma segunda fonte para comparar a cobertura de nuvens na região."
              refreshing={isRefreshing}
            />
          ) : null}
        </div>
      </section>

      <StormPanel layer={data.storms} refreshing={isRefreshing} />

      <section className="redemet-reading-note">
        <div>
          <span>Leitura rápida</span>
          <h2>Imagem observada não é previsão</h2>
        </div>
        <p>Radar, satélite e raios mostram registros já feitos. Para saber o que pode acontecer nas próximas horas, consulte a previsão e os avisos oficiais.</p>
        <Link to="/tempo-hoje-pelotas">Ver previsão de hoje <ArrowRight aria-hidden="true" /></Link>
      </section>
    </div>
  );
}
