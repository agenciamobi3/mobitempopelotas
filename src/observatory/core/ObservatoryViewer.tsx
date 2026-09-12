import { useEffect, useRef, useState } from "react";

import { PELOTAS_LATITUDE, PELOTAS_LONGITUDE } from "@/lib/site-config";

import { ObservatoryRenderGovernor } from "./ObservatoryRenderGovernor";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./ObservatoryViewer.css";

const CESIUM_BASE_URL = "/cesium/";
const OSM_TILE_URL = "https://tile.openstreetmap.org/";
const REEARTH_TERRAIN_URL = "https://terrain.reearth.land/cesium-mesh/ellipsoid";
const INITIAL_ALTITUDE_METERS = 220_000;

type ViewerStatus = "loading" | "ready" | "error";
type TerrainStatus = "loading" | "reearth" | "ellipsoid";

type CesiumGlobal = typeof globalThis & {
  CESIUM_BASE_URL?: string;
};

export function ObservatoryViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [terrainStatus, setTerrainStatus] = useState<TerrainStatus>("loading");
  const [message, setMessage] = useState("Inicializando globo 3D…");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let viewer: import("cesium").Viewer | null = null;
    const renderGovernor = new ObservatoryRenderGovernor();

    async function initialize() {
      try {
        (globalThis as CesiumGlobal).CESIUM_BASE_URL = CESIUM_BASE_URL;
        const Cesium = await import("cesium");
        if (cancelled) return;

        let terrainProvider: import("cesium").TerrainProvider;
        try {
          terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(REEARTH_TERRAIN_URL, {
            requestVertexNormals: true,
            requestWaterMask: true,
          });
          if (cancelled) return;
          setTerrainStatus("reearth");
        } catch (terrainError) {
          console.warn("[observatory] Re:Earth Terrain indisponível; usando elipsoide.", terrainError);
          terrainProvider = new Cesium.EllipsoidTerrainProvider();
          if (!cancelled) setTerrainStatus("ellipsoid");
        }

        const imageryProvider = new Cesium.OpenStreetMapImageryProvider({
          url: OSM_TILE_URL,
          maximumLevel: 18,
          retinaTiles: false,
          credit: new Cesium.Credit(
            '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>',
            true,
          ),
        });

        viewer = new Cesium.Viewer(container, {
          animation: false,
          baseLayer: new Cesium.ImageryLayer(imageryProvider),
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          navigationHelpButton: false,
          scene3DOnly: true,
          sceneModePicker: false,
          selectionIndicator: false,
          shouldAnimate: false,
          timeline: false,
          terrainProvider,
          vrButton: false,
        });

        viewer.scene.requestRenderMode = true;
        viewer.scene.maximumRenderTimeChange = Number.POSITIVE_INFINITY;
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.showGroundAtmosphere = true;
        viewer.scene.skyAtmosphere.show = true;

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            PELOTAS_LONGITUDE,
            PELOTAS_LATITUDE,
            INITIAL_ALTITUDE_METERS,
          ),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-58),
            roll: 0,
          },
        });

        renderGovernor.attach({ requestRender: () => viewer?.scene.requestRender() });
        renderGovernor.request();

        if (!cancelled) {
          setStatus("ready");
          setMessage("Globo regional pronto. Camadas meteorológicas entram na próxima fase.");
        }
      } catch (error) {
        console.error("[observatory] Falha ao iniciar o viewer Cesium.", error);
        if (!cancelled) {
          setStatus("error");
          setMessage(
            "O recurso 3D não pôde ser iniciado neste navegador. Os demais recursos do Tempo Pelotas continuam disponíveis.",
          );
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      renderGovernor.destroy();
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      viewer = null;
    };
  }, []);

  const terrainLabel =
    terrainStatus === "reearth"
      ? "Relevo 3D · Re:Earth Terrain"
      : terrainStatus === "ellipsoid"
        ? "Relevo indisponível · elipsoide de contingência"
        : "Carregando relevo…";

  return (
    <div className="observatory-viewer" data-viewer-status={status} data-terrain={terrainStatus}>
      <div ref={containerRef} className="observatory-viewer__canvas" aria-hidden="true" />
      <div className="observatory-viewer__status" role="status" aria-live="polite">
        <span className="observatory-viewer__status-dot" aria-hidden="true" />
        <div>
          <strong>{terrainLabel}</strong>
          <span>{message}</span>
        </div>
      </div>
      {status === "error" ? (
        <div className="observatory-viewer__error">
          <strong>Visualização 3D indisponível</strong>
          <span>{message}</span>
        </div>
      ) : null}
    </div>
  );
}
