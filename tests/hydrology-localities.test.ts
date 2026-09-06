import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  HYDROLOGY_LOCALITIES,
  findHydrologyLocality,
  findHydrologyLocalityByStationId,
  hydrologyLocalityPath,
} from "../src/lib/hydrology/hydrology-localities.ts";
import { PUBLIC_ROUTES } from "../src/lib/public-routes.ts";

const expected = [
  ["rio-grande", "furg-ccmar"],
  ["sao-lourenco-do-sul", "sao-lourenco-do-sul"],
  ["arambare", "arambare"],
  ["sao-jose-do-norte", "sao-jose-do-norte"],
  ["itapua-viamao", "itapua"],
] as const;

test("registry hidrológico publica exatamente as cinco localidades verificadas da rede", () => {
  assert.equal(HYDROLOGY_LOCALITIES.length, expected.length);
  assert.deepEqual(
    HYDROLOGY_LOCALITIES.map((locality) => [locality.slug, locality.stationId]),
    expected,
  );
});

test("cada localidade possui lookup bidirecional e path canônico", () => {
  for (const locality of HYDROLOGY_LOCALITIES) {
    assert.equal(findHydrologyLocality(locality.slug)?.stationId, locality.stationId);
    assert.equal(findHydrologyLocalityByStationId(locality.stationId)?.slug, locality.slug);
    assert.equal(hydrologyLocalityPath(locality), `/nivel-da-lagoa-dos-patos/${locality.slug}`);
  }
  assert.equal(findHydrologyLocality("cidade-inventada"), null);
  assert.equal(findHydrologyLocalityByStationId("sensor-inventado"), null);
});

test("hub e páginas locais estão no inventário público indexável", () => {
  const paths = new Set(PUBLIC_ROUTES.map((route) => route.path));
  assert.ok(paths.has("/nivel-da-lagoa-dos-patos"));
  for (const locality of HYDROLOGY_LOCALITIES) assert.ok(paths.has(hydrologyLocalityPath(locality)));
});

test("rota dinâmica valida slug pelo registry e páginas preservam referências locais", () => {
  const route = readFileSync("src/routes/nivel-da-lagoa-dos-patos/$localitySlug.tsx", "utf8");
  const page = readFileSync("src/components/hydrology/LagoonHydrologyLocalityPage.tsx", "utf8");
  assert.match(route, /findHydrologyLocality\(params\.localitySlug\)/);
  assert.match(route, /throw notFound\(\)/);
  assert.match(page, /não converte uma leitura na outra/);
  assert.match(page, /não soma, subtrai ou converte automaticamente/);
});

test("somente cidades meteorológicas verificadas recebem associação de águas", () => {
  assert.deepEqual(
    HYDROLOGY_LOCALITIES.filter((locality) => locality.weatherCitySlug).map((locality) => locality.weatherCitySlug),
    ["rio-grande-rs", "sao-lourenco-do-sul-rs", "sao-jose-do-norte-rs"],
  );
});
