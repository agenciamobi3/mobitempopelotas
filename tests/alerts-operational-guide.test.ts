import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/alertas.tsx", "utf8");
const guide = readFileSync("src/components/weather/AlertsOperationalGuide.tsx", "utf8");
const guideCss = readFileSync("src/components/weather/AlertsOperationalGuide.css", "utf8");
const map = readFileSync("src/components/weather/AlertMunicipalityMap.tsx", "utf8");
const mapCss = readFileSync("src/components/weather/AlertMunicipalityMap.module.css", "utf8");
const safety = readFileSync("src/production/lib/safety-banners.ts", "utf8");

test("alerts route publishes the operational guide before the long-form explainer", () => {
  assert.match(route, /AlertsOperationalGuide/);
  assert.match(route, /<AlertsOperationalGuide data=\{recoveredWeather\} \/>/);
  assert.ok(route.indexOf("<AlertsOperationalGuide") < route.indexOf("<EditorialContentSection"));
  assert.match(route, /Cadastro de alertas por SMS 40199/);
  assert.match(route, /Cell Broadcast de emergência/);
});

test("operational guide makes severity, territorial scope and source health explicit", () => {
  assert.match(guide, /Cor, validade e abrangência precisam ser lidas juntas/);
  assert.match(guide, /Pelotas citada diretamente/);
  assert.match(guide, /Regional ou estadual/);
  assert.match(guide, /INMET indisponível/);
  assert.match(guide, /Falha de consulta não significa ausência de risco/);
  assert.match(guide, /label: "Amarelo"/);
  assert.match(guide, /label: "Laranja"/);
  assert.match(guide, /label: "Vermelho"/);
  assert.match(guide, /Perigo potencial/);
  assert.match(guide, /Grande perigo/);
});

test("Civil Defense directory materializes the existing internal anchor and official channels", () => {
  assert.match(guide, /id="canais-defesa-civil"/);
  assert.match(guide, /SAFETY_BANNERS\.map/);
  assert.match(guide, /sms:40199/);
  assert.match(guide, /Cadastrar CEP por SMS/);
  assert.match(guide, /DEFESA_CIVIL_GUIDANCE_SOURCE/);

  for (const id of ["sms", "whatsapp", "cell-broadcast", "official-channel"]) {
    assert.match(safety, new RegExp(`id: "${id}"`));
  }
});

test("featured alert map never invents direct Pelotas coverage for broader warnings", () => {
  assert.match(map, /const includesPelotas = alert\.relevance === "pelotas"/);
  assert.match(map, /if \(!includesPelotas\)/);
  assert.match(map, /Pelotas não foi marcada diretamente neste aviso/);
  assert.match(map, /não desenha uma área no mapa sem geometria oficial suficiente/);
  assert.match(map, /Pelotas citada no aviso/);
  assert.match(map, /não representa o limite total do aviso/);
  assert.doesNotMatch(map, />Pelotas incluída</);
});

test("new alert surfaces stay editorial and responsive without decorative elevation", () => {
  assert.match(guideCss, /grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(guideCss, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(guideCss, /@media \(max-width: 720px\)/);
  assert.match(guideCss, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(guideCss, /radial-gradient|linear-gradient/);
  assert.doesNotMatch(guideCss, /box-shadow/);

  assert.match(mapCss, /\.broader/);
  assert.match(mapCss, /background:\s*#f5f8f8/);
  assert.match(mapCss, /box-shadow:\s*none/);
  assert.doesNotMatch(mapCss, /radial-gradient|linear-gradient/);
});
