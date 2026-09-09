import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PUBLIC_ROUTES } from "../src/lib/public-routes.ts";
import {
  LARANJAL_LATITUDE,
  LARANJAL_LONGITUDE,
  LARANJAL_WEATHER_PATH,
} from "../src/lib/laranjal-weather.ts";

const routeSource = readFileSync("src/routes/tempo-laranjal-pelotas.tsx", "utf8");
const clientSource = readFileSync(
  "src/components/weather/LaranjalWeatherPageClient.tsx",
  "utf8",
);
const levelRouteSource = readFileSync(
  "src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx",
  "utf8",
);
const footerSource = readFileSync("src/components/layout/Footer.tsx", "utf8");
const llmsSource = readFileSync("public/llms.txt", "utf8");

test("publica uma URL meteorológica própria para o Laranjal", () => {
  const route = PUBLIC_ROUTES.find((item) => item.path === LARANJAL_WEATHER_PATH);
  assert.ok(route);
  assert.equal(route.changeFrequency, "hourly");
  assert.ok((route.priority ?? 0) >= 0.8);
});

test("a página usa coordenadas próprias e entidade geográfica do Laranjal", () => {
  assert.equal(LARANJAL_LATITUDE, -31.7715);
  assert.equal(LARANJAL_LONGITUDE, -52.2361);
  assert.match(routeSource, /Laranjal, Pelotas, Rio Grande do Sul, Brasil/);
  assert.match(routeSource, /containedInPlace/);
  assert.match(routeSource, /SEO_SOURCE_URLS\.openMeteo/);
  assert.match(routeSource, /placename: "Laranjal, Pelotas"/);
});

test("previsão meteorológica não é apresentada como observação ou nível da Lagoa", () => {
  assert.match(clientSource, /Estimativa para agora/);
  assert.match(clientSource, /estimativas de modelo/);
  assert.match(clientSource, /não transforma a previsão do modelo em\s*observação de estação/);
  assert.match(clientSource, /Ver nível da Lagoa/);
  assert.match(clientSource, /Ver avisos oficiais/);
});

test("a página destaca hoje, amanhã e contexto prático para a orla", () => {
  assert.match(clientSource, /return "Hoje"/);
  assert.match(clientSource, /return "Amanhã"/);
  assert.match(clientSource, /O que observar antes de ir para a orla/);
  assert.match(clientSource, /Rajada máxima/);
  assert.match(clientSource, /Chance de chuva/);
});

test("a página conecta editorialmente o Tempo Pelotas ao Portal Praia do Laranjal", () => {
  assert.match(
    clientSource,
    /https:\/\/praiadolaranjal\.tur\.br\/nivel-lagoa-aovivo/,
  );
  assert.match(clientSource, /Portal parceiro do Laranjal/);
  assert.match(clientSource, /Acompanhe também o nível da Lagoa no Portal Praia do Laranjal/);
  assert.match(clientSource, /Ver nível no Portal Praia do Laranjal/);
  assert.doesNotMatch(clientSource, /nofollow/);
});

test("a previsão do Laranjal continua descoberta sem depender do bloco técnico da página de nível", () => {
  assert.match(footerSource, /\/tempo-laranjal-pelotas/);
  assert.match(levelRouteSource, /Nível da Lagoa dos Patos hoje no Laranjal, Pelotas/);
  assert.doesNotMatch(
    levelRouteSource,
    /EditorialContentSection|LARANJAL_PAGE_CONTENT|Como interpretar o nível no Laranjal/,
  );
});

test("llms.txt separa previsão do Laranjal de medição hidrológica", () => {
  assert.match(llmsSource, /tempo-laranjal-pelotas/);
  assert.match(llmsSource, /estimativa de modelo, não medição de estação/);
  assert.match(llmsSource, /water-level page uses a separate hydrological measurement/);
});
