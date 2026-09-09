import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const laranjalRoute = readFileSync(
  "src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx",
  "utf8",
);
const laranjalPage = readFileSync(
  "src/components/hydrology/HydrologyPages.tsx",
  "utf8",
);
const situationRoute = readFileSync("src/routes/situacao-hidrologica-pelotas.tsx", "utf8");
const detailHero = readFileSync(
  "src/components/hydrology/HydrologyEditorialHero.tsx",
  "utf8",
);
const currentAnswer = readFileSync(
  "src/components/hydrology/HydrologyCurrentSituationAnswer.tsx",
  "utf8",
);
const currentAnswerStyles = readFileSync(
  "src/components/hydrology/HydrologyCurrentSituationAnswer.css",
  "utf8",
);

test("Laranjal page absorbs the real search language without changing its canonical route", () => {
  assert.match(laranjalRoute, /Nível da Lagoa dos Patos hoje no Laranjal, Pelotas/);
  assert.match(laranjalRoute, /horário da última leitura, tendência e variação nas últimas 24 horas/);
  assert.match(detailHero, /Nível da Lagoa dos Patos hoje no Laranjal\./);
  assert.match(detailHero, /Última leitura com horário e estado de atualização/);
  assert.match(detailHero, /Tendência e variações de 1 h, 6 h e 24 h/);
  assert.match(laranjalPage, /Nível medido no Laranjal/);
  assert.match(laranjalPage, /Variação em 24 horas/);
  assert.doesNotMatch(laranjalRoute, /EditorialContentSection|createFaqPageJsonLd|Como interpretar o nível no Laranjal/);
  assert.match(laranjalRoute, /PAGE_PATH = "\/nivel-da-lagoa-dos-patos-laranjal"/);
});

test("situation page answers enchente hoje as a question, never as an inferred diagnosis", () => {
  assert.match(situationRoute, /Enchente em Pelotas hoje\? Situação das águas e níveis/);
  assert.match(situationRoute, /Há enchente em Pelotas hoje\?/);
  assert.match(situationRoute, /HydrologyCurrentSituationAnswer/);
  assert.match(currentAnswer, /O Tempo Pelotas não confirma enchente ou risco para a cidade a partir de uma única régua/);
  assert.match(currentAnswer, /Para decisões de segurança, consulte os\s+comunicados da Defesa Civil e das autoridades locais/);
  assert.match(currentAnswer, /isso não é convertido em risco automático para Pelotas/);
  assert.doesNotMatch(currentAnswer, /Pelotas (?:está|estaria) (?:em )?enchente/i);
  assert.doesNotMatch(currentAnswer, /sem risco|risco zero|situação segura/i);
});

test("situation page concentrates interpretation in a short educational closing", () => {
  assert.match(situationRoute, /Antes de comparar os níveis/);
  assert.match(situationRoute, /Quatro cuidados para interpretar as medições/);
  assert.match(situationRoute, /Números de réguas diferentes não devem ser subtraídos/);
  assert.match(situationRoute, /um valor atrasado é a última informação conhecida, não o nível atual/);
  assert.match(situationRoute, /estações da ANA\/SNIRH no mapa mostram a rede oficial da região/);
  assert.match(situationRoute, /prevalecem os avisos e as orientações da Defesa Civil/);
  assert.doesNotMatch(situationRoute, /OfficialDataAccessNotice/);
  assert.doesNotMatch(situationRoute, /HYDROLOGY_EDITORIAL_CONTENT/);
});

test("current hydrology answer preserves stale and unavailable semantics", () => {
  assert.match(currentAnswer, /level\.status === "live"/);
  assert.match(currentAnswer, /level\.status === "stale"/);
  assert.match(currentAnswer, /ela não é tratada como nível atual/);
  assert.match(currentAnswer, /A ausência de transmissão não é interpretada como nível normal/);
  assert.match(currentAnswer, /Sem dados válidos do SACE, a página não presume normalidade ou segurança/);
  assert.match(currentAnswer, /sace\.counts\.aboveNormal/);
  assert.match(currentAnswer, /lagoon\.available/);
});

test("search-intent answer remains responsive and accessible", () => {
  assert.match(currentAnswer, /aria-labelledby="hydrology-current-answer-title"/);
  assert.match(currentAnswer, /aria-label="Sinais disponíveis nesta atualização"/);
  assert.match(currentAnswerStyles, /@media \(max-width: 860px\)/);
  assert.match(currentAnswerStyles, /@media \(max-width: 680px\)/);
  assert.match(currentAnswerStyles, /min-height: 44px/);
  assert.match(currentAnswerStyles, /:focus-visible/);
  assert.doesNotMatch(currentAnswerStyles, /!important/);
});
