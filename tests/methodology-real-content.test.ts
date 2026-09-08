import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const methodologyRoute = readFileSync("src/routes/metodologia.tsx", "utf8");
const statusRoute = readFileSync("src/routes/status-dos-dados.tsx", "utf8");
const statusServer = readFileSync("src/lib/status/data-status.server.ts", "utf8");
const redemetStatus = readFileSync("src/lib/status/data-status-redemet-probes.server.ts", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");

test("metodologia antiga é apenas alias permanente para dados e fontes", () => {
  assert.match(methodologyRoute, /createFileRoute\("\/metodologia"\)/);
  assert.match(methodologyRoute, /redirect/);
  assert.match(methodologyRoute, /to: "\/status-dos-dados"/);
  assert.match(methodologyRoute, /statusCode: 301/);
  assert.doesNotMatch(methodologyRoute, /loader:|MethodologyPage|loadMethodologyPageData/);
});

test("dados e fontes é a única página indexável para origem e estado das integrações", () => {
  assert.match(publicRoutes, /path: "\/status-dos-dados"/);
  assert.doesNotMatch(publicRoutes, /path: "\/metodologia"/);
  assert.match(statusRoute, /Dados e fontes do Tempo Pelotas/);
  assert.match(statusRoute, /getDataStatusPageData/);
});

test("página reúne origem, uso, estado e horário de cada fonte", () => {
  assert.match(statusRoute, /SOURCE_USAGE/);
  assert.match(statusRoute, /service\.provider/);
  assert.match(statusRoute, /service\.name/);
  assert.match(statusRoute, /labelForState\(service\.state\)/);
  assert.match(statusRoute, /Verificado em \{formatCheckedAt\(service\.checkedAt\)\}/);
  assert.match(statusRoute, /Abrir fonte/);
});

test("critérios públicos são factuais e separam observação, previsão, alertas e hidrologia", () => {
  assert.match(statusRoute, /Critérios de publicação/);
  assert.match(statusRoute, /Agora:/);
  assert.match(statusRoute, /Previsão:/);
  assert.match(statusRoute, /Previsão oficial e alertas:/);
  assert.match(statusRoute, /Radar e satélite:/);
  assert.match(statusRoute, /Hidrologia:/);
  assert.match(statusRoute, /Valores previstos nunca são apresentados como medição/);
  assert.match(statusRoute, /Cotas de referências diferentes não são convertidas/);
});

test("status público evita jargão interno quando uma fonte falha", () => {
  assert.doesNotMatch(statusServer, /last-good|probe meteorológico|kill switch|readiness|cross-check/i);
  assert.doesNotMatch(redemetStatus, /Probe independente|upstream|server-side/i);
  assert.match(statusServer, /A fonte não entregou dados utilizáveis na última verificação/);
  assert.match(redemetStatus, /A fonte não entregou dados utilizáveis nesta verificação/);
});

test("detalhes técnicos não voltam ao hero nem ao rodapé do status", () => {
  assert.doesNotMatch(statusRoute, /Como interpretar esta seção|Transparência operacional/);
  assert.match(statusRoute, /Incidentes e disponibilidade/);
  assert.match(statusRoute, /Disponibilidade por fonte/);
});
