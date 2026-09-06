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
const canonicalHeader = readFileSync(
  new URL("../src/production/components/home-editorial-header.tsx", import.meta.url),
  "utf8",
);
const globalFooter = readFileSync(
  new URL("../src/components/layout/Footer.tsx", import.meta.url),
  "utf8",
);
const publicSourceLinks = readFileSync(
  new URL("../src/lib/public-source-links.ts", import.meta.url),
  "utf8",
);

test("telas standalone reutilizam o mesmo header e rodapé globais", () => {
  assert.match(headerWrapper, /import \{ HomeEditorialHeader \}/);
  assert.match(headerWrapper, /<HomeEditorialHeader/);
  assert.match(headerWrapper, /advisoryLevel=\{advisoryLevel\}/);
  assert.match(headerWrapper, /officialAlertSeverity=\{officialAlertSeverity\}/);
  assert.doesNotMatch(headerWrapper, /megaMenus|mobileNavItems|footerGroups/);
  assert.match(footerWrapper, /<Footer source=\{source\} \/>/);
  assert.doesNotMatch(footerWrapper, /footerGroups|Fontes e proveniência|variant=/);
});

test("navegação institucional existe em definições canônicas do shell", () => {
  for (const label of [
    "Previsão de hoje",
    "Tempo amanhã",
    "Próximos 7 dias",
    "Estação Embrapa",
    "Satélites e Radares",
    "Câmeras ao vivo",
    "Nível no Laranjal",
    "História das enchentes",
  ]) {
    assert.match(canonicalHeader, new RegExp(label));
  }

  for (const label of [
    "Chuva em Pelotas",
    "Vento em Pelotas",
    "Nível no Laranjal",
    "Enchente de 2024",
    "Tempo na Zona Sul",
    "Clima de Pelotas",
    "Ecossistema MOBI",
  ]) {
    assert.match(globalFooter, new RegExp(label));
  }
});

test("fontes institucionais do footer vêm do registro canônico compartilhado", () => {
  assert.match(globalFooter, /import \{ FOOTER_SOURCE_GROUPS \}/);
  assert.match(globalFooter, /FOOTER_SOURCE_GROUPS\.map/);
  assert.match(globalFooter, /<FooterSourceMap \/>/);

  for (const label of [
    "Embrapa Clima Temperado",
    "REDEMET/DECEA",
    "Defesa Civil RS",
    "Casa Militar RS",
    "MKS / Qualle Control",
    "LabHidroSens/UFPel",
    "Rede Lagoa dos Patos",
    "FURG",
    "Portos RS",
  ]) {
    assert.match(publicSourceLinks, new RegExp(label.replace("/", "\\/")));
  }
});

test("rodapé público não mantém uma implementação alternativa oculta", () => {
  assert.doesNotMatch(globalFooter, /FooterVariant|getFooterLead|editorial-footer-shell/);
  assert.equal((globalFooter.match(/<EmergencyFooterStrip \/>/g) ?? []).length, 1);
  assert.match(globalFooter, /className="tp-home-footer-shell"/);
});
