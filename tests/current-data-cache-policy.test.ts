import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const policy = readFileSync("src/lib/current-data-cache.ts", "utf8");
const weather = readFileSync("src/lib/weather/weather-intelligence.functions.ts", "utf8");
const laranjal = readFileSync("src/lib/hydrology/laranjal-level.functions.ts", "utf8");
const guaiba = readFileSync("src/lib/hydrology/guaiba.functions.ts", "utf8");
const lagoon = readFileSync("src/lib/hydrology/lagoon-network.functions.ts", "utf8");
const status = readFileSync("src/lib/status/data-status.functions.ts", "utf8");
const retiredObservationApi = readFileSync("src/routes/api/weather/embrapa.ts", "utf8");

const currentSurfaces = [weather, laranjal, guaiba, lagoon, status];

test("política de dados correntes proíbe cache stale de resposta", () => {
  assert.match(policy, /"Cache-Control": "no-store, no-cache, must-revalidate"/);
  assert.match(policy, /"CDN-Cache-Control": "no-store"/);
  assert.match(policy, /Pragma: "no-cache"/);
  assert.match(policy, /Expires: "0"/);

  for (const source of currentSurfaces) {
    assert.match(source, /CURRENT_DATA_NO_STORE_HEADERS/);
    assert.doesNotMatch(source, /stale-while-revalidate/);
    assert.doesNotMatch(source, /max-age=/);
  }
});

test("endpoint aposentado não pode ser cacheado nem voltar a servir observação", () => {
  assert.match(retiredObservationApi, /"Cache-Control": "no-store, max-age=0"/);
  assert.match(retiredObservationApi, /status: 410/);
  assert.match(retiredObservationApi, /status: "retired"/);
  assert.match(retiredObservationApi, /Defesa Civil RS/);
  assert.doesNotMatch(
    retiredObservationApi,
    /getFreshEmbrapaObservation|fetchEmbrapaObservation|isPublishableEmbrapaObservation/,
  );
});
