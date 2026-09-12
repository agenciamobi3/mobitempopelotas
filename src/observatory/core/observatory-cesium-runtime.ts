import {
  Cartesian3,
  CesiumTerrainProvider,
  CesiumWidget,
  Credit,
  EllipsoidTerrainProvider,
  ImageryLayer,
  Math as CesiumMath,
  OpenStreetMapImageryProvider,
  type TerrainProvider,
} from "cesium";

import { PELOTAS_LATITUDE, PELOTAS_LONGITUDE } from "@/lib/site-config";

const OSM_TILE_URL = "https://tile.openstreetmap.org/";
const REEARTH_TERRAIN_URL = "https://terrain.reearth.land/cesium-mesh/ellipsoid";
const INITIAL_ALTITUDE_METERS = 220_000;

export type ObservatoryTerrainStatus = "reearth" | "ellipsoid";

export type ObservatoryCesiumRuntime = {
  widget: CesiumWidget;
  terrainStatus: ObservatoryTerrainStatus;
};

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

  widget.scene.requestRender();

  return {
    widget,
    terrainStatus: terrain.status,
  };
}
