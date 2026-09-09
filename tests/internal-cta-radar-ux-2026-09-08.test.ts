import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const bridge = readFileSync("src/components/weather/ForecastHorizonBridge.tsx", "utf8");
const bridgeStyles = readFileSync("src/components/weather/ForecastHorizonBridge.css", "utf8");
const overview = readFileSync("src/components/redemet/RedemetOverview.tsx", "utf8");
const radarForecast = readFileSync("src/components/redemet/RadarForecastContext.tsx", "utf8");
const stormMap = readFileSync("src/components/redemet/StormMapFrame.tsx", "utf8");
const finalStyles = readFileSync("src/production/styles/radar-satellite-editorial-final.css", "utf8");
const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");

test("seven-day horizon bridge is one fully clickable non-white card", () => {
  assert.match(bridge, /<Link to="\/previsao-15-dias-pelotas" aria-labelledby="forecast-horizon-bridge-title">/);
  assert.doesNotMatch(bridge, /<Link to="\/previsao-15-dias-pelotas">\s*Ver 15 dias/);
  assert.match(bridgeStyles, /\.forecast-horizon-bridge > a\s*\{[\s\S]*width:\s*100%/);
  assert.match(bridgeStyles, /background:\s*#f3f7f8/);
  assert.match(bridgeStyles, /border:\s*1px solid/);
  assert.match(bridgeStyles, /border-radius:\s*16px/);
});

test("radar comparison keeps the referenced radar image beside forecast data", () => {
  assert.match(radarForecast, /Radar e previsão no mesmo horário/);
  assert.match(radarForecast, /<RadarMapFrame/);
  assert.match(radarForecast, /radar-forecast-context__comparison/);
  assert.match(radarForecast, /Imagem do radar/);
  assert.match(radarForecast, /Previsão comparada/);
});

test("STSC timeline has a visible map whose points change with the selected frame", () => {
  assert.match(overview, /<StormMapFrame frame=\{selected\} \/>/);
  assert.match(stormMap, /stormGeoJson\(frame\.points\)/);
  assert.match(stormMap, /source\?\.setData\(stormGeoJson\(frame\.points\)\)/);
  assert.match(stormMap, /cooperativeGestures:\s*true/);
  assert.match(stormMap, /Nenhum raio detectado nesta coleta/);
});

test("satellite public complement is REDEMET infrared and realçado copy stays concise", () => {
  assert.match(overview, /Use a sequência para comparar contrastes e temperaturas de topo de nuvem\./);
  assert.match(overview, /const secondarySatelliteType: RedemetSatelliteType = selectedSatelliteType === "ir" \? "realcada" : "ir"/);
  assert.match(overview, /Satélite REDEMET · \$\{secondaryProduct\.label\}/);
  assert.doesNotMatch(overview, /GOES infravermelho da Região Sul/);
  assert.doesNotMatch(overview, /Referência infravermelha complementar do INMET/);
});

test("radar final visual contract is loaded after the legacy precedence barrier", () => {
  for (const entry of [cssEntry, tsEntry]) {
    const barrier = entry.indexOf("internal-editorial-precedence-barrier.css");
    const radarFinal = entry.indexOf("radar-satellite-editorial-final.css");
    assert.ok(barrier >= 0);
    assert.ok(radarFinal > barrier);
  }

  assert.match(finalStyles, /\.site-shell--topic \.redemet-hero/);
  assert.match(finalStyles, /border-radius:\s*18px !important/);
  assert.match(finalStyles, /background-color:\s*#f3f7f8 !important/);
  assert.match(finalStyles, /\.redemet-satellite-grid \.redemet-monitor/);
});
