import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const guide = readFileSync("src/components/history/FloodVisitorGuide.tsx", "utf8");
const page1941 = readFileSync("src/components/history/Flood1941HistoricalPage.tsx", "utf8");
const page2001 = readFileSync("src/components/history/Flood2001HistoricalPage.tsx", "utf8");
const page2015 = readFileSync("src/components/history/Flood2015HistoricalPage.tsx", "utf8");
const page2024 = readFileSync("src/components/history/Flood2024HistoricalPage.tsx", "utf8");
const content2001 = readFileSync("src/lib/content/flood-2001-pelotas.ts", "utf8");
const content2015 = readFileSync("src/lib/content/flood-2015-pelotas.ts", "utf8");
const content2024 = readFileSync("src/lib/content/flood-2024-pelotas.ts", "utf8");
const sharedVisuals = readFileSync("src/components/history/FloodHistoricalVisualSystem.css", "utf8");
const indexPage = readFileSync("src/components/history/FloodHistoryIndexPage.tsx", "utf8");
const agents = readFileSync("AGENTS.md", "utf8");
const routes = new Map([
  ["1941", readFileSync("src/routes/enchente-1941-pelotas.tsx", "utf8")],
  ["2001", readFileSync("src/routes/enchente-2001-pelotas.tsx", "utf8")],
  ["2015", readFileSync("src/routes/enchente-2015-pelotas.tsx", "utf8")],
  ["2024", readFileSync("src/routes/enchente-2024-pelotas-laranjal.tsx", "utf8")],
]);

test("historical pages explain the event in their own copy instead of stacking a generic visitor guide", () => {
  for (const year of ["1941", "2001", "2015", "2024"] as const) {
    const route = routes.get(year);
    assert.ok(route);
    assert.doesNotMatch(route, /FloodVisitorGuide/);
    assert.match(route, /showHistoricalCollaborationPrompt=\{false\}/);
  }

  assert.match(page1941, /Em 1941, uma grande enchente deixou ruas/);
  assert.match(page2001, /Na madrugada de 8 de outubro de 2001, um forte temporal atingiu Pelotas/);
  assert.match(page2015, /Em outubro de 2015, chuva muito acima da média/);
  assert.match(page2024, /A enchente de 2024 chegou a Pelotas depois de atingir outras partes do Rio Grande do Sul/);
});

test("measurement cautions stay in the relevant page instead of a detached explainer", () => {
  assert.match(page1941, /Esse número não significa que\s+havia 2,88 m de água em todas as ruas ou casas/);
  assert.match(page2001, /Por que aparecem 2,90 m e 1,90 m no mesmo dia/);
  assert.match(page2001, /não são duas réguas diferentes nem um erro do site/);
  assert.match(page2015, /Números de lugares diferentes não são a mesma medição/);
  assert.match(page2024, /Níveis medidos em lugares diferentes podem usar réguas e referências diferentes/);
});

test("2001, 2015 and 2024 share the visual language introduced on 1941", () => {
  for (const page of [page2001, page2015, page2024]) {
    assert.match(page, /FloodHistoricalVisualSystem\.css/);
    assert.match(page, /tp-flood-visual-fact__label/);
    assert.match(page, /tp-flood-visual-index/);
    assert.match(page, /tp-flood-visual-kicker/);
    assert.match(page, /tp-flood-visual-event-icon/);
  }

  assert.match(page2015, /TIMELINE_ICON_BY_STAGE/);
  assert.match(page2024, /TIMELINE_ICON_BY_STAGE/);
  assert.match(sharedVisuals, /internal-weather-shell--flood-2001/);
  assert.match(sharedVisuals, /internal-weather-shell--flood-2015/);
  assert.match(sharedVisuals, /internal-weather-shell--flood-2024/);
  assert.match(sharedVisuals, /width:\s*100vw/);
  assert.doesNotMatch(sharedVisuals, /!important/);
});

test("second copy pass removes research-language labels from the public timelines", () => {
  assert.doesNotMatch(content2001, /retroprojetado|RN ou datum|metadados da régua|detalhem operacionalmente/i);
  assert.doesNotMatch(content2015, /Prelúdio documentado|Corroboração contemporânea|Níveis restatados|Recuo irregular/i);
  assert.doesNotMatch(content2024, /configuração atmosférica persistente|cenário hidrológico sem precedentes|efeito de empilhamento|mananciais estavam altos/i);

  assert.match(content2001, /Ainda falta um documento que diga se as estações 87955000 e 87955001/);
  assert.match(content2015, /Boletim das 11h foi localizado, mas o texto completo não/);
  assert.match(content2024, /A água baixava devagar/);
  assert.match(page2015, /só registro encontrado/);
  assert.match(page2001, /versão revisada, chamada de <strong>consistida<\/strong> no arquivo/);
});

test("visitor guide still documents the 2001 discrepancy as reusable historical copy", () => {
  assert.match(guide, /2,90 m e 1,90 m para o mesmo dia/);
  assert.match(guide, /Isso não é um erro do site/);
  assert.match(guide, /diferença de 1 metro/);
  assert.match(guide, /mostramos os dois/);
});

test("history index invites ordinary visitors before research terminology", () => {
  assert.match(indexPage, /você não precisa\s+entender de meteorologia ou hidrologia para começar/);
  assert.match(indexPage, /“2,20 m” ou “3,04 m” normalmente é a leitura de uma régua/);
  assert.match(indexPage, /não\s+a altura da água em todas as casas/);
  assert.match(indexPage, /Quando dois documentos discordam, mostramos a diferença/);
});

test("AGENTS documents simple adult copy without institutional distance or over-explaining", () => {
  assert.match(agents, /acessível|autonomia de leitura equivalente à 6ª série/i);
  assert.match(agents, /isso não significa infantilizar o texto/i);
  assert.match(agents, /não empilhe uma camada "para leigos"/i);
  assert.match(agents, /A MOBI e o Tempo Pelotas fazem parte da comunidade local/i);
  assert.match(agents, /uma explicação não deve exigir outra explicação/i);
});
