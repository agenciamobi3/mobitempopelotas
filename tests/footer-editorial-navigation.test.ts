import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const footer = readFileSync("src/components/layout/Footer.tsx", "utf8");
const wrapper = readFileSync("src/production/components/site-footer.tsx", "utf8");
const styles = readFileSync("src/production/components/site-footer-home.css", "utf8");

const footerRoutes = [
  "/tempo-hoje-pelotas",
  "/tempo-amanha-pelotas",
  "/previsao-7-dias-pelotas",
  "/meteograma-pelotas",
  "/chuva-em-pelotas",
  "/vento-em-pelotas",
  "/radar-e-satelite-pelotas",
  "/estacao-embrapa-pelotas",
  "/cameras-ao-vivo-pelotas",
  "/mapa-de-geadas-rio-grande-do-sul",
  "/alertas",
  "/situacao-hidrologica-pelotas",
  "/nivel-da-lagoa-dos-patos-laranjal",
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
});

test("footer provenance reflects the active weather, monitoring and water source families", () => {
  for (const source of [
    "Embrapa Clima Temperado",
    "INMET",
    "CPPMet/UFPel",
    "Open-Meteo",
    "MET Norway",
    "REDEMET/DECEA",
    "SIMAGRO RS",
    "Defesa Civil RS / Casa Militar / MKS",
    "LabHidroSens/UFPel",
    "FURG",
    "Portos RS",
  ]) {
    assert.ok(footer.includes(source), `footer deve identificar ${source}`);
  }

  assert.match(footer, /Fontes e proveniência/);
  assert.match(footer, /Em situações de risco, siga os comunicados da Defesa Civil, do INMET/);
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
  assert.match(styles, /\.tp-home-footer-source-map \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
});

test("footer keeps accessibility-oriented motion and contrast fallbacks", () => {
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(styles, /!important/);
});
