import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/enchente-2001-pelotas.tsx", "utf8");
const page = readFileSync("src/components/history/Flood2001HistoricalPage.tsx", "utf8");
const content = readFileSync("src/lib/content/flood-2001-pelotas.ts", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");
const header = readFileSync("src/production/components/home-editorial-header.tsx", "utf8");
const footer = readFileSync("src/components/layout/Footer.tsx", "utf8");

test("2001 flood record is a canonical public route marked as ongoing research", () => {
  assert.match(route, /createFileRoute\("\/enchente-2001-pelotas"\)/);
  assert.match(route, /Enchente de 2001 em Pelotas e no Laranjal: ciclone, impactos e fontes/);
  assert.match(route, /createEditorialPageJsonLd/);
  assert.match(page, /pesquisa em andamento/i);
  assert.match(publicRoutes, /\/enchente-2001-pelotas/);
});

test("2001 page preserves the documented quantitative facts", () => {
  assert.match(content, /8 de outubro de 2001/);
  assert.match(content, /105 km\/h/);
  assert.match(content, /600 metros/);
  assert.match(content, /3 mil pessoas/);
  assert.match(content, /ondas.*aproximadamente um metro/i);
});

test("source hierarchy does not attribute cyclone classification to the municipality", () => {
  assert.match(content, /Folha de S\.Paulo/);
  assert.match(content, /Prefeitura Municipal de Pelotas/);
  assert.match(page, /A classificação “ciclone extratropical” vem da reportagem contemporânea da Folha/);
  assert.match(page, /A Prefeitura de 22 de outubro não usa esse termo/);
  assert.match(page, /“nordestão”/);
});

test("UFPel analysis adds event-specific meteorology without becoming a contemporary bulletin", () => {
  assert.match(content, /https:\/\/anais-siiepe\.ufpel\.edu\.br\/2013\/CE_02822\.pdf/);
  assert.match(content, /Análise acadêmica posterior específica do evento de 08\/10\/2001/);
  assert.match(content, /dados NCEP e da Praticagem da Barra de Rio Grande entre 05 e 08\/10/);
  assert.match(page, /análise acadêmica posterior da Faculdade de Meteorologia da UFPel/);
  assert.match(page, /Alta Subtropical do Atlântico Sul/);
  assert.match(page, /baixa pressão sobre o norte da Argentina/);
  assert.match(page, /ventos\s+de leste-nordeste/);
  assert.match(page, /redução do escoamento para o oceano e à inundação da costa oeste da Lagoa dos Patos/);
  assert.match(page, /não substitui um boletim\s+meteorológico operacional contemporâneo/);
});

test("posterior Lagoa wind context explains mechanism without becoming evidence of the 2001 event", () => {
  assert.match(content, /https:\/\/acervo\.popa\.com\.br\/diversos\/ventos_lpatos\.htm/);
  assert.match(content, /Fonte posterior de contexto hidrodinâmico/);
  assert.match(content, /não documenta o evento de 2001/);
  assert.match(page, /texto náutico publicado em 2005 por Danilo Chagas Ribeiro/);
  assert.match(page, /vento Nordeste pode elevar o nível das águas na porção sul da Lagoa dos Patos/);
  assert.match(page, /não documenta o episódio de 2001/);
  assert.match(page, /não é usado para reconstruir a velocidade, a\s+ duração do vento ou uma cota de 8 de outubro de 2001/);
});

test("September intense-rain episode remains separate until continuity is documented", () => {
  assert.match(page, /31 de agosto e 3 de\s+setembro de 2001/);
  assert.match(page, /não autoriza transformar os dois eventos\s+em uma única enchente/);
  assert.match(content, /Não há, nesta fase, uma cota máxima calibrada/);
});

test("2001 is discoverable between 1941 and 2015 in public navigation", () => {
  const header1941 = header.indexOf('label: "Enchente de 1941"');
  const header2001 = header.indexOf('label: "Enchente de 2001"');
  const header2015 = header.indexOf('label: "Enchente de 2015"');
  assert.ok(header1941 >= 0 && header2001 > header1941 && header2015 > header2001);

  const footer1941 = footer.indexOf('label: "Enchente de 1941"');
  const footer2001 = footer.indexOf('label: "Enchente de 2001"');
  const footer2015 = footer.indexOf('label: "Enchente de 2015"');
  assert.ok(footer1941 >= 0 && footer2001 > footer1941 && footer2015 > footer2001);
});
