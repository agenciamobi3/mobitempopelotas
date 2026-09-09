import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const HERO_PATH = new URL("../src/production/components/weather-hero.tsx", import.meta.url);
const HERO_FACTS_PATH = new URL(
  "../src/production/components/weather-hero-facts.css",
  import.meta.url,
);

test("hero indisponível oculta foto, câmera, textos e exibe somente skeleton", async () => {
  const [hero, styles] = await Promise.all([
    readFile(HERO_PATH, "utf8"),
    readFile(HERO_FACTS_PATH, "utf8"),
  ]);

  assert.match(hero, /aria-busy=\{!current\.available\}/);
  assert.match(styles, /:has\(\.tp-home-hero__status\.is-unavailable\)/);
  assert.match(styles, /\.tp-home-hero__photo,/);
  assert.match(styles, /\.tp-home-hero__live-camera,/);
  assert.match(styles, /\.tp-home-hero__overlay,/);
  assert.match(styles, /\.tp-home-hero__credit \{\s*display: none;/);
  assert.match(styles, /\.tp-home-hero__layout \{\s*visibility: hidden;/);
  assert.match(styles, /tp-home-hero-skeleton-shimmer/);
});

test("primeira célula horária permanece identificada como previsão e nunca vira Agora artificialmente", async () => {
  const hero = await readFile(HERO_PATH, "utf8");

  assert.match(hero, /tp-home-hero__hour-time">\{hour\.time\}<\/span>/);
  assert.doesNotMatch(hero, /index === 0 && current\.available \? "Agora"/);
});
