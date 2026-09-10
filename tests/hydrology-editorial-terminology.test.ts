import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const header = readFileSync("src/production/components/home-editorial-header.tsx", "utf8");
const statusPage = readFileSync("src/routes/status-dos-dados.tsx", "utf8");
const editorial = readFileSync("src/lib/editorial-content.ts", "utf8");
const localities = readFileSync("src/lib/hydrology/hydrology-localities.ts", "utf8");
const artGuide = readFileSync("docs/social/ART_GUIDE.md", "utf8");
const cutoverSmoke = readFileSync("scripts/cutover-smoke.mjs", "utf8");
const publicRoutesBlock = cutoverSmoke.match(/const publicRoutes = \[[\s\S]*?\];/)?.[0] ?? "";

test("copy editorial usa movimento recente para sinais derivados da série", () => {
  assert.match(header, /Leitura local, movimento recente da série/);
  assert.doesNotMatch(header, /Leitura local, tendência e contexto da Lagoa dos Patos/);

  assert.match(
    statusPage,
    /movimento recente calculado a partir da própria série quando houver sequência contínua suficiente/,
  );
  assert.doesNotMatch(statusPage, /horário e tendência quando disponíveis/);

  assert.match(editorial, /telemetria pública e o movimento recente calculado a partir da série/);
  assert.match(
    editorial,
    /O movimento recente derivado da série ajuda a identificar subida, estabilidade ou descida/,
  );
  assert.match(editorial, /O movimento recente é calculado a partir da própria série/);
  assert.doesNotMatch(editorial, /tendência recente da água/);

  assert.match(artGuide, /movimento recente derivado da série/);
});

test("metadados das localidades da Lagoa usam a mesma semântica derivada", () => {
  for (const slug of [
    "rio-grande",
    "sao-lourenco-do-sul",
    "arambare",
    "sao-jose-do-norte",
    "itapua-viamao",
  ]) {
    assert.match(localities, new RegExp(`slug: "${slug}"[\\s\\S]*?movimento recente derivado da série`));
  }

  assert.doesNotMatch(localities, /description: "[^"]*tendência[^"]*"/i);
});

test("tendência publicada pela fonte permanece explicitamente atribuída", () => {
  assert.match(header, /tendência informada pela fonte e limites da régua/);
  assert.match(
    statusPage,
    /quando a Defesa Civil publica tendência textual, ela é exibida como informação da fonte/,
  );
  assert.match(artGuide, /tendência informada pela fonte/);
});

test("smoke de cutover trata metodologia como redirect legado", () => {
  assert.match(cutoverSmoke, /const redirectRoutes = \[/);
  assert.match(cutoverSmoke, /from: "\/metodologia"/);
  assert.match(cutoverSmoke, /to: "\/status-dos-dados"/);
  assert.match(cutoverSmoke, /status: 301/);
  assert.match(cutoverSmoke, /redirect: "manual"/);

  assert.doesNotMatch(publicRoutesBlock, /"\/metodologia"/);
  assert.match(publicRoutesBlock, /"\/status-dos-dados"/);
  assert.match(cutoverSmoke, /Redirect legado presente no sitemap/);
});
