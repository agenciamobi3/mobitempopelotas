import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const footer = readFileSync("src/components/layout/Footer.tsx", "utf8");
const wrapper = readFileSync("src/production/components/site-footer.tsx", "utf8");
const styles = readFileSync("src/production/components/site-footer-home.css", "utf8");

const footerRoutes = [
  "/tempo-hoje-pelotas",
  "/tempo-amanha-pelotas",
  "/tempo-laranjal-pelotas",
  "/previsao-7-dias-pelotas",
  "/previsao-15-dias-pelotas",
  "/meteograma-pelotas",
  "/chuva-em-pelotas",
  "/vento-em-pelotas",
  "/radar-e-satelite-pelotas",
  "/status-dos-dados",
  "/cameras-ao-vivo-pelotas",
  "/mapa-de-geadas-rio-grande-do-sul",
  "/alertas",
  "/situacao-hidrologica-pelotas",
  "/nivel-da-lagoa-dos-patos-laranjal",
  "/nivel-do-guaiba",
  "/nivel-do-canal-sao-goncalo",
  "/nivel-do-rio-jaguarao",
  "/historia-das-enchentes-pelotas",
  "/enchente-1941-pelotas",
  "/enchente-2001-pelotas",
  "/enchente-2015-pelotas",
  "/enchente-2024-pelotas-laranjal",
  "/tempo-na-regiao-sul-rs",
  "/clima-em-pelotas",
  "/historico-climatico-pelotas",
  "/blog",
] as const;

test("public footer condenses the main editorial discovery into four groups", () => {
  for (const title of ["Previsão", "Monitoramento", "Águas", "Região e contexto"]) {
    assert.match(footer, new RegExp(`title: "${title}"`));
  }

  for (const route of footerRoutes) {
    assert.ok(footer.includes(route), `footer deve expor ${route}`);
  }

  assert.match(footer, /label: "História das enchentes"/);
  assert.doesNotMatch(footer, /\/estacao-embrapa-pelotas|\/metodologia/);
});

test("footer exposes only the approved dedicated Defesa Civil hydrology intents", () => {
  assert.match(footer, /label: "Nível do Canal São Gonçalo"[\s\S]*to: "\/nivel-do-canal-sao-goncalo"/);
  assert.match(footer, /label: "Nível do Rio Jaguarão"[\s\S]*to: "\/nivel-do-rio-jaguarao"/);
  assert.doesNotMatch(footer, /nivel-do-rio-turucu|nivel-do-rio-cristal|nivel-do-rio-bage|nivel-do-rio-arroio-grande/);
});

test("footer centralizes source details instead of repeating the provider inventory", () => {
  assert.match(footer, /label: "Dados e fontes"/);
  assert.match(footer, /Origem, uso e status de cada fonte/);
  assert.match(footer, /to="\/status-dos-dados"/);
  assert.doesNotMatch(footer, /FOOTER_SOURCE_GROUPS|FooterSourceMap|Fontes e proveniência/);
  assert.doesNotMatch(footer, /REDEMET\/DECEA|Open-Meteo|MET Norway|MKS \/ Qualle Control|TideSat Global/);
});

test("footer keeps the safety note without publishing implementation detail", () => {
  assert.match(footer, /Em situações de risco, siga os comunicados da Defesa Civil, do INMET/);
  assert.doesNotMatch(footer, /last-good|probe|fallback|kill switch|readiness|cross-check/i);
});

test("footer has one canonical implementation shared by every public page", () => {
  assert.match(wrapper, /<Footer source=\{source\} \/>/);
  assert.doesNotMatch(wrapper, /variant=/);
  assert.equal((footer.match(/<footer className="tp-home-footer-shell">/g) ?? []).length, 1);
  assert.doesNotMatch(footer, /FooterVariant|getFooterLead|editorial-footer-shell|homeFooterGroups/);
  assert.doesNotMatch(footer, /import "\.\/Footer\.css"/);
});

test("footer uses a four-column desktop directory and responsive two/one-column collapse", () => {
  assert.match(styles, /\.tp-home-footer-groups \{[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 1100px\)[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*\.tp-home-footer-groups,[\s\S]*grid-template-columns: 1fr/);
});

test("footer remains keyboard and accessibility friendly", () => {
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(styles, /!important/);
});
