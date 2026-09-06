import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  REGIONAL_DEFESA_CIVIL_DEDICATED_PAGES,
  regionalDefesaCivilDedicatedPageByStationCode,
} from "../src/lib/hydrology/defesa-civil-regional-pages.ts";

const network = readFileSync("src/components/hydrology/DefesaCivilHydroNetwork.tsx", "utf8");
const styles = readFileSync("src/components/hydrology/DefesaCivilHydroDedicatedLinks.css", "utf8");

test("dedicated hydrology discovery is keyed by exact Defesa Civil station code", () => {
  assert.equal(
    regionalDefesaCivilDedicatedPageByStationCode("DCRS-00115")?.path,
    "/nivel-do-rio-jaguarao",
  );
  assert.equal(
    regionalDefesaCivilDedicatedPageByStationCode("DCRS-00063")?.path,
    "/nivel-do-canal-sao-goncalo",
  );

  for (const stationCode of [
    "DCRS-00126",
    "DCRS-00125",
    "DCRS-00050",
    "DCRS-00111",
    "DCRS-00041",
    "DCRS-00049",
    "UNKNOWN",
  ]) {
    assert.equal(regionalDefesaCivilDedicatedPageByStationCode(stationCode), null);
  }

  assert.equal(Object.keys(REGIONAL_DEFESA_CIVIL_DEDICATED_PAGES).length, 2);
});

test("regional Defesa Civil cards link only through the approved station registry", () => {
  assert.match(network, /regionalDefesaCivilDedicatedPageByStationCode\(station\.code\)/);
  assert.match(network, /className="defesa-civil-hydro__dedicated-page-link"/);
  assert.match(network, /to=\{dedicatedPage\.path\}/);
  assert.match(network, /\{dedicatedPage\.label\}/);
  assert.doesNotMatch(network, /station\.name[\s\S]{0,160}(nivel-do-rio-jaguarao|nivel-do-canal-sao-goncalo)/);
  assert.doesNotMatch(network, /distanceFromPelotasKm[\s\S]{0,160}dedicatedPage/);
});

test("dedicated page CTA remains keyboard-visible and visually distinct", () => {
  assert.match(styles, /\.defesa-civil-hydro__dedicated-page-link/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /outline:/);
  assert.doesNotMatch(styles, /!important/);
});
