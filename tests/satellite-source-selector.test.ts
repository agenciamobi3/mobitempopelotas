import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const map = readFileSync("src/production/components/weather-map.tsx", "utf8");
const css = readFileSync("src/production/components/weather-map.module.css", "utf8");
const route = readFileSync("src/routes/api/redemet/satellite.ts", "utf8");

test("satellite monitor exposes three REDEMET products and the validated GOES INMET source", () => {
  assert.match(map, /value: "realcada", label: "Realçado"/);
  assert.match(map, /value: "ir", label: "Infravermelho"/);
  assert.match(map, /value: "vis", label: "Visível"/);
  assert.match(map, /value: "inmet-ir", label: "GOES \/ INMET"/);
  assert.match(map, /source=inmet&frames=10/);
  assert.match(route, /fetchInmetSatellite/);
  assert.match(route, /searchParams\.get\("source"\) === "inmet"/);
});

test("four-source selector uses four columns on wide screens and two on mobile", () => {
  assert.match(css, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /width:\s*min\(470px, calc\(100% - 96px\)\)/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(css, /!important/);
});
