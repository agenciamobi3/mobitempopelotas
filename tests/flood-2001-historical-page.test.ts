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

test("Laranjal 87955000 preserves raw and consistent 2001 values without collapsing them", () => {
  assert.match(content, /300 cm às 07h/);
  assert.match(content, /280 cm às 17h/);
  assert.match(content, /média diária de 290 cm/);
  assert.match(content, /média diária do mesmo dia é 190 cm/);
  assert.match(content, /status do valor é 2, Estimado/);
  assert.match(content, /2,90 m bruto e 1,90 m consistido\/estimado/);

  assert.match(page, /href="#regua-laranjal-2001"/);
  assert.match(page, /id="regua-laranjal-2001"/);
  assert.match(page, /No mesmo 8 de outubro, o Hidro preserva 2,90 m bruto e 1,90 m consistido/);
  assert.match(page, /NivelConsistencia 1 como Bruto/);
  assert.match(page, /NivelConsistencia 2 como Consistido/);
  assert.match(page, /300 cm às 07h/);
  assert.match(page, /280 cm às 17h/);
  assert.match(page, /média diária de 290 cm/);
  assert.match(page, /190 cm/);
  assert.match(page, /status 2 = Estimado/);
  assert.doesNotMatch(page, /O Laranjal registrou 2,90 m na régua em 8 de outubro de 2001/);
  assert.doesNotMatch(page, /2,90 m é a cota registrada na régua histórica/);
});

test("2018 consistency history is visible without inventing the reason for the 100 cm revision", () => {
  assert.match(page, /29\/06\/2018/);
  assert.match(page, /Contrato ANA nº 10\/2015/);
  assert.match(page, /análise de consistência de dados fluviométricos/);
  assert.match(page, /não\s+transforma esse registro geral em uma justificativa técnica inventada/);
  assert.match(content, /relatório técnico que explique especificamente a revisão de 290 cm bruto para 190 cm consistido\/estimado/);
});

test("historical gauge zero clue is not back-projected to 2001 as altitude", () => {
  assert.match(page, /05\/10\/2017/);
  assert.match(page, /-0,02 m/);
  assert.match(page, /substituição e renumeração de lances de régua/);
  assert.match(page, /não retroprojeta -0,02 m/);
  assert.match(content, /Sem a documentação de nivelamento aplicável ao período de 2001/);
  assert.doesNotMatch(page, /190 cm.*1,88 m acima do nível do mar/);
  assert.doesNotMatch(page, /290 cm.*2,88 m acima do nível do mar/);
});

test("87955000 historical gauge and 87955001 telemetry stay operationally separate", () => {
  assert.match(page, /30\/04\/2026/);
  assert.match(page, /retirada do tipo telemétrico/);
  assert.match(page, /87955001/);
  assert.match(page, /08\/06\/2026/);
  assert.match(page, /descrição TELEMÉTRICA/);
  assert.match(page, /não prova que as duas identidades compartilham o mesmo zero, RN ou\s+datum vertical/);
  assert.match(page, /A 87955001 não é usada\s+para recalibrar a série histórica/);
});

test("source hierarchy does not attribute cyclone classification to the municipality", () => {
  assert.match(content, /Folha de S\.Paulo/);
  assert.match(content, /Prefeitura Municipal de Pelotas/);
  assert.match(page, /A classificação “ciclone extratropical” vem da reportagem contemporânea da Folha/);
  assert.match(page, /A Prefeitura de 22 de outubro não usa esse termo/);
  assert.match(page, /“nordestão”/);
  assert.match(page, /O bruto preserva 2,90 m/);
  assert.match(page, /o consistido preserva 1,90 m/);
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
  assert.match(content, /Ainda buscamos boletins meteorológicos oficiais contemporâneos/);
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
