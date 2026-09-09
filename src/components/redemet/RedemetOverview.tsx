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
  RedemetSatelliteType,
  RedemetStormLayerResponse,
} from "@/lib/redemet/redemet.types";

import { RadarMapFrame } from "./RadarMapFrame";
import { StormMapFrame } from "./StormMapFrame";
import "./RedemetOverview.css";

const REDEMET_URL = "https://redemet.decea.mil.br/";
const FRAME_INTERVAL_MS = 1_600;

const SATELLITE_PRODUCTS: Array<{
  type: RedemetSatelliteType;
  label: string;
  description: string;
}> = [
  {
    type: "realcada",
    label: "Realçado",
    description: "Use a sequência para comparar contrastes e temperaturas de topo de nuvem.",
  },
  {
    type: "ir",
    label: "Infravermelho",
    description:
      "Use a sequência para comparar diferenças térmicas das nuvens durante o dia e a noite.",
  },
  {
    type: "vis",
    label: "Visível",
    description:
      "Use a sequência para acompanhar a cobertura de nuvens enquanto houver luz solar.",
  },
];

type ObservedFrame = { observedAt: string | null };
type SourceLayer = RedemetImageLayerResponse | RedemetStormLayerResponse;

function latestFrameTime(frames: readonly ObservedFrame[]) {
  return latestUsableRedemetFrameTime(frames);
}

function latestObservedAt(
  data: RedemetOverviewData,
  selectedSatellite: RedemetImageLayerResponse,
  secondarySatellite: RedemetImageLayerResponse,
) {
  return latestFrameTime([
    ...data.radar.frames,
    ...selectedSatellite.frames,
    ...secondarySatellite.frames,
    ...data.storms.frames,
  ]);
}

function sourceHasData(layer: SourceLayer) {
  return layer.available && layer.frames.length > 0;
}

function awaitingDaylight(layer: SourceLayer) {
  return "availabilityReason" in layer && layer.availabilityReason === "daylight";
}

function sourceCountLabel(count: number) {
  if (count === 1) return "1 camada com dados";
  return `${count} camadas com dados`;
}

function frameCountLabel(count: number, storm = false) {
  if (storm) return count === 1 ? "1 horário" : `${count} horários`;
  return count === 1 ? "1 imagem" : `${count} imagens`;
}

function satelliteProduct(type: RedemetSatelliteType) {
  return SATELLITE_PRODUCTS.find((product) => product.type === type) ?? SATELLITE_PRODUCTS[0]!;
}

function formatExpectedSatelliteDateTime(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function emptyBrowserSatelliteLayer(
  type: RedemetSatelliteType,
  error: string | null = null,
): RedemetImageLayerResponse {
  const label = satelliteProduct(type).label;
  return {
    configured: true,
    available: false,
    provider: "REDEMET / DECEA",
    product: `Satélite ${label.toLowerCase()}`,
    sourceLabel: "Satélite REDEMET",
    officialUrl: REDEMET_URL,
    frames: [],
    currentIndex: 0,
    updatedAt: "",
    error,
  };
}

async function fetchSatelliteProduct(type: RedemetSatelliteType, signal: AbortSignal) {
  const response = await fetch(`/api/redemet/satellite?type=${type}&frames=4`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(`Satélite respondeu com HTTP ${response.status}`);
  return response.json() as Promise<RedemetImageLayerResponse>;
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
  const daylight = awaitingDaylight(layer);
  const label = hasData
    ? refreshing
      ? "Atualizando"
      : "Recebido"
    : daylight
      ? "Aguardando luz solar"
      : refreshing
        ? "Buscando coleta"
        : "Sem coleta recente";
  const className = hasData
    ? refreshing
      ? "is-loading"
      : "is-live"
    : daylight
      ? "is-daylight"
      : refreshing
        ? "is-loading"
        : "is-unavailable";

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
  layer,
  sourceName,
  refreshing,
}: {
  layer: RedemetImageLayerResponse;
  sourceName: string;
  refreshing: boolean;
}) {
  const daylight = layer.availabilityReason === "daylight";
  const nextExpected = daylight
    ? formatExpectedSatelliteDateTime(layer.nextExpectedAt)
    : null;

  return (
    <div className="redemet-layer-empty" role="status">
      <ImageIcon aria-hidden="true" />
      <div>
        <strong>
          {daylight
            ? "Canal Visível aguardando luz solar"
            : refreshing
              ? "Buscando a coleta mais recente"
              : "Imagem indisponível nesta atualização"}
        </strong>
        <p>
          {daylight
            ? `O canal Visível usa luz solar refletida e volta a produzir imagem útil durante o dia.${nextExpected ? ` Próxima janela estimada: ${nextExpected}.` : ""}`
            : refreshing
              ? `A página continua consultando ${sourceName} em segundo plano.`
              : `Não recebemos uma imagem utilizável de ${sourceName} nesta atualização.`}
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
    <section
      className={`redemet-monitor${featured ? " is-featured" : ""}`}
      id={id}
      aria-labelledby={`${id}-title`}
    >
      <header className="redemet-monitor__heading">
        <div>
          <span><Icon aria-hidden="true" /> {kicker}</span>
          <h2 id={`${id}-title`}>{title}</h2>
        </div>
        <p>{description}</p>
      </header>

      <div className="redemet-monitor__surface">
        {hasImage && selected ? (
          <figure
            className="redemet-image-frame"
            data-freshness={getRedemetFreshness(selected.observedAt).tone}
          >
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
          <EmptyLayer layer={layer} sourceName={sourceName} refreshing={refreshing} />
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
    <section
      className="redemet-monitor redemet-storms"
      id="trovoadas-regionais"
      aria-labelledby="redemet-storms-title"
    >
      <header className="redemet-monitor__heading">
        <div>
          <span><CloudLightning aria-hidden="true" /> Raios detectados</span>
          <h2 id="redemet-storms-title">Atividade elétrica na região</h2>
        </div>
        <p>Veja no mapa as descargas recebidas em cada coleta da REDEMET.</p>
      </header>

      {hasReading && selected ? (
        <StormMapFrame frame={selected} />
      ) : (
        <div className="redemet-storms__empty" role="status">
          {refreshing
            ? "Buscando a coleta mais recente de atividade elétrica."
            : "Nenhuma coleta recente de atividade elétrica foi recebida nesta consulta."}
        </div>
      )}

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
              ? refreshing
                ? "buscando coleta"
                : "sem coleta recente"
              : count === 0
                ? "nenhum raio detectado"
                : count === 1
                  ? "raio detectado"
                  : "raios detectados"}
          </span>
        </div>
      </div>

      {hasReading ? (
        <div className="redemet-storm-controls">
          <button
            type="button"
            onClick={() => playback.selectFrame(playback.selectedIndex - 1)}
            disabled={playback.selectedIndex === 0}
            aria-label="Ver horário anterior"
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
            aria-label="Ver próximo horário"
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
          </div>
        </div>
      ) : null}

      <div className="redemet-safety-note">
        <AlertTriangle aria-hidden="true" />
        <p>
          Para risco e segurança, consulte os <Link to="/alertas">avisos oficiais para Pelotas</Link>.
        </p>
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
  const [selectedSatelliteType, setSelectedSatelliteType] = useState<RedemetSatelliteType>("realcada");
  const [satelliteLayers, setSatelliteLayers] = useState<
    Partial<Record<RedemetSatelliteType, RedemetImageLayerResponse>>
  >({ realcada: data.satellite });
  const [loadingSatelliteType, setLoadingSatelliteType] = useState<RedemetSatelliteType | null>(null);
  const [infraredPrefetching, setInfraredPrefetching] = useState(false);

  useEffect(() => {
    setSatelliteLayers((current) => ({ ...current, realcada: data.satellite }));
  }, [data.satellite]);

  useEffect(() => {
    if (selectedSatelliteType === "realcada") {
      setLoadingSatelliteType(null);
      return;
    }

    const type = selectedSatelliteType;
    if (satelliteLayers[type]) return;

    const controller = new AbortController();
    let active = true;
    setLoadingSatelliteType(type);

    void fetchSatelliteProduct(type, controller.signal)
      .then((payload) => {
        if (!active) return;
        setSatelliteLayers((current) => ({ ...current, [type]: payload }));
      })
      .catch((error) => {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setSatelliteLayers((current) => ({
          ...current,
          [type]: emptyBrowserSatelliteLayer(
            type,
            "Não foi possível consultar este produto de satélite agora.",
          ),
        }));
      })
      .finally(() => {
        if (!active) return;
        setLoadingSatelliteType((current) => (current === type ? null : current));
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [satelliteLayers, selectedSatelliteType]);

  useEffect(() => {
    if (satelliteLayers.ir || selectedSatelliteType === "ir") return;

    const controller = new AbortController();
    let active = true;
    setInfraredPrefetching(true);

    void fetchSatelliteProduct("ir", controller.signal)
      .then((payload) => {
        if (!active) return;
        setSatelliteLayers((current) => ({ ...current, ir: payload }));
      })
      .catch((error) => {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setSatelliteLayers((current) => ({
          ...current,
          ir: emptyBrowserSatelliteLayer(
            "ir",
            "Não foi possível consultar o infravermelho da REDEMET agora.",
          ),
        }));
      })
      .finally(() => {
        if (active) setInfraredPrefetching(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [satelliteLayers.ir, selectedSatelliteType]);

  const selectedProduct = satelliteProduct(selectedSatelliteType);
  const selectedSatellite = selectedSatelliteType === "realcada"
    ? data.satellite
    : satelliteLayers[selectedSatelliteType] ?? emptyBrowserSatelliteLayer(selectedSatelliteType);
  const selectedSatelliteRefreshing =
    isRefreshing || loadingSatelliteType === selectedSatelliteType;
  const satelliteUsesInmetFallback = selectedSatellite.provider === "INMET";

  const secondarySatelliteType: RedemetSatelliteType = selectedSatelliteType === "ir" ? "realcada" : "ir";
  const secondaryProduct = satelliteProduct(secondarySatelliteType);
  const secondaryRaw = secondarySatelliteType === "realcada"
    ? data.satellite
    : satelliteLayers.ir ?? emptyBrowserSatelliteLayer("ir");
  const secondarySatellite = secondaryRaw.provider === "REDEMET / DECEA"
    ? secondaryRaw
    : emptyBrowserSatelliteLayer(
        secondarySatelliteType,
        `A imagem ${secondaryProduct.label.toLowerCase()} da REDEMET não veio utilizável nesta atualização.`,
      );
  const secondaryRefreshing =
    isRefreshing ||
    (secondarySatelliteType === "ir" &&
      (infraredPrefetching || loadingSatelliteType === "ir"));

  const allSources: SourceLayer[] = [
    data.radar,
    selectedSatellite,
    secondarySatellite,
    data.storms,
  ];
  const availableSources = allSources.filter(sourceHasData).length;
  const latest = latestObservedAt(data, selectedSatellite, secondarySatellite);
  const latestFreshness = getRedemetFreshness(latest);
  const selectedSatelliteTitle = satelliteUsesInmetFallback
    ? "Satélite INMET · contingência"
    : `Satélite REDEMET · ${selectedProduct.label}`;
  const selectedSatellitePanelTitle = satelliteUsesInmetFallback
    ? "Imagem GOES da Região Sul"
    : `Satélite ${selectedProduct.label} pela REDEMET`;
  const satelliteHeaderDescription = satelliteUsesInmetFallback
    ? `A REDEMET não entregou ${selectedProduct.label} utilizável nesta consulta. O INMET aparece identificado porque assumiu esta coleta.`
    : selectedSatellite.availabilityReason === "daylight"
      ? "O canal Visível depende de luz solar e volta a produzir imagem útil durante o dia."
      : "Escolha o produto e compare as coletas recebidas pela REDEMET.";

  return (
    <div className="redemet-page">
      <section className="redemet-hero" aria-labelledby="redemet-page-title">
        <div className="redemet-hero__copy">
          <span>Pelotas · monitoramento regional</span>
          <h1 id="redemet-page-title">Radar, satélite e raios na região de Pelotas</h1>
          <p>
            Veja as coletas mais recentes de radar, satélite e atividade elétrica, sempre com o horário da imagem selecionada.
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
          <small>{sourceCountLabel(availableSources)}{isRefreshing ? " · atualizando" : ""}</small>
        </aside>
      </section>

      <section className="redemet-source-overview" aria-labelledby="redemet-source-overview-title">
        <header>
          <div>
            <span>Coletas recebidas</span>
            <h2 id="redemet-source-overview-title">O que está disponível agora</h2>
          </div>
          <p>Radar, satélite e raios podem ter horários diferentes porque cada produto atualiza no seu próprio ritmo.</p>
        </header>
        <div className="redemet-source-overview__list">
          <SourceSummaryRow
            icon={Radar}
            title="Radar REDEMET"
            description="Áreas de chuva"
            layer={data.radar}
            refreshing={isRefreshing}
          />
          <SourceSummaryRow
            icon={Satellite}
            title={selectedSatelliteTitle}
            description={selectedProduct.description}
            layer={selectedSatellite}
            refreshing={selectedSatelliteRefreshing}
          />
          <SourceSummaryRow
            icon={Satellite}
            title={`Satélite REDEMET · ${secondaryProduct.label}`}
            description={secondaryProduct.description}
            layer={secondarySatellite}
            refreshing={secondaryRefreshing}
          />
          <SourceSummaryRow
            icon={CloudLightning}
            title="Raios REDEMET"
            description="Descargas elétricas"
            layer={data.storms}
            refreshing={isRefreshing}
            storm
          />
        </div>
      </section>

      <ImageLayerPanel
        id="radar-regional"
        layer={data.radar}
        kind="radar"
        kicker="Radar REDEMET"
        title="Onde aparecem áreas de chuva"
        description="Use a sequência para comparar as últimas imagens recebidas na região de Pelotas."
        refreshing={isRefreshing}
        featured
      />

      <section className="redemet-satellite-section" aria-labelledby="redemet-satellite-title">
        <header>
          <div>
            <span>Satélites</span>
            <h2 id="redemet-satellite-title">Nuvens sobre a Região Sul</h2>
          </div>
          <p>{satelliteHeaderDescription}</p>
        </header>

        <div className="redemet-satellite-products">
          <div
            className="redemet-satellite-products__buttons"
            role="group"
            aria-label="Produto de satélite REDEMET"
          >
            {SATELLITE_PRODUCTS.map((product) => (
              <button
                type="button"
                key={product.type}
                aria-pressed={selectedSatelliteType === product.type}
                onClick={() => setSelectedSatelliteType(product.type)}
              >
                {product.label}
              </button>
            ))}
          </div>
          <p>
            <strong>{selectedProduct.label}</strong>
            <span>{selectedProduct.description}</span>
            {loadingSatelliteType === selectedSatelliteType ? <small>Atualizando produto selecionado…</small> : null}
          </p>
        </div>

        <div className="redemet-satellite-grid">
          <ImageLayerPanel
            id={satelliteUsesInmetFallback ? "satelite-contingencia-inmet" : `satelite-redemet-${selectedSatelliteType}`}
            layer={selectedSatellite}
            kind="satellite"
            kicker={selectedSatelliteTitle}
            title={selectedSatellitePanelTitle}
            description={satelliteUsesInmetFallback
              ? `Contingência usada porque ${selectedProduct.label} da REDEMET não veio utilizável nesta atualização.`
              : selectedProduct.description}
            refreshing={selectedSatelliteRefreshing}
          />
          <ImageLayerPanel
            id={`satelite-redemet-${secondarySatelliteType}-complementar`}
            layer={secondarySatellite}
            kind="satellite"
            kicker={`Satélite REDEMET · ${secondaryProduct.label}`}
            title={`${secondaryProduct.label} pela REDEMET`}
            description={secondaryProduct.description}
            refreshing={secondaryRefreshing}
          />
        </div>
      </section>

      <StormPanel layer={data.storms} refreshing={isRefreshing} />

      <section className="redemet-reading-note">
        <div>
          <span>Leitura rápida</span>
          <h2>Imagem observada não é previsão</h2>
        </div>
        <p>Radar, satélite e raios mostram registros já feitos. Para as próximas horas, consulte a previsão e os avisos oficiais.</p>
        <Link to="/tempo-hoje-pelotas">Ver previsão de hoje <ArrowRight aria-hidden="true" /></Link>
      </section>
    </div>
  );
}
