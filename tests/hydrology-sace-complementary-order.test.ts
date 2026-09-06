import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/situacao-hidrologica-pelotas.tsx", "utf8");
const sace = readFileSync("src/components/hydrology/SaceGuaibaContext.tsx", "utf8");

test("Defesa Civil RS precedes SACE Guaíba in the public hydrology composition", () => {
  const defesaBoundary = route.indexOf(
    '<HydrologySectionBoundary label="Rede da Defesa Civil RS">',
  );
  const saceBoundary = route.indexOf(
    '<HydrologySectionBoundary label="Contexto complementar · SACE Guaíba">',
  );

  assert.ok(defesaBoundary >= 0, "A seção da Defesa Civil RS deve permanecer na composição pública.");
  assert.ok(saceBoundary >= 0, "A seção complementar do SACE Guaíba deve permanecer na composição pública.");
  assert.ok(
    defesaBoundary < saceBoundary,
    "A Rede da Defesa Civil RS deve aparecer antes do contexto complementar do SACE Guaíba.",
  );
});

test("the SACE copy and rendering contract keep its complementary role explicit", () => {
  assert.match(route, /SaceGuaibaRenderScope render=\{false\}/);
  assert.match(route, /<SaceGuaibaContext data=\{data\.sace\} \/>/);
  assert.match(route, /Qual é o papel do SACE Guaíba nesta página\?/);
  assert.match(route, /O SACE é usado como contexto complementar a montante/);
  assert.match(sace, /const SaceGuaibaRenderContext = createContext\(true\)/);
  assert.match(sace, /if \(!shouldRender\) return null/);
  assert.match(sace, /Contexto complementar a montante · SGB/);
  assert.match(
    sace,
    /essa rede complementa o quadro regional depois das leituras da\s+Defesa Civil RS/,
  );
  assert.match(sace, /Leitura regional complementar, não previsão para o Laranjal/);
});
