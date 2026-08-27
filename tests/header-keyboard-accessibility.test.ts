import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const siteHeader = source("src/production/components/site-header.tsx");
const editorialHeader = source("src/production/components/home-editorial-header.tsx");

test("menus do header expõem estado e relação de controle para tecnologias assistivas", () => {
  assert.match(editorialHeader, /aria-expanded=\{isOpen\}/);
  assert.match(editorialHeader, /aria-controls=\{`tp-mega-\$\{menu\.id\}`\}/);
  assert.match(editorialHeader, /id=\{`tp-mega-\$\{menu\.id\}`\}/);
  assert.match(editorialHeader, /aria-expanded=\{mobileOpen\}/);
  assert.match(editorialHeader, /aria-controls="tp-mobile-menu"/);
  assert.match(editorialHeader, /id="tp-mobile-menu"/);
});

test("Escape devolve foco ao controle que abriu painel ocultado", () => {
  assert.match(siteHeader, /function HeaderEscapeFocusRestorer/);
  assert.match(siteHeader, /event\.key !== "Escape"/);
  assert.match(siteHeader, /#tp-mobile-menu, \[id\^="tp-mega-"\]/);
  assert.match(siteHeader, /\[aria-controls=/);
  assert.match(siteHeader, /requestAnimationFrame/);
  assert.match(siteHeader, /focus\(\{ preventScroll: true \}\)/);
  assert.match(siteHeader, /addEventListener\("keydown", restoreFocus, true\)/);
});
