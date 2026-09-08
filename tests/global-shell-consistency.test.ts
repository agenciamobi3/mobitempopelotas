import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const headerWrapper = readFileSync(
  new URL("../src/production/components/site-header.tsx", import.meta.url),
  "utf8",
);
const footerWrapper = readFileSync(
  new URL("../src/production/components/site-footer.tsx", import.meta.url),
  "utf8",
);
const globalHeader = readFileSync(
  new URL("../src/components/layout/Header.tsx", import.meta.url),
  "utf8",
);
const globalFooter = readFileSync(
  new URL("../src/components/layout/Footer.tsx", import.meta.url),
  "utf8",
);

test("telas standalone reutilizam o mesmo header e rodapé globais", () => {
  assert.match(headerWrapper, /<Header advisoryLevel=/);
  assert.doesNotMatch(headerWrapper, /megaMenus|mobileNavItems|footerGroups/);
  assert.match(footerWrapper, /<Footer source=\{source\} \/>/);
  assert.doesNotMatch(footerWrapper, /footerGroups|Fontes e proveniência|variant=/);
});

test("navegação institucional existe em definições canônicas do shell", () => {
  for (const label of [
    "Hoje",
    "Amanhã",
    "7 dias",
    "Rede Defesa Civil RS",
    "Radar e satélite",
    "Câmeras ao vivo",
    "Situação das águas",
    "Avisos oficiais",
    "Dados e fontes",
  ]) {
    assert.match(globalHeader, new RegExp(label));
  }
  assert.doesNotMatch(globalHeader, /Estação Embrapa|\/estacao-embrapa-pelotas|to="\/metodologia"/);

  for (const label of [
    "Chuva em Pelotas",
    "Vento em Pelotas",
    "Nível no Laranjal",
    "Enchente de 2024",
    "Tempo na Zona Sul",
    "Clima de Pelotas",
    "Dados e fontes",
    "Ecossistema MOBI",
  ]) {
    assert.match(globalFooter, new RegExp(label));
  }

  assert.doesNotMatch(globalFooter, /FOOTER_SOURCE_GROUPS|FooterSourceMap|REDEMET\/DECEA|MKS \/ Qualle Control/);
  assert.doesNotMatch(globalFooter, /Open-Meteo|MET Norway|TideSat Global|LabHidroSens/);
});

test("rodapé público não mantém uma implementação alternativa oculta", () => {
  assert.doesNotMatch(globalFooter, /FooterVariant|getFooterLead|editorial-footer-shell/);
  assert.equal((globalFooter.match(/<EmergencyFooterStrip \/>/g) ?? []).length, 1);
  assert.match(globalFooter, /className="tp-home-footer-shell"/);
  assert.match(globalFooter, /Origem, uso e status de cada fonte/);
});
