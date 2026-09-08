import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/quem-somos.tsx", "utf8");
const page = readFileSync("src/components/about/TempoPelotasAboutPage.tsx", "utf8");
const styles = readFileSync("src/components/about/TempoPelotasAboutPage.css", "utf8");
const shell = readFileSync("src/components/layout/ContentPageShell.tsx", "utf8");
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");

test("quem-somos usa um único main fornecido pelo ContentPageShell", () => {
  assert.match(route, /<ContentPageShell pageClassName="content-page-shell--about">/);
  assert.match(shell, /<main id="conteudo-principal"/);
  assert.doesNotMatch(page, /<main\b/);
  assert.match(siteLayout, /"\/quem-somos"/);
});

test("quem-somos explica projeto, MOBI e transparência sem confundir autoria com fonte", () => {
  assert.match(page, /O Tempo Pelotas é um projeto tecnológico da MOBI/);
  assert.match(page, /A autoria da tecnologia não transforma a MOBI na fonte dos dados externos/);
  assert.match(page, /O portal não substitui as instituições responsáveis/);
  assert.match(page, /indisponibilidade em vez de inventar um valor/);
  assert.match(page, /to="\/status-dos-dados"/);
  assert.doesNotMatch(page, /to="\/metodologia"/);
});

test("quem-somos concentra detalhes das fontes na página pública única", () => {
  assert.match(page, /A origem dos dados fica concentrada em uma página pública/);
  assert.match(page, /A página Dados e fontes informa quais serviços estão em uso/);
  assert.doesNotMatch(page, /<DataSourceCard/);
  assert.doesNotMatch(page, /Embrapa Clima Temperado|CPPMet \/ UFPel|REDEMET \/ DECEA|CIEX \/ FURG e redes locais/);
});

test("visual de quem-somos segue o canvas editorial aberto", () => {
  assert.match(styles, /\.about-hero[\s\S]*background:\s*var\(--about-soft\)/);
  assert.match(styles, /\.about-process__steps[\s\S]*border-top:/);
  assert.match(styles, /\.about-directory nav[\s\S]*border-top:/);
  assert.doesNotMatch(styles, /radial-gradient|linear-gradient/);
  assert.doesNotMatch(styles, /box-shadow/);
});
