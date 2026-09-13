import {
  Cartesian3,
  CesiumTerrainProvider,
  CesiumWidget,
  Color,
  Credit,
  EllipsoidTerrainProvider,
  HeadingPitchRange,
  ImageryLayer,
  Math as CesiumMath,
  Matrix4,
  NearFarScalar,
  OpenStreetMapImageryProvider,
  PointPrimitiveCollection,
  Rectangle,
  SingleTileImageryProvider,
  type TerrainProvider,
} from "cesium";

import { PELOTAS_LATITUDE, PELOTAS_LONGITUDE } from "@/lib/site-config";

import type { ObservatoryCameraState } from "./ObservatoryScenario";

const OSM_TILE_URL = "https://tile.openstreetmap.org/";
const REEARTH_TERRAIN_URL = "https://terrain.reearth.land/cesium-mesh/ellipsoid";
const INITIAL_CAMERA_RANGE_METERS = 900_000;
const INITIAL_CAMERA_PITCH_DEGREES = -82;
const MINIMUM_CAMERA_HEIGHT_METERS = 5_000;
const MAXIMUM_CAMERA_HEIGHT_METERS = 10_000_000;

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
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  resetNorth: () => void;
  getCameraState: () => ObservatoryCameraState;
  setCameraState: (state: ObservatoryCameraState) => void;
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
  widget.camera.percentageChanged = 0.01;

  const cameraController = widget.scene.screenSpaceCameraController;
  cameraController.minimumZoomDistance = MINIMUM_CAMERA_HEIGHT_METERS;
  cameraController.maximumZoomDistance = MAXIMUM_CAMERA_HEIGHT_METERS;
  cameraController.enableTilt = true;
  cameraController.enableRotate = true;
  cameraController.enableZoom = true;

  const initialTarget = Cartesian3.fromDegrees(PELOTAS_LONGITUDE, PELOTAS_LATITUDE, 0);

  function requestRender() {
    if (!widget.isDestroyed()) widget.scene.requestRender();
  }

  function resetView() {
    if (widget.isDestroyed()) return;
    widget.camera.lookAt(
      initialTarget,
      new HeadingPitchRange(
        CesiumMath.toRadians(0),
        CesiumMath.toRadians(INITIAL_CAMERA_PITCH_DEGREES),
        INITIAL_CAMERA_RANGE_METERS,
      ),
    );
    widget.camera.lookAtTransform(Matrix4.IDENTITY);
    requestRender();
  }

  function cameraZoomAmount() {
    const height = widget.camera.positionCartographic.height;
    return Math.min(650_000, Math.max(20_000, height * 0.28));
  }

  function zoomIn() {
    if (widget.isDestroyed()) return;
    widget.camera.zoomIn(cameraZoomAmount());
    requestRender();
  }

  function zoomOut() {
    if (widget.isDestroyed()) return;
    widget.camera.zoomOut(cameraZoomAmount());
    requestRender();
  }

  function resetNorth() {
    if (widget.isDestroyed()) return;
    const destination = Cartesian3.clone(widget.camera.positionWC);
    widget.camera.setView({
      destination,
      orientation: {
        heading: 0,
        pitch: widget.camera.pitch,
        roll: 0,
      },
    });
    requestRender();
  }

  function getCameraState(): ObservatoryCameraState {
    const position = widget.camera.positionCartographic;
    return {
      longitude: CesiumMath.toDegrees(position.longitude),
      latitude: CesiumMath.toDegrees(position.latitude),
      height: position.height,
      heading: CesiumMath.toDegrees(widget.camera.heading),
      pitch: CesiumMath.toDegrees(widget.camera.pitch),
      roll: CesiumMath.toDegrees(widget.camera.roll),
    };
  }

  function setCameraState(state: ObservatoryCameraState) {
    if (widget.isDestroyed()) return;
    widget.camera.setView({
      destination: Cartesian3.fromDegrees(state.longitude, state.latitude, state.height),
      orientation: {
        heading: CesiumMath.toRadians(state.heading),
        pitch: CesiumMath.toRadians(state.pitch),
        roll: CesiumMath.toRadians(state.roll),
      },
    });
    requestRender();
  }

  resetView();

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
    requestRender();
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
    requestRender();
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
    requestRender();
  }

  function setLayerOpacity(id: string, opacity: number) {
    const imageLayer = imageLayers.get(id);
    if (!imageLayer) return;
    imageLayer.alpha = clampOpacity(opacity);
    requestRender();
  }

  function clearDataLayers() {
    const ids = new Set([...imageLayers.keys(), ...pointLayers.keys(), ...layerGenerations.keys()]);
    for (const id of ids) removeLayer(id);
  }

  requestRender();

  return {
    widget,
    terrainStatus: terrain.status,
    zoomIn,
    zoomOut,
    resetView,
    resetNorth,
    getCameraState,
    setCameraState,
    setImageLayer,
    setPointLayer,
    setLayerOpacity,
    removeLayer,
    clearDataLayers,
  };
}
