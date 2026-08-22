import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const header = readFileSync("src/production/components/home-editorial-header.tsx", "utf8");
const styles = readFileSync("src/production/components/home-editorial-header.css", "utf8");

const requiredPublicNavigationPaths = [
  "/tempo-hoje-pelotas",
  "/tempo-amanha-pelotas",
  "/previsao-7-dias-pelotas",
  "/chuva-em-pelotas",
  "/vento-em-pelotas",
  "/meteograma-pelotas",
  "/radar-e-satelite-pelotas",
  "/estacao-embrapa-pelotas",
  "/mapa-de-geadas-rio-grande-do-sul",
  "/cameras-ao-vivo-pelotas",
  "/alertas",
  "/situacao-hidrologica-pelotas",
  "/nivel-da-lagoa-dos-patos-laranjal",
  "/enchente-2024-pelotas-laranjal",
  "/tempo-na-regiao-sul-rs",
  "/clima-em-pelotas",
  "/historico-climatico-pelotas",
  "/blog",
  "/status-dos-dados",
  "/metodologia",
] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("megamenu groups the public weather inventory into editorial areas", () => {
  for (const label of ["Previsão", "Monitoramento", "Águas", "Região", "Explorar"]) {
    assert.match(header, new RegExp(`label: "${label}"`));
  }

  for (const path of requiredPublicNavigationPaths) {
    assert.match(header, new RegExp(escapeRegExp(path)), `Menu deve expor ${path}`);
  }
});

test("desktop megamenu is keyboard aware and exposes current navigation state", () => {
  assert.match(header, /aria-expanded=\{isOpen\}/);
  assert.match(header, /aria-controls=\{`tp-mega-\$\{menu\.id\}`\}/);
  assert.match(header, /hidden=\{!isOpen\}/);
  assert.match(header, /onBlur=\{\(event\) =>/);
  assert.match(header, /document\.addEventListener\("keydown", closeOnEscape\)/);
  assert.match(header, /aria-current=\{active \? "page" : undefined\}/);
});

test("mobile navigation reuses the same megamenu inventory instead of a parallel list", () => {
  assert.match(header, /id="tp-mobile-menu"/);
  assert.match(header, /aria-expanded=\{mobileOpen\}/);
  assert.match(header, /\{megaMenus\.map\(\(menu\) =>/);
  assert.match(header, /menu\.sections\.flatMap/);
  assert.match(styles, /@media \(max-width: 1040px\)/);
  assert.match(styles, /\.tp-home-header__nav \{[\s\S]*display: none/);
  assert.match(styles, /\.tp-home-header__mobile-menu/);
});

test("megamenu keeps editorial accessibility and motion contracts", () => {
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(styles, /!important/);
});
