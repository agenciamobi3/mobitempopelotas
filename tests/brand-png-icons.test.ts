import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = readFileSync("src/routes/__root.tsx", "utf8");
const manifest = readFileSync("public/manifest.webmanifest", "utf8");
const canonicalIcon = readFileSync("public/brand/tempo-pelotas-icon.svg", "utf8");
const iconRoute = readFileSync("src/routes/brand/tempo-pelotas-icon[.]png.ts", "utf8");
const maskableRoute = readFileSync("src/routes/brand/tempo-pelotas-maskable[.]png.ts", "utf8");

const CANONICAL_ICON = "/brand/tempo-pelotas-icon.svg";

test("favicon e Apple touch icon usam o mesmo ícone canônico", () => {
  assert.match(root, /rel: "icon",[\s\S]*href: "\/brand\/tempo-pelotas-icon\.svg"/);
  assert.match(root, /type: "image\/svg\+xml"/);
  assert.match(root, /rel: "apple-touch-icon",[\s\S]*href: "\/brand\/tempo-pelotas-icon\.svg"/);
  assert.doesNotMatch(root, /tempo-pelotas-icon\.png/);
});

test("manifest PWA publica uma única identidade compacta", () => {
  const parsed = JSON.parse(manifest) as {
    icons: Array<{ src: string; sizes: string; type: string; purpose: string }>;
  };

  assert.equal(parsed.icons.length, 1);
  assert.deepEqual(parsed.icons[0], {
    src: CANONICAL_ICON,
    sizes: "any",
    type: "image/svg+xml",
    purpose: "any",
  });
});

test("ícone canônico corresponde ao desenho 2026 enviado no commit de marca", () => {
  assert.match(canonicalIcon, /viewBox="0 0 798 927"/);
  assert.match(canonicalIcon, /rgb\(95,45,237\)/);
  assert.match(canonicalIcon, /fill:white/);
});

test("URLs PNG legadas apenas redirecionam para o ícone canônico", () => {
  for (const route of [iconRoute, maskableRoute]) {
    assert.match(route, /const CANONICAL_ICON = "\/brand\/tempo-pelotas-icon\.svg"/);
    assert.match(route, /status: 308/);
    assert.match(route, /Location: CANONICAL_ICON/);
    assert.doesNotMatch(route, /ICON_BASE64|image\/png/);
  }
});

test("não mantém favicon estático concorrente", () => {
  assert.equal(existsSync("public/favicon.ico"), false);
  assert.equal(existsSync("public/brand/favicon_tempopelotas.svg"), false);
});
