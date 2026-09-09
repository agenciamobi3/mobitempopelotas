import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const HERO_PATH = new URL("../src/production/components/weather-hero.tsx", import.meta.url);
const RESOLVER_PATH = new URL("../src/production/lib/hero-photo-presentation.ts", import.meta.url);

const expectedAssets = [
  "/weather/hero/pelotas-laranjal-chuva.webp",
  "/weather/hero/pelotas-noite-chuva.png",
  "/weather/hero/pelotas-noite-tempestade.png",
  "/weather/hero/pelotas-noite-madrugada-nublado.png",
  "/weather/hero/pelotas-meio-dia-nublado.png",
  "/weather/hero/pelotas-nevoeiro-centro.webp",
  "/weather/hero/pelotas-laranjal-ceu-aberto.webp",
  "/weather/hero/pelotas-laranjal-ceu-aberto-noite.webp",
  "/weather/hero/pelotas-parcialmente-nublado.avif",
  "/weather/hero/pelotas parcialmente nublado centro.jpg",
  "/weather/hero/pelotas-dia-parcialmente-bulado.png",
  "/weather/hero/pelotas-laranjal-parcialmente-nublado-sol-entre-nuvens.png",
  "/weather/hero/pelotas-fim-de-tarde-poucas-nuvens.png",
  "/weather/hero/pelotas-madrugada-parcialmente-nublado.png",
];

test("o hero estático usa somente o acervo local de Pelotas", async () => {
  const [hero, resolver] = await Promise.all([
    readFile(HERO_PATH, "utf8"),
    readFile(RESOLVER_PATH, "utf8"),
  ]);

  assert.match(hero, /resolveHeroPhoto/);
  assert.match(hero, /data-photo-kind=\{heroPhoto\.kind\}/);
  assert.doesNotMatch(hero, /commons\.wikimedia|Heavy_Rain|Sunset_over_Calm_Lake|Amanhecer_na_Praia/);

  for (const asset of expectedAssets) {
    assert.ok(resolver.includes(asset), `o resolvedor precisa registrar ${asset}`);
  }

  assert.match(resolver, /if \(isClearNight \|\| icon === "moon"\) \{\s*return heroPhotos\["clear-night"\];/);
  assert.match(resolver, /ceu \(aberto\|limpo\).*noite\|noite.*ceu \(aberto\|limpo\)/);
  assert.match(resolver, /icon !== "partly-cloudy-night"/);
  assert.match(resolver, /if \(icon === "sun"\) \{\s*return heroPhotos\.clear;/);
  assert.match(resolver, /cloudCover >= 50/);
  assert.match(resolver, /MADRUGADA_END_HOUR = 7/);
  assert.match(resolver, /MIDDAY_START_HOUR = 11/);
  assert.match(resolver, /MIDDAY_END_HOUR = 15/);
  assert.match(resolver, /NIGHT_START_HOUR = 19/);
  assert.match(resolver, /FIM_DE_TARDE_START_HOUR = 16/);
  assert.match(resolver, /FIM_DE_TARDE_END_HOUR = 19/);
  assert.match(resolver, /cloudCover < 50/);
  assert.match(resolver, /hour % 2 === 0/);
  assert.match(resolver, /hour % 3/);
  assert.doesNotMatch(resolver, /Math\.random\(/);
  assert.match(resolver, /Acervo Tempo Pelotas · Praia do Laranjal · noite/);
  assert.match(resolver, /Acervo Tempo Pelotas · Praia do Laranjal · sol entre nuvens/);
});
