import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const editorial = source("src/lib/editorial-content.ts");
const home = source("src/routes/index.tsx");
const today = source("src/routes/tempo-hoje-pelotas.tsx");
const rain = source("src/routes/chuva-em-pelotas.tsx");
const laranjal = source("src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx");
const hydrology = source("src/routes/situacao-hidrologica-pelotas.tsx");
const guaiba = source("src/routes/nivel-do-guaiba.tsx");
const regionalEditorial = source("src/lib/regional-city-editorial.ts");
const regionalPage = source("src/components/regional/RegionalCityWeatherPage.tsx");

test("home e hoje formam um cluster de intenção sem criar novas URLs redundantes", () => {
  assert.match(home, /Tempo agora em Pelotas/);
  assert.match(home, /Temperatura atual em Pelotas/);
  assert.match(editorial, /href: "\/tempo-hoje-pelotas"/);
  assert.match(editorial, /href: "\/previsao-15-dias-pelotas"/);
  assert.match(today, /href: "\/previsao-7-dias-pelotas"/);
  assert.match(today, /href: "\/previsao-15-dias-pelotas"/);
  assert.match(today, /Onde vejo a previsão por hora de hoje/);
});

test("chuva conecta previsão, observação e hidrologia sem somar janelas incompatíveis", () => {
  assert.match(rain, /Vai chover hoje em Pelotas/);
  assert.match(rain, /Quanto choveu hoje em Pelotas/);
  assert.match(rain, /href: "\/situacao-hidrologica-pelotas"/);
  assert.match(rain, /href: "\/nivel-da-lagoa-dos-patos-laranjal"/);
  assert.match(rain, /não é somado ao volume previsto para hoje/);
});

test("cluster hidrológico conecta operação atual e memória histórica preservando referências", () => {
  for (const route of [laranjal, hydrology, guaiba]) {
    assert.match(route, /\/nivel-do-guaiba|Nível do Guaíba/);
    assert.match(route, /\/enchente-1941-pelotas/);
    assert.match(route, /\/enchente-2024-pelotas-laranjal/);
  }

  assert.match(laranjal, /não deve ser transferida automaticamente para a régua atual do Laranjal/);
  assert.match(hydrology, /não devem ser comparados por simples subtração/);
  assert.match(guaiba, /não confirma risco de enchente em Pelotas/);
  assert.match(guaiba, /não transferi-la para as réguas atuais do Guaíba/);
});

test("páginas regionais expõem contexto local, FAQ visível e schema correspondente", () => {
  const priorityProfiles = [...regionalEditorial.matchAll(/^\s{2}"[a-z0-9-]+-rs": \{/gm)];
  assert.ok(priorityProfiles.length >= 10, `esperava ao menos 10 perfis editoriais, encontrou ${priorityProfiles.length}`);

  assert.match(regionalEditorial, /regionalCityEditorialFaqs/);
  assert.match(regionalEditorial, /"sao-lourenco-do-sul-rs"/);
  assert.match(regionalEditorial, /"santa-vitoria-do-palmar-rs"/);
  assert.match(regionalEditorial, /"chui-rs"/);
  assert.match(regionalPage, /id="perguntas-sobre-tempo-local"/);
  assert.match(regionalPage, /"@type": "FAQPage"/);
  assert.match(regionalPage, /"@type": "BreadcrumbList"/);
  assert.match(regionalPage, /"@type": "Place"/);
});
