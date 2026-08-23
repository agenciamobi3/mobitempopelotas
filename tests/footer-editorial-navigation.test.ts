import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PUBLIC_DATA_SOURCE_LINKS } from "../src/lib/public-source-links.ts";

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

test("footer provenance has one HTTPS link and accessible label for every declared provider", () => {
  const providers = Object.values(PUBLIC_DATA_SOURCE_LINKS);
  assert.ok(providers.length >= 17, "inventário deve preservar todos os fornecedores declarados");

  for (const source of providers) {
    const url = new URL(source.url);
    assert.equal(url.protocol, "https:", `${source.label} deve usar HTTPS`);
    assert.ok(source.label.trim().length > 1, "fonte deve ter texto âncora legível");
    assert.match(source.ariaLabel, /nova aba$/i, `${source.label} deve informar nova aba no aria-label`);
  }

  assert.match(footer, /FOOTER_SOURCE_GROUPS\.map/);
  assert.match(footer, /href=\{source\.url\}/);
  assert.match(footer, /aria-label=\{source\.ariaLabel\}/);
  assert.match(footer, /target="_blank"/);
  assert.match(footer, /rel="noopener noreferrer"/);
  assert.doesNotMatch(footer, /nofollow|sponsored/);
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
    "Defesa Civil RS",
    "Casa Militar RS",
    "MKS / Qualle Control",
    "LabHidroSens/UFPel",
    "MetSul",
    "TideSat Global",
    "Nível Guaíba",
    "Rede Lagoa dos Patos",
    "FURG",
    "Portos RS",
  ]) {
    assert.ok(
      Object.values(PUBLIC_DATA_SOURCE_LINKS).some((provider) => provider.label === source),
      `inventário deve identificar ${source}`,
    );
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

test("footer source links remain legible, keyboard visible and accessibility-friendly", () => {
  assert.match(styles, /\.tp-home-footer-source-map a \{[\s\S]*text-decoration: underline/);
  assert.match(styles, /\.tp-home-footer-source-map a:focus-visible/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)[\s\S]*\.tp-home-footer-source-map a/);
  assert.doesNotMatch(styles, /!important/);
});
