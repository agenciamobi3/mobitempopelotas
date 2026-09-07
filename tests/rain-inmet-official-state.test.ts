import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rainPage = readFileSync("src/components/weather/RainForecastPageV2.tsx", "utf8");
const officialStyles = readFileSync(
  "src/components/weather/RainOfficialEditorial.css",
  "utf8",
);

test("contexto oficial de chuva não transforma falha do INMET em ausência de aviso", () => {
  assert.match(rainPage, /const inmetStatus = weather\.sources\.inmet\.status/);
  assert.match(rainPage, /inmetStatus === "unavailable"/);
  assert.match(rainPage, /inmetStatus === "live"[\s\S]*?"Nenhum aviso ativo"/);
  assert.match(rainPage, /inmetStatus === "live"[\s\S]*?"Sem chuva mencionada"/);
  assert.match(rainPage, /"Consulta parcial"/);
  assert.match(rainPage, /INMET temporariamente indisponível/);
  assert.match(rainPage, /Nenhum dado oficial suficiente foi recebido neste ciclo/);
});

test("contexto oficial usa estado único quando a consulta não trouxe conteúdo confiável", () => {
  assert.match(rainPage, /const hasOfficialContent = activeRainAlerts\.length > 0 \|\| officialPeriods\.length > 0/);
  assert.match(
    rainPage,
    /const showInmetState =[\s\S]*?inmetStatus === "unavailable"[\s\S]*?inmetStatus !== "live" && !hasOfficialContent/,
  );
  assert.match(rainPage, /rain-page__official-state/);
  assert.match(rainPage, /role="status"/);
  assert.match(rainPage, /Abrir avisos oficiais/);
});

test("painel oficial permanece legível sobre a superfície editorial clara", () => {
  assert.match(rainPage, /import "\.\/RainOfficialEditorial\.css"/);
  assert.match(
    officialStyles,
    /\.rain-page__official \{[\s\S]*?color: #071e2f !important[\s\S]*?background: #fff !important/,
  );
  assert.match(
    officialStyles,
    /\.rain-page__official \.rain-page__section-heading h2 \{[\s\S]*?color: #071e2f !important/,
  );
  assert.match(
    officialStyles,
    /\.rain-page__official-grid article > strong \{[\s\S]*?color: #071e2f !important/,
  );
  assert.match(
    officialStyles,
    /\.rain-page__official-grid article > p \{[\s\S]*?color: #5d737e !important/,
  );
  assert.doesNotMatch(officialStyles, /color:\s*(?:transparent|#fff)\s*!important/);
});
