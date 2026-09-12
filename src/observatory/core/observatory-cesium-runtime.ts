import {
  Cartesian3,
  CesiumTerrainProvider,
  CesiumWidget,
  Color,
  Credit,
  EllipsoidTerrainProvider,
  ImageryLayer,
  Math as CesiumMath,
  NearFarScalar,
  OpenStreetMapImageryProvider,
  PointPrimitiveCollection,
  Rectangle,
  SingleTileImageryProvider,
  type TerrainProvider,
} from "cesium";

import { PELOTAS_LATITUDE, PELOTAS_LONGITUDE } from "@/lib/site-config";

const OSM_TILE_URL = "https://tile.openstreetmap.org/";
const REEARTH_TERRAIN_URL = "https://terrain.reearth.land/cesium-mesh/ellipsoid";
const INITIAL_ALTITUDE_METERS = 220_000;

export type ObservatoryTerrainStatus = "reearth" | "ellipsoid";

export type ObservatoryCesiumImageInput = {
  imageUrl: string;
  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  opacity: number;
};

export type ObservatoryCesiumPointInput = {
  id: string;
  latitude: number;
  longitude: number;
  color: string;
  outlineColor?: string;
  pixelSize?: number;
  label: string;
  detail: string | null;
};

export type ObservatoryCesiumRuntime = {
  widget: CesiumWidget;
  terrainStatus: ObservatoryTerrainStatus;
  setImageLayer: (id: string, input: ObservatoryCesiumImageInput) => Promise<void>;
  setPointLayer: (id: string, points: ObservatoryCesiumPointInput[]) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  removeLayer: (id: string) => void;
  clearDataLayers: () => void;
};

function clampOpacity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function parseCssColor(value: string | undefined, fallback: Color) {
  if (!value) return fallback.clone();
  return Color.fromCssColorString(value) ?? fallback.clone();
}

async function resolveTerrain(): Promise<{
  provider: TerrainProvider;
  status: ObservatoryTerrainStatus;
}> {
  try {
    const provider = await CesiumTerrainProvider.fromUrl(REEARTH_TERRAIN_URL, {
      requestVertexNormals: true,
      requestWaterMask: true,
    });

    return { provider, status: "reearth" };
  } catch (error) {
    console.warn("[observatory] Re:Earth Terrain indisponível; usando elipsoide.", error);
    return {
      provider: new EllipsoidTerrainProvider(),
      status: "ellipsoid",
    };
  }
}

export async function createObservatoryCesiumRuntime(
  container: HTMLDivElement,
): Promise<ObservatoryCesiumRuntime> {
  const terrain = await resolveTerrain();

  const imageryProvider = new OpenStreetMapImageryProvider({
    url: OSM_TILE_URL,
    maximumLevel: 18,
    retinaTiles: false,
    credit: new Credit(
      '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>',
      true,
    ),
  });

  const widget = new CesiumWidget(container, {
    baseLayer: new ImageryLayer(imageryProvider),
    terrainProvider: terrain.provider,
    scene3DOnly: true,
    shouldAnimate: false,
    contextOptions: {
      webgl: {
        failIfMajorPerformanceCaveat: false,
      },
    },
  });

  widget.scene.requestRenderMode = true;
  widget.scene.maximumRenderTimeChange = Number.POSITIVE_INFINITY;
  widget.scene.globe.enableLighting = true;
  widget.scene.globe.showGroundAtmosphere = true;
  if (widget.scene.skyAtmosphere) widget.scene.skyAtmosphere.show = true;

  widget.camera.setView({
    destination: Cartesian3.fromDegrees(
      PELOTAS_LONGITUDE,
      PELOTAS_LATITUDE,
      INITIAL_ALTITUDE_METERS,
    ),
    orientation: {
      heading: 0,
      pitch: CesiumMath.toRadians(-58),
      roll: 0,
    },
  });

  const imageLayers = new Map<string, ImageryLayer>();
  const pointLayers = new Map<string, PointPrimitiveCollection>();
  const layerGenerations = new Map<string, number>();

  function nextGeneration(id: string) {
    const generation = (layerGenerations.get(id) ?? 0) + 1;
    layerGenerations.set(id, generation);
    return generation;
  }

  function detachLayer(id: string) {
    const imageLayer = imageLayers.get(id);
    if (imageLayer) {
      widget.scene.imageryLayers.remove(imageLayer, true);
      imageLayers.delete(id);
    }

    const pointLayer = pointLayers.get(id);
    if (pointLayer) {
      widget.scene.primitives.remove(pointLayer);
      pointLayers.delete(id);
    }
  }

  function removeLayer(id: string) {
    nextGeneration(id);
    detachLayer(id);
    if (!widget.isDestroyed()) widget.scene.requestRender();
  }

  async function setImageLayer(id: string, input: ObservatoryCesiumImageInput) {
    const generation = nextGeneration(id);
    detachLayer(id);

    const provider = await SingleTileImageryProvider.fromUrl(input.imageUrl, {
      rectangle: Rectangle.fromDegrees(
        input.bounds.west,
        input.bounds.south,
        input.bounds.east,
        input.bounds.north,
      ),
    });

    if (widget.isDestroyed() || layerGenerations.get(id) !== generation) return;

    const layer = new ImageryLayer(provider, {
      alpha: clampOpacity(input.opacity),
    });
    widget.scene.imageryLayers.add(layer);
    imageLayers.set(id, layer);
    widget.scene.requestRender();
  }

  function setPointLayer(id: string, points: ObservatoryCesiumPointInput[]) {
    nextGeneration(id);
    detachLayer(id);
    if (points.length === 0 || widget.isDestroyed()) return;

    const collection = new PointPrimitiveCollection();
    for (const point of points) {
      collection.add({
        id: {
          observatoryLayerId: id,
          pointId: point.id,
          label: point.label,
          detail: point.detail,
        },
        position: Cartesian3.fromDegrees(point.longitude, point.latitude, 60),
        color: parseCssColor(point.color, Color.WHITE).withAlpha(0.96),
        outlineColor: parseCssColor(point.outlineColor, Color.WHITE).withAlpha(0.92),
        outlineWidth: 2,
        pixelSize: point.pixelSize ?? 8,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new NearFarScalar(10_000, 1.25, 1_000_000, 0.7),
      });
    }

    widget.scene.primitives.add(collection);
    pointLayers.set(id, collection);
    widget.scene.requestRender();
  }

  function setLayerOpacity(id: string, opacity: number) {
    const imageLayer = imageLayers.get(id);
    if (!imageLayer) return;
    imageLayer.alpha = clampOpacity(opacity);
    if (!widget.isDestroyed()) widget.scene.requestRender();
  }

  function clearDataLayers() {
    const ids = new Set([...imageLayers.keys(), ...pointLayers.keys(), ...layerGenerations.keys()]);
    for (const id of ids) removeLayer(id);
  }

  widget.scene.requestRender();

  return {
    widget,
    terrainStatus: terrain.status,
    setImageLayer,
    setPointLayer,
    setLayerOpacity,
    removeLayer,
    clearDataLayers,
  };
}
