import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  REGIONAL_DEFESA_CIVIL_DEDICATED_PAGES,
  REGIONAL_DEFESA_CIVIL_STATIONS,
  regionalDefesaCivilDedicatedPage,
  regionalDefesaCivilStationCodes,
} from "../src/lib/hydrology/defesa-civil-regional-pages.ts";

const expected = {
  "turucu-rs": ["DCRS-00126"],
  "cristal-rs": ["DCRS-00125"],
  "jaguarao-rs": ["DCRS-00115"],
  "arroio-grande-rs": ["DCRS-00050", "DCRS-00111"],
  "bage-rs": ["DCRS-00041"],
  "capao-do-leao-rs": ["DCRS-00063"],
  "santa-vitoria-do-palmar-rs": ["DCRS-00049"],
} as const;

test("módulo Defesa Civil é restrito às sete páginas meteorológicas aprovadas", () => {
  assert.deepEqual(REGIONAL_DEFESA_CIVIL_STATIONS, expected);
  assert.equal(Object.keys(REGIONAL_DEFESA_CIVIL_STATIONS).length, 7);
  assert.equal(regionalDefesaCivilStationCodes("pelotas-rs"), null);
});

test("Arroio Grande preserva as duas estações candidatas sem escolher uma por inferência", () => {
  assert.deepEqual(regionalDefesaCivilStationCodes("arroio-grande-rs"), [
    "DCRS-00050",
    "DCRS-00111",
  ]);
});

test("página regional carrega Defesa Civil de forma independente e promove só intenções aprovadas", () => {
  const page = readFileSync("src/components/regional/RegionalCityWeatherPage.tsx", "utf8");
  const module = readFileSync("src/components/regional/RegionalCityDefesaCivil.tsx", "utf8");

  assert.match(page, /RegionalCityDefesaCivil/);
  assert.match(page, /citySlug=\{city\.slug\}/);
  assert.match(module, /fetch\("\/api\/defesa-civil\/stations"/);
  assert.match(module, /sem bloquear a previsão meteorológica/);
  assert.match(module, /não\s+substitui esse vazio por uma estação vizinha/);
  assert.match(module, /referência própria deste ponto/);
  assert.match(module, /não usa esse valor como cota de inundação local/);
  assert.match(module, /regionalDefesaCivilDedicatedPage\(citySlug\)/);
  assert.match(module, /regional-defesa-civil__dedicated-link/);
  assert.doesNotMatch(module, /levelM\s*\?\?\s*0/);

  assert.deepEqual(Object.keys(REGIONAL_DEFESA_CIVIL_DEDICATED_PAGES), [
    "jaguarao-rs",
    "capao-do-leao-rs",
  ]);
  assert.equal(regionalDefesaCivilDedicatedPage("jaguarao-rs")?.path, "/nivel-do-rio-jaguarao");
  assert.equal(
    regionalDefesaCivilDedicatedPage("capao-do-leao-rs")?.path,
    "/nivel-do-canal-sao-goncalo",
  );

  for (const slug of [
    "turucu-rs",
    "cristal-rs",
    "arroio-grande-rs",
    "bage-rs",
    "santa-vitoria-do-palmar-rs",
    "pelotas-rs",
  ]) {
    assert.equal(regionalDefesaCivilDedicatedPage(slug), null);
  }
});
