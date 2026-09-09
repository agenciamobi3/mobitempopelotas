import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/vento-em-pelotas.tsx", "utf8");
const hero = readFileSync("src/components/weather/WindRetailHero.tsx", "utf8");
const heroStyles = readFileSync("src/components/weather/WindRetailHero.css", "utf8");
const page = readFileSync("src/components/weather/WindForecastPageV3.tsx", "utf8");
const styles = readFileSync("src/components/weather/WindPageRefinement.css", "utf8");
const direction = readFileSync("src/components/weather/WindDirectionContext.tsx", "utf8");
const directionStyles = readFileSync("src/components/weather/WindDirectionContext.css", "utf8");
const shellStyles = readFileSync("src/components/layout/InternalWeatherPageShell.css", "utf8");

const windSource = `${route}\n${page}\n${direction}`;

test("wind route uses its dedicated editorial hero and recovered forecast contract", () => {
  assert.match(route, /WindRetailHero/);
  assert.match(route, /WindPageRefinement\.css/);
  assert.match(route, /pageClassName="internal-weather-shell--wind"/);
  assert.match(route, /loadPublicWeatherPage/);
  assert.doesNotMatch(route, /loadPublicWeatherWithMeteogram|WindNavigationAvailability\.css/);
  assert.match(route, /staleTime: 5 \* 60 \* 1_000/);
});

test("wind hero keeps observation separate from forecast without repeating source names", () => {
  assert.match(hero, /const hasCurrentObservation =/);
  assert.match(hero, /current\.source\.kind === "observation"/);
  assert.match(hero, /Vento medido agora/);
  assert.match(hero, /Previsão da próxima hora/);
  assert.match(hero, /Direção \$\{current\.windDirection\}/);
  assert.match(hero, /Dados em atualização/);
  assert.doesNotMatch(hero, /current\.source\.name|Fonte em atualização/);
});

test("wind hero preserves gust absence and useful 24h and 7d facts", () => {
  assert.match(hero, /if \(value <= 0\) return "Sem rajadas"/);
  assert.match(hero, /Maior rajada 24 h/);
  assert.match(hero, /Média prevista 24 h/);
  assert.match(hero, /Maior rajada em 7 dias/);
  assert.match(hero, /Rajadas não informadas/);
  assert.doesNotMatch(hero, /windGust \?\? .*windSpeed/);
});

test("wind hero owns the Home rail without photographic cards", () => {
  assert.match(
    heroStyles,
    /\.internal-weather-shell--wind \.wind-retail-hero__inner[\s\S]*--tp-home-container-max, 1440px[\s\S]*--tp-home-container-gutter, 48px/,
  );
  assert.match(heroStyles, /\.wind-retail-hero__facts[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(heroStyles, /today-retail-hero__current-photo|photo-credit/);
  assert.doesNotMatch(shellStyles, /\.internal-weather-shell--wind \.wind-retail-hero__inner/);
});

test("current wind section displays measurements instead of source labels", () => {
  assert.match(page, /<span>Dados atuais<\/span>/);
  assert.match(page, /Vento atual e previsão/);
  assert.match(page, /<dt>Vento agora<\/dt><dd>\{currentWind\(current\?\.windSpeed\)\}<\/dd>/);
  assert.match(page, /<dt>Direção agora<\/dt><dd>\{currentDirection\(current\?\.windDirection\)\}<\/dd>/);
  assert.match(page, /<dt>Horário do vento atual<\/dt>/);
  assert.match(page, /gridTemplateColumns: "repeat\(3, minmax\(0, 1fr\)\)"/);
  assert.doesNotMatch(page, /Fonte não identificada|<dt>Previsão<\/dt>|forecastProvider|currentProvenance|sourceName\(/);
});

test("wind page footer keeps timestamp and delegates provenance to transparency pages", () => {
  assert.match(page, /Última atualização: \{formatDateTime\(weather\.source\.fetchedAt\)\}\./);
  assert.match(page, /to="\/status-dos-dados">Dados e fontes/);
  assert.doesNotMatch(page, /Vento atual:|Direção atual:|Previsão: \{provider\}/);
});

test("wind page expands the primary hourly series to 24 hours", () => {
  assert.match(page, /weather\.hourly\.slice\(0, 24\)/);
  assert.match(page, /Próximas 24 horas/);
  assert.match(page, /Vento e rajadas por horário/);
  assert.match(page, /hour\.windSpeed/);
  assert.match(page, /hour\.windGust/);
  assert.doesNotMatch(page, /slice\(0, 12\)/);
});

test("peak rankings use only positive published gusts", () => {
  assert.match(page, /function peakHours/);
  assert.match(page, /\.filter\(\(hour\) => \(hour\.windGust \?\? 0\) > 0\)/);
  assert.match(page, /As rajadas mais fortes das próximas 24 horas/);
  assert.match(page, /Velocidade sustentada não substitui rajada/);
  assert.match(page, /Sem rajada prevista/);
});

test("wind weekly view keeps seven days", () => {
  assert.match(page, /weather\.daily\.slice\(0, 7\)/);
  assert.match(page, /Próximos 7 dias/);
  assert.match(page, /Rajadas nos próximos 7 dias/);
  assert.match(page, /wind-page__week-grid/);
});

test("future direction stays a model forecast distinct from current observation", () => {
  assert.match(direction, /windDirectionDegrees/);
  assert.match(direction, /dado de modelo/);
  assert.match(direction, /separada da direção observada pela estação/);
  assert.match(direction, /Direção por hora em atualização/);
  assert.match(route, /hourly=\{recoveredWeather\.weather\.hourly\}/);
  assert.doesNotMatch(route, /meteogram/);
});

test("wind empty state never inserts manual values", () => {
  assert.match(page, /Os dados de vento estão em atualização/);
  assert.match(page, /Nenhuma velocidade, direção ou rajada foi preenchida manualmente/);
  assert.match(page, /!current && weather\.hourly\.length === 0 && weather\.daily\.length === 0/);
});

test("wind body follows the open editorial visual contract", () => {
  assert.match(styles, /\.internal-weather-shell--wind \.wind-page \{/);
  assert.match(styles, /\.wind-page__provenance/);
  assert.match(styles, /\.wind-page__hourly-track/);
  assert.match(styles, /grid-auto-flow: column/);
  assert.match(styles, /\.wind-page__week-grid/);
  assert.match(styles, /grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.doesNotMatch(styles, /box-shadow: 0 18px|radial-gradient|linear-gradient|!important/);
});

test("direction detail remains a separate readable forecast layer", () => {
  assert.match(directionStyles, /\.internal-weather-shell--wind \.wind-direction-context \{/);
  assert.match(directionStyles, /background:\s*#fff/);
  assert.match(directionStyles, /\.wind-direction-context__summary article/);
  assert.match(directionStyles, /\.wind-direction-context__timeline > article/);
  assert.doesNotMatch(windSource, /procedência campo a campo|vento consolidado/i);
});
