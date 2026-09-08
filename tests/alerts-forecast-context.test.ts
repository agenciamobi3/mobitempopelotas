import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const guide = readFileSync("src/components/weather/AlertsOperationalGuide.tsx", "utf8");
const styles = readFileSync("src/components/weather/AlertsOperationalGuide.css", "utf8");

test("alerts page exposes forecast context without presenting it as an official warning", () => {
  assert.match(guide, /Previsão, não alerta/);
  assert.match(guide, /não criam, elevam ou cancelam um aviso oficial do INMET/);
  assert.match(guide, /id="contexto-previsao-alertas"/);
  assert.match(guide, /Maior chance de chuva/);
  assert.match(guide, /Volume previsto/);
  assert.match(guide, /Maior rajada prevista/);
});

test("forecast context does not manufacture missing precipitation or gust values", () => {
  assert.match(guide, /\.filter\(\(value\): value is number => value !== null\)/);
  assert.match(guide, /value !== null && value !== undefined/);
  assert.match(guide, /rainVolumeKnown: precipitation\.length/);
  assert.match(guide, /gustKnown: gusts\.length/);
  assert.match(guide, /Rajada não informada; vento sustentado não é usado como substituto/);
  assert.doesNotMatch(guide, /windGust\s*\?\?\s*[^\n]*windSpeed/);
  assert.doesNotMatch(guide, /precipitationMm\s*\?\?\s*0/);
});

test("partial forecast availability remains visible instead of being described as a complete 24-hour total", () => {
  assert.match(guide, /Soma de \$\{forecast\.rainVolumeKnown\} de \$\{forecast\.hours \|\| 24\} horários disponíveis/);
  assert.match(guide, /Maior valor entre \$\{forecast\.rainProbabilityKnown\} horários disponíveis nas próximas 12 h/);
  assert.match(guide, /Maior rajada entre \$\{forecast\.gustKnown\} horários disponíveis/);
});

test("forecast context links to dedicated rain, wind and radar pages", () => {
  assert.match(guide, /to="\/chuva-em-pelotas"/);
  assert.match(guide, /to="\/vento-em-pelotas"/);
  assert.match(guide, /to="\/radar-e-satelite-pelotas"/);
  assert.match(styles, /\.alerts-forecast-context__metrics/);
  assert.match(styles, /@media \(max-width: 720px\)/);
  assert.doesNotMatch(styles, /radial-gradient|linear-gradient/);
  assert.doesNotMatch(styles, /box-shadow/);
});
