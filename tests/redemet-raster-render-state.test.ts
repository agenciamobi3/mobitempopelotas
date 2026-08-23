import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const weatherMap = readFileSync("src/production/components/weather-map.tsx", "utf8");
const weatherMapCss = readFileSync(
  "src/production/components/weather-map.module.css",
  "utf8",
);
const satelliteRoute = readFileSync("src/routes/api/redemet/satellite.ts", "utf8");
const productionTypes = readFileSync("src/production/lib/redemet-types.ts", "utf8");

test("REDEMET image metadata is not enough to mark the raster as ready", () => {
  assert.match(weatherMap, /type ImageRenderState = "idle" \| "loading" \| "ready" \| "error"/);
  assert.match(weatherMap, /const \[renderedImageFrameId, setRenderedImageFrameId\]/);
  assert.match(
    weatherMap,
    /imageRenderState === "ready"[\s\S]*renderedImageFrameId === selectedImageFrameId/,
  );
  assert.match(weatherMap, /operationalLayerReady[\s\S]*styles\.liveDot/);
  assert.doesNotMatch(weatherMap, /className=\{available \? styles\.liveDot/);
});

test("REDEMET raster is fetched, typed and decoded before MapLibre receives it", () => {
  assert.match(weatherMap, /async function fetchVerifiedImageObjectUrl/);
  assert.match(weatherMap, /if \(!response\.ok\)/);
  assert.match(weatherMap, /contentType\.startsWith\("image\/"\)/);
  assert.match(weatherMap, /const blob = await response\.blob\(\)/);
  assert.match(weatherMap, /const image = new Image\(\)/);
  assert.match(weatherMap, /image\.onload/);
  assert.match(weatherMap, /image\.onerror/);
  assert.match(weatherMap, /URL\.createObjectURL\(blob\)/);
  assert.match(weatherMap, /URL\.revokeObjectURL\(objectUrl\)/);
  assert.match(weatherMap, /url: objectUrl/);
});

test("radar status distinguishes metadata, raster loading, success and failure", () => {
  assert.match(weatherMap, /Carregando imagem de \$\{imageLayerLabel\}/);
  assert.match(weatherMap, /"Radar carregado"/);
  assert.match(weatherMap, /"Imagem indisponível"/);
  assert.match(weatherMap, /Imagem do radar não carregou/);
  assert.match(weatherMap, /metadata do quadro foi recebida, mas o raster não foi validado/i);
  assert.match(weatherMap, /A ausência de cores no quadro não substitui/);
  assert.match(weatherMapCss, /\.errorDot/);
  assert.match(weatherMapCss, /\.renderStatus/);
});

test("changing raster opacity does not refetch the verified image", () => {
  assert.match(weatherMap, /const opacityRef = useRef\(78\)/);
  assert.match(weatherMap, /map\.setPaintProperty\(IMAGE_LAYER_ID, "raster-opacity", opacity \/ 100\)/);
  assert.match(weatherMap, /"raster-opacity": opacityRef\.current \/ 100/);
  assert.doesNotMatch(
    weatherMap,
    /\}, \[activeLayer, isLoaded, opacity, selectedFrame\]\);/,
  );
});

test("regional monitor opens on satellite and keeps radar as the second option", () => {
  assert.match(weatherMap, /useState<MapMode>\("satellite"\)/);
  assert.match(
    weatherMap,
    /onClick=\{\(\) => selectMode\("satellite"\)\}[\s\S]*>\s*Satélite\s*<\/button>[\s\S]*onClick=\{\(\) => selectMode\("radar"\)\}[\s\S]*>\s*Radar\s*<\/button>[\s\S]*Trovoadas/,
  );
  assert.match(weatherMap, /const hidden = mode !== "radar"/);
  assert.match(weatherMap, /element\.hidden = hidden/);
});

test("satellite selector exposes the validated GOES INMET infrared source without disguising its provider", () => {
  assert.match(weatherMap, /type SatelliteOptionValue = RedemetSatelliteType \| "inmet-ir"/);
  assert.match(weatherMap, /\{ value: "inmet-ir", label: "GOES \/ INMET" \}/);
  assert.match(weatherMap, /source=inmet&frames=10/);
  assert.match(weatherMap, /activeLayer\.data\.provider === "INMET"/);
  assert.match(satelliteRoute, /fetchInmetSatellite/);
  assert.match(satelliteRoute, /searchParams\.get\("source"\) === "inmet"/);
  assert.match(satelliteRoute, /satellite:inmet:\$\{frames\}/);
  assert.match(productionTypes, /provider: "REDEMET \/ DECEA" \| "INMET"/);
});
