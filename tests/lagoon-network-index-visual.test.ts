import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/nivel-da-lagoa-dos-patos/index.tsx", "utf8");
const styles = readFileSync(
  "src/components/hydrology/LagoonHydrologyNetworkIndex.css",
  "utf8",
);

test("o índice da Lagoa usa identidade visual própria sem afetar páginas locais", () => {
  assert.match(route, /LagoonHydrologyNetworkIndex\.css/);
  assert.match(route, /className="lagoon-network-index-shell"/);
  assert.match(styles, /\.lagoon-network-index-shell \.lagoon-locality-page/);
  assert.match(styles, /width: min\(1440px, calc\(100% - 96px\)\)/);
});

test("hero do índice ganha composição editorial ampla e responsiva", () => {
  assert.match(styles, /grid-template-areas:/);
  assert.match(styles, /"title copy"/);
  assert.match(styles, /radial-gradient\(circle at 86% 22%/);
  assert.match(styles, /linear-gradient\(130deg/);
  assert.match(styles, /@media \(max-width: 880px\)/);
  assert.match(styles, /"title"\s*\n\s*"copy"/);
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
