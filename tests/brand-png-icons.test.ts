import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = readFileSync("src/routes/__root.tsx", "utf8");
const manifest = readFileSync("public/manifest.webmanifest", "utf8");
const canonicalSvg = readFileSync("public/brand/tempo-pelotas-icon.svg", "utf8");

const CANONICAL_ICON = "/brand/tempo-pelotas-icon.png";

test("favicon, shortcut icon e Apple touch icon usam o PNG canônico", () => {
  assert.match(root, /rel: "icon",[\s\S]*href: "\/brand\/tempo-pelotas-icon\.png"/);
  assert.match(root, /rel: "shortcut icon",[\s\S]*href: "\/brand\/tempo-pelotas-icon\.png"/);
  assert.match(root, /rel: "apple-touch-icon",[\s\S]*href: "\/brand\/tempo-pelotas-icon\.png"/);
  assert.doesNotMatch(root, /href: "\/brand\/tempo-pelotas-icon\.svg"/);
});

test("PNG canônico existe como asset estático e quadrado", () => {
  const png = readFileSync("public/brand/tempo-pelotas-icon.png");
  assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(png.readUInt32BE(16), 512);
  assert.equal(png.readUInt32BE(20), 512);
  assert.equal(existsSync("src/routes/brand/tempo-pelotas-icon[.]png.ts"), false);
});

test("manifest PWA publica uma única identidade compacta PNG", () => {
  const parsed = JSON.parse(manifest) as {
    icons: Array<{ src: string; sizes: string; type: string; purpose: string }>;
  };

  assert.deepEqual(parsed.icons, [
    {
      src: CANONICAL_ICON,
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
  ]);
});

test("fonte vetorial 2026 permanece como mestre da arte", () => {
  assert.match(canonicalSvg, /viewBox="0 0 798 927"/);
  assert.match(canonicalSvg, /rgb\(95,45,237\)/);
  assert.match(canonicalSvg, /fill:white/);
});

test("não mantém favicon legado concorrente", () => {
  assert.equal(existsSync("public/favicon.ico"), false);
  assert.equal(existsSync("public/brand/favicon_tempopelotas.svg"), false);
});
