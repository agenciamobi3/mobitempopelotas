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

test("dedicated internal pages load the shared clean hero contract", () => {
  assert.match(
    shell,
    /import "\.\/InternalWeatherPageShell\.css";\s*import "\.\/InternalWeatherCleanHero\.css";/,
  );

  for (const namespace of ["rain", "wind", "fifteen-day", "meteogram"]) {
    assert.match(cleanHero, new RegExp(`internal-weather-shell--${namespace}`));
  }

  assert.doesNotMatch(cleanHero, /internal-weather-shell--today/);
  assert.doesNotMatch(cleanHero, /internal-weather-shell--tomorrow/);
  assert.doesNotMatch(cleanHero, /internal-weather-shell--seven-day/);
});

test("clean hero follows the flood editorial split without promotional chrome", () => {
  assert.match(cleanHero, /background:\s*#f5f8f8 !important/);
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
    /\.today-retail-hero__current-photo,[\s\S]*?\.today-retail-hero__tiles[\s\S]*?display:\s*none !important/,
  );
  assert.match(
    cleanHero,
    /\.meteogram-hero__panel article[\s\S]*?border-bottom:\s*1px solid rgb\(7 30 47 \/ 10%\) !important/,
  );
});

test("clean hero remains single-column and readable on small screens", () => {
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
});
