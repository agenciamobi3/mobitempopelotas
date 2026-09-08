import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync(
  "src/components/layout/InternalWeatherPageShell.tsx",
  "utf8",
);
const cleanHero = readFileSync(
  "src/components/layout/InternalWeatherCleanHero.css",
  "utf8",
);

test("internal weather shell loads the remaining shared clean hero contract", () => {
  assert.match(
    shell,
    /import "\.\/InternalWeatherPageShell\.css";\s*import "\.\/InternalWeatherCleanHero\.css";/,
  );

  assert.match(cleanHero, /internal-weather-shell--meteogram/);

  for (const namespace of ["today", "tomorrow", "seven-day", "fifteen-day", "rain", "wind"]) {
    assert.doesNotMatch(cleanHero, new RegExp(`internal-weather-shell--${namespace}`));
  }
});

test("shared clean hero now belongs only to the meteogram technical panel", () => {
  assert.match(cleanHero, /Esta folha existe apenas para o Meteograma/);
  assert.match(cleanHero, /\.internal-weather-shell--meteogram \.meteogram-hero/);
  assert.match(
    cleanHero,
    /grid-template-columns:\s*minmax\(0, 1\.12fr\) minmax\(320px, 0\.68fr\) !important/,
  );
  assert.match(
    cleanHero,
    /font-size:\s*clamp\(3rem, 5\.8vw, 6\.2rem\) !important/,
  );
  assert.match(
    cleanHero,
    /\.meteogram-hero__panel article[\s\S]*?border-bottom:\s*1px solid rgb\(7 30 47 \/ 10%\) !important/,
  );
  assert.doesNotMatch(cleanHero, /today-retail-hero|rain-retail-hero|wind-retail-hero/);
});

test("meteogram clean hero remains single-column and readable on small screens", () => {
  assert.match(
    cleanHero,
    /@media \(max-width: 980px\)[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) !important/,
  );
  assert.match(
    cleanHero,
    /@media \(max-width: 720px\)[\s\S]*?width:\s*calc\(100% - 20px\) !important/,
  );
  assert.match(
    cleanHero,
    /@media \(max-width: 520px\)[\s\S]*?width:\s*100% !important/,
  );
  assert.match(cleanHero, /@media \(forced-colors: active\)/);
});
