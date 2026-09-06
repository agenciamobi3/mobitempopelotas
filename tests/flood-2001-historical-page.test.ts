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

test("2001 page preserves the documented contemporary quantitative facts", () => {
  assert.match(content, /8 de outubro de 2001/);
  assert.match(content, /105 km\/h/);
  assert.match(content, /600 metros/);
  assert.match(content, /3 mil pessoas/);
  assert.match(content, /ondas.*aproximadamente um metro/i);
});

test("historical Laranjal gauge documents the 2001 peak without inventing a vertical datum", () => {
  assert.match(content, /estação Laranjal 87955000 atingiu cota de 2,90 m em 08\/10\/2001/);
  assert.match(content, /maior valor da série disponível entre setembro de 1984 e junho de 2012/);
  assert.match(content, /não representa altitude de 2,90 m acima do nível do mar/);
  assert.match(content, /Prefeitura Municipal do Rio Grande · dados ANA/);
  assert.match(content, /Serviço Geológico do Brasil · SGB/);
  assert.match(content, /cota é não nivelada/);

  assert.match(page, /href="#regua-laranjal-2001"/);
  assert.match(page, /id="regua-laranjal-2001"/);
  assert.match(page, /Régua histórica ANA · estação 87955000/);
  assert.match(page, /O Laranjal registrou 2,90 m na régua em 8 de outubro de 2001/);
  assert.match(page, /13 de setembro de 1984 a 30 de junho de 2012/);
  assert.match(page, /cota média de aproximadamente 0,63 m/);
  assert.match(page, /cota da estação Laranjal\s+87955000 como <strong>não nivelada<\/strong>/);
  assert.match(page, /Não o compara por simples subtração com outras estações/);
  assert.match(page, /não é uma cota de inundação universal do Laranjal/);
  assert.doesNotMatch(page, /2,90 m acima do normal/);
});

test("source hierarchy does not attribute cyclone classification to the municipality", () => {
  assert.match(content, /Folha de S\.Paulo/);
  assert.match(content, /Prefeitura Municipal de Pelotas/);
  assert.match(page, /A classificação “ciclone extratropical” vem da reportagem contemporânea da Folha/);
  assert.match(page, /A Prefeitura de 22 de outubro não usa esse termo/);
  assert.match(page, /“nordestão”/);
  assert.match(page, /cota de 2,90 m vem de uma reconstrução posterior da série ANA/);
});

test("UFPel analysis has its own editorial section without becoming a contemporary bulletin", () => {
  assert.match(content, /https:\/\/anais-siiepe\.ufpel\.edu\.br\/2013\/CE_02822\.pdf/);
  assert.match(content, /Análise acadêmica posterior específica do evento de 08\/10\/2001/);
  assert.match(content, /dados NCEP e da Praticagem da Barra de Rio Grande entre 05 e 08\/10/);
  assert.match(page, /href="#mecanismo-vento-2001"/);
  assert.match(page, /id="mecanismo-vento-2001"/);
  assert.match(page, /Como os ventos de leste e nordeste ajudaram a represar a Lagoa/);
  assert.match(page, /Análise Final do NCEP/);
  assert.match(page, /resolução de 1° x 1°/);
  assert.match(page, /Praticagem da Barra de Rio Grande entre 5 e 8 de outubro/);
  assert.match(page, /Alta Subtropical do Atlântico Sul/);
  assert.match(page, /baixa pressão sobre o norte da Argentina/);
  assert.match(page, /dificultado a\s+saída das águas da Lagoa dos Patos para o Oceano Atlântico/);
  assert.match(page, /não redefine a referência da régua\s+histórica/);
  assert.match(page, /Análise acadêmica posterior específica não é boletim operacional contemporâneo/);
});

test("posterior Lagoa wind context explains mechanism without becoming evidence of the 2001 event", () => {
  assert.match(content, /https:\/\/acervo\.popa\.com\.br\/diversos\/ventos_lpatos\.htm/);
  assert.match(content, /Fonte posterior de contexto hidrodinâmico/);
  assert.match(content, /não documenta o evento de 2001/);
  assert.match(page, /texto náutico publicado em 2005 por Danilo Chagas Ribeiro/);
  assert.match(page, /vento Nordeste pode elevar o nível das águas na porção sul da Lagoa dos Patos/);
  assert.match(page, /não documenta o episódio de 2001/);
});

test("September intense-rain episode remains separate until continuity is documented", () => {
  assert.match(page, /31 de agosto e 3 de\s+setembro de 2001/);
  assert.match(page, /não autoriza transformar os dois eventos\s+em uma única enchente/);
  assert.match(content, /ainda buscamos o arquivo bruto original da ANA/);
  assert.match(content, /não é tratado como altitude/);
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
