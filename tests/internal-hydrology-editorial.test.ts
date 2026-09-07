import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stationStyles = readFileSync(
  "src/components/hydrology/DefesaCivilStationHydrologyPage.css",
  "utf8",
);
const guaibaStyles = readFileSync("src/components/hydrology/GuaibaLevelPage.css", "utf8");
const lagoonStyles = readFileSync(
  "src/components/hydrology/LagoonHydrologyLocalityPage.css",
  "utf8",
);
const stationPage = readFileSync(
  "src/components/hydrology/DefesaCivilStationHydrologyPage.tsx",
  "utf8",
);
const lagoonPage = readFileSync(
  "src/components/hydrology/LagoonHydrologyLocalityPage.tsx",
  "utf8",
);

test("internal hydrology heroes share the clean editorial surface", () => {
  for (const styles of [stationStyles, guaibaStyles, lagoonStyles]) {
    assert.match(styles, /#f5f8f8/);
    assert.match(styles, /border-bottom:/);
    assert.doesNotMatch(styles, /box-shadow:/);
    assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  }
});

test("station pages keep current, stale and unavailable readings explicit", () => {
  assert.match(stationPage, /Leitura recente/);
  assert.match(stationPage, /Leitura atrasada/);
  assert.match(stationPage, /Leitura antiga/);
  assert.match(stationPage, /Leitura não disponível agora/);
  assert.match(stationPage, /não troca a ausência\s+por zero/);
});

test("lagoon pages keep local station references instead of a synthetic lagoon level", () => {
  assert.match(lagoonPage, /não possui um único número válido para toda a sua extensão/);
  assert.match(lagoonPage, /não soma, subtrai ou converte automaticamente as leituras entre cidades/);
  assert.match(lagoonPage, /Uma estação não substitui as outras/);
  assert.match(lagoonPage, /Cota local publicada/);
});
