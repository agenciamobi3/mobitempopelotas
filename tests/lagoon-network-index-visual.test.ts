import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/nivel-da-lagoa-dos-patos/index.tsx", "utf8");
const page = readFileSync(
  "src/components/hydrology/LagoonHydrologyLocalityPage.tsx",
  "utf8",
);
const styles = readFileSync(
  "src/components/hydrology/LagoonHydrologyNetworkIndex.css",
  "utf8",
);
const heroStyles = readFileSync(
  "src/components/hydrology/LagoonHydrologyNetworkHero.css",
  "utf8",
);

test("o índice da Lagoa usa identidade visual própria sem afetar páginas locais", () => {
  assert.match(route, /LagoonHydrologyNetworkIndex\.css/);
  assert.match(route, /LagoonHydrologyNetworkHero\.css/);
  assert.match(route, /className="lagoon-network-index-shell"/);
  assert.match(styles, /\.lagoon-network-index-shell \.lagoon-locality-page/);
  assert.match(styles, /width: min\(1440px, calc\(100% - 96px\)\)/);
});

test("hero do índice segue o contrato editorial das páginas internas", () => {
  assert.match(heroStyles, /grid-template-columns: minmax\(0, 0\.92fr\) minmax\(430px, 0\.78fr\)/);
  assert.match(heroStyles, /width: 100vw/);
  assert.match(heroStyles, /linear-gradient\(105deg, #f2fbfc/);
  assert.match(heroStyles, /border-radius: 0/);
  assert.match(heroStyles, /font-size: clamp\(2\.85rem, 4\.4vw, 4\.45rem\)/);
  assert.match(heroStyles, /\.lagoon-network-index-hero__facts/);
  assert.match(heroStyles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(heroStyles, /@media \(max-width: 1100px\)/);
  assert.match(heroStyles, /@media \(max-width: 720px\)/);
});

test("hero resume disponibilidade sem repetir provedor como eyebrow", () => {
  assert.match(page, /Níveis da água · Lagoa dos Patos/);
  assert.match(page, /Situação da rede/);
  assert.match(page, /Pontos disponíveis agora/);
  assert.match(page, /Cidades conectadas/);
  assert.match(page, /Cada estação mantém sua régua/);
  assert.doesNotMatch(page, /FURG & Portos RS · rede regional/);
});

test("cinco estações aparecem em uma faixa compacta no desktop", () => {
  assert.match(
    styles,
    /\.lagoon-network-index-shell \.lagoon-network-locality-grid \{[\s\S]*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/,
  );
  assert.match(styles, /min-height: 310px/);
  assert.match(styles, /margin-top: auto/);
});

test("Costa Doce usa grade editorial de cinco colunas e reduz para mobile", () => {
  assert.match(
    styles,
    /\.lagoon-network-index-shell \.lagoon-costa-doce__grid \{[\s\S]*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/,
  );
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(styles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 430px\)/);
  assert.match(styles, /grid-template-columns: 1fr/);
});

test("bloco de interpretação recebe destaque próprio sem voltar ao cardboxing geral", () => {
  assert.match(styles, /\.lagoon-network-index-shell \.lagoon-locality-explainer/);
  assert.match(styles, /background: linear-gradient\(115deg/);
  assert.match(styles, /border-radius: 14px/);
  assert.match(styles, /\.lagoon-network-localities,[\s\S]*border-radius: 0/);
});
